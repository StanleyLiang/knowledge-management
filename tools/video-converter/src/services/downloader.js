import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';

/** Maximum download size: 5 GB */
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024 * 1024;

/** Blocked hostnames for SSRF protection. */
const BLOCKED_HOSTS = [
  '169.254.169.254', // Cloud metadata
  'metadata.google.internal',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

/**
 * Validate an HTTP URL against SSRF attacks.
 * @param {string} url
 */
function validateHttpUrl(url) {
  const parsed = new URL(url);

  if (BLOCKED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Blocked URL: ${parsed.hostname} is not allowed`);
  }

  // Block private IP ranges
  if (
    parsed.hostname.startsWith('10.') ||
    parsed.hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)
  ) {
    throw new Error(`Blocked URL: private IP range is not allowed`);
  }
}

/**
 * Create a transform stream that enforces a maximum byte limit.
 * @param {number} maxBytes
 * @returns {Transform}
 */
function createSizeLimitStream(maxBytes) {
  let totalBytes = 0;
  return new Transform({
    transform(chunk, encoding, callback) {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        callback(
          new Error(
            `Download exceeds maximum size of ${(maxBytes / 1024 / 1024).toFixed(0)} MB`,
          ),
        );
      } else {
        callback(null, chunk);
      }
    },
  });
}

/**
 * Parse an S3 URI into bucket and key.
 * @param {string} uri - e.g. "s3://my-bucket/path/to/file.mp4"
 * @returns {{ bucket: string, key: string }}
 */
function parseS3Uri(uri) {
  const url = new URL(uri);
  return {
    bucket: url.hostname,
    key: url.pathname.slice(1), // remove leading "/"
  };
}

/**
 * Download a file from S3 to a local path.
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} uri - S3 URI (s3://bucket/key)
 * @param {string} destPath - Local destination path
 */
async function downloadFromS3(s3Client, uri, destPath) {
  const { bucket, key } = parseS3Uri(uri);

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!response.Body) {
    throw new Error(`Empty response body from S3 for ${uri}`);
  }

  const readStream =
    response.Body instanceof Readable
      ? response.Body
      : Readable.fromWeb(response.Body);

  await pipeline(
    readStream,
    createSizeLimitStream(MAX_DOWNLOAD_BYTES),
    fs.createWriteStream(destPath),
  );
}

/**
 * Download a file from an HTTP(S) URL to a local path.
 * @param {string} url - HTTP(S) URL
 * @param {string} destPath - Local destination path
 */
async function downloadFromHttp(url, destPath) {
  validateHttpUrl(url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error(`Empty response body from ${url}`);
  }

  const readStream = Readable.fromWeb(response.body);
  await pipeline(
    readStream,
    createSizeLimitStream(MAX_DOWNLOAD_BYTES),
    fs.createWriteStream(destPath),
  );
}

/**
 * Download the input MP4 file from S3 or HTTP(S) URL.
 * @param {import('../config.js').Config} config
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} inputUrl - S3 URI or HTTP(S) URL
 * @param {string} jobId
 * @returns {Promise<string>} Absolute path to the downloaded file
 */
export async function downloadInput(config, s3Client, inputUrl, jobId) {
  const jobDir = path.join(config.tempDir, jobId);
  await fs.promises.mkdir(jobDir, { recursive: true });

  const destPath = path.join(jobDir, 'input.mp4');

  if (inputUrl.startsWith('s3://')) {
    console.log(`[download] Downloading from S3: ${inputUrl}`);
    await downloadFromS3(s3Client, inputUrl, destPath);
  } else if (
    inputUrl.startsWith('http://') ||
    inputUrl.startsWith('https://')
  ) {
    console.log(`[download] Downloading from HTTP: ${inputUrl}`);
    await downloadFromHttp(inputUrl, destPath);
  } else {
    throw new Error(`Unsupported input URL scheme: ${inputUrl}`);
  }

  const stats = await fs.promises.stat(destPath);
  console.log(
    `[download] Downloaded ${(stats.size / 1024 / 1024).toFixed(1)} MB to ${destPath}`,
  );

  return destPath;
}
