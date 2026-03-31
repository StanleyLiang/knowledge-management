import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'fluent-ffmpeg';

const execFileAsync = promisify(execFile);

/**
 * Custom error for permanent failures that should not be retried.
 */
export class PermanentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermanentError';
  }
}

/**
 * Custom error for cancellation.
 */
export class CancelledError extends Error {
  constructor(message = 'Job cancelled') {
    super(message);
    this.name = 'CancelledError';
  }
}

/**
 * ABR variant definitions, ordered from lowest to highest resolution.
 */
export const VARIANTS = [
  {
    name: '360p',
    width: 640,
    height: 360,
    videoBitrate: 800,
    audioBitrate: 96,
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    videoBitrate: 1400,
    audioBitrate: 128,
  },
  {
    name: '720p',
    width: 1280,
    height: 720,
    videoBitrate: 2800,
    audioBitrate: 128,
  },
  {
    name: '1080p',
    width: 1920,
    height: 1080,
    videoBitrate: 5000,
    audioBitrate: 192,
  },
];

/** FFmpeg stderr patterns that indicate permanent (non-retryable) failures. */
const PERMANENT_ERROR_PATTERNS = [
  /invalid data found/i,
  /unsupported codec/i,
  /codec not currently supported/i,
  /could not find codec/i,
  /no such file or directory/i,
  /invalid argument/i,
  /unrecognized option/i,
  /does not contain any stream/i,
];

/**
 * Probe input file using ffprobe to get video metadata.
 * Also serves as the first validation check — corrupt or unsupported files
 * will fail here and throw PermanentError.
 *
 * @param {string} inputPath - Absolute path to the input file
 * @returns {Promise<{ width: number, height: number, duration: number }>}
 */
export async function probeInput(inputPath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,duration',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      inputPath,
    ]);

    const data = JSON.parse(stdout);
    const stream = data.streams?.[0];

    if (!stream || !stream.width || !stream.height) {
      throw new PermanentError(
        `No video stream found in ${path.basename(inputPath)}`,
      );
    }

    const duration = parseFloat(
      stream.duration || data.format?.duration || '0',
    );

    console.log(
      `[probe] ${path.basename(inputPath)}: ${stream.width}x${stream.height}, ${duration.toFixed(1)}s`,
    );

    return {
      width: stream.width,
      height: stream.height,
      duration,
    };
  } catch (err) {
    if (err instanceof PermanentError) throw err;
    throw new PermanentError(
      `Failed to probe input file: ${err.message}`,
    );
  }
}

/**
 * Filter variants based on source resolution.
 * Uses the short edge (min of width, height) as the baseline to correctly
 * handle landscape, portrait, and square videos.
 *
 * @param {typeof VARIANTS} variants
 * @param {number} sourceWidth
 * @param {number} sourceHeight
 * @returns {typeof VARIANTS}
 */
export function filterVariants(variants, sourceWidth, sourceHeight) {
  const shortEdge = Math.min(sourceWidth, sourceHeight);

  const applicable = variants.filter((v) => v.height <= shortEdge);

  if (applicable.length === 0) {
    // Source is smaller than all variants; use the lowest as fallback
    return [variants[0]];
  }

  return applicable;
}

/**
 * Convert a single variant using FFmpeg.
 *
 * @param {string} inputPath - Path to input MP4
 * @param {string} outputDir - Base output directory for the job
 * @param {typeof VARIANTS[number]} variant - Variant config
 * @param {{ segmentDuration: number }} options - HLS options
 * @param {{ onProgress: (percent: number) => void, signal: AbortSignal, variantTimeoutMs: number }} callbacks
 * @returns {Promise<string>} Path to the variant output directory
 */
export async function convertVariant(
  inputPath,
  outputDir,
  variant,
  options,
  { onProgress, signal, variantTimeoutMs },
) {
  const variantDir = path.join(outputDir, variant.name);
  await fs.promises.mkdir(variantDir, { recursive: true });

  const playlistPath = path.join(variantDir, 'playlist.m3u8');
  const segmentPattern = path.join(variantDir, 'segment_%03d.ts');

  return new Promise((resolve, reject) => {
    let lastProgressAt = Date.now();
    let timeoutTimer = null;
    let settled = false;

    // Declare onAbort early so settle() can remove the listener
    let onAbort;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer) clearInterval(timeoutTimer);
      if (onAbort) signal.removeEventListener('abort', onAbort);
      fn(value);
    };

    // Check abort before building the command
    if (signal.aborted) {
      reject(new CancelledError());
      return;
    }

    const command = ffmpeg(inputPath)
      .outputOptions([
        `-vf`,
        `scale=${variant.width}:${variant.height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-b:v',
        `${variant.videoBitrate}k`,
        '-c:a',
        'aac',
        '-b:a',
        `${variant.audioBitrate}k`,
        '-hls_time',
        String(options.segmentDuration),
        '-hls_playlist_type',
        'vod',
        '-hls_segment_filename',
        segmentPattern,
        '-f',
        'hls',
      ])
      .output(playlistPath)
      .on('progress', (info) => {
        lastProgressAt = Date.now();
        const percent =
          typeof info.percent === 'number' ? Math.round(info.percent) : -1;
        onProgress(percent);
      })
      .on('end', () => {
        console.log(`[convert] ${variant.name} completed`);
        settle(resolve, variantDir);
      })
      .on('error', (err, stdout, stderr) => {
        const errMsg = stderr || err.message;

        // Check for permanent errors
        const isPermanent = PERMANENT_ERROR_PATTERNS.some((pattern) =>
          pattern.test(errMsg),
        );
        if (isPermanent) {
          settle(
            reject,
            new PermanentError(
              `FFmpeg permanent error for ${variant.name}: ${errMsg}`,
            ),
          );
        } else {
          settle(
            reject,
            new Error(`FFmpeg error for ${variant.name}: ${errMsg}`),
          );
        }
      });

    // Handle abort signal (cancel)
    onAbort = () => {
      console.log(`[convert] Aborting ${variant.name} due to cancel signal`);
      command.kill('SIGKILL');
      settle(reject, new CancelledError());
    };

    signal.addEventListener('abort', onAbort, { once: true });

    // Per-variant timeout: kill FFmpeg if no progress for too long
    timeoutTimer = setInterval(() => {
      const elapsed = Date.now() - lastProgressAt;
      if (elapsed > variantTimeoutMs) {
        console.log(
          `[convert] ${variant.name} timed out (no progress for ${(elapsed / 1000).toFixed(0)}s)`,
        );
        command.kill('SIGKILL');
        settle(
          reject,
          new Error(
            `FFmpeg timeout for ${variant.name}: no progress for ${(elapsed / 1000).toFixed(0)}s`,
          ),
        );
      }
    }, 10_000); // Check every 10 seconds

    console.log(
      `[convert] Starting ${variant.name} (${variant.width}x${variant.height}, ${variant.videoBitrate}kbps)`,
    );
    command.run();
  });
}

/**
 * Generate an HLS master playlist that references completed variant playlists.
 *
 * @param {string} outputDir - Base output directory for the job
 * @param {typeof VARIANTS} completedVariants - Variants that have been completed
 * @returns {Promise<string>} Path to the master playlist
 */
export async function generateMasterPlaylist(outputDir, completedVariants) {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3', ''];

  for (const variant of completedVariants) {
    const bandwidth = (variant.videoBitrate + variant.audioBitrate) * 1000;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${variant.width}x${variant.height}`,
    );
    lines.push(`${variant.name}/playlist.m3u8`);
    lines.push('');
  }

  const masterPath = path.join(outputDir, 'master.m3u8');
  await fs.promises.writeFile(masterPath, lines.join('\n'), 'utf-8');

  console.log(
    `[convert] Master playlist updated with ${completedVariants.length} variant(s)`,
  );

  return masterPath;
}
