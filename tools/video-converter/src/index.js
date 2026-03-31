import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { S3Client } from '@aws-sdk/client-s3';
import { JSONCodec } from 'nats';

import { loadConfig } from './config.js';
import {
  createNatsConnection,
  ensureStream,
  createConsumer,
  publishStatus,
  subscribeCancelSubject,
  drainConnection,
} from './nats/consumer.js';
import { downloadInput } from './services/downloader.js';
import {
  VARIANTS,
  probeInput,
  filterVariants,
  convertVariant,
  generateMasterPlaylist,
  PermanentError,
  CancelledError,
} from './services/converter.js';
import {
  uploadVariant,
  uploadMasterPlaylist,
  checkCompletedVariants,
} from './services/uploader.js';
import { cleanupJob } from './utils/cleanup.js';

const jc = JSONCodec();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = loadConfig();

  // Ensure temp directory exists
  await fs.promises.mkdir(config.tempDir, { recursive: true });

  // Create S3 client
  const s3Client = new S3Client({
    endpoint: config.s3Endpoint,
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKey,
      secretAccessKey: config.s3SecretKey,
    },
    forcePathStyle: config.s3ForcePathStyle,
  });

  // Connect to NATS
  const nc = await createNatsConnection(config);
  let natsConnected = true;

  nc.closed().then(() => {
    natsConnected = false;
  });

  // Ensure stream & create consumer
  await ensureStream(nc, config);
  const consumer = await createConsumer(nc, config);

  // Start health server
  const healthServer = startHealthServer(config, () => natsConnected);

  // Graceful shutdown
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[worker] Received ${signal}, shutting down gracefully...`);

    // Stop pulling new messages
    consumer.stop();

    const timeout = setTimeout(() => {
      console.error('[worker] Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, config.shutdownTimeoutMs);

    try {
      await drainConnection(nc);
    } catch (err) {
      console.error(`[worker] Error during drain: ${err.message}`);
    }

    clearTimeout(timeout);
    healthServer.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ---------------------------------------------------------------------------
  // Processing loop
  // ---------------------------------------------------------------------------

  console.log('[worker] Ready, waiting for jobs...');

  for await (const msg of consumer) {
    // Parse job payload
    let job;
    try {
      job = jc.decode(msg.data);
    } catch (err) {
      console.error(`[worker] Failed to parse message: ${err.message}`);
      msg.term();
      continue;
    }

    const { jobId, inputUrl, outputBucket, outputPrefix } = job;

    if (!jobId || !inputUrl || !outputBucket || !outputPrefix) {
      console.error('[worker] Invalid job payload, missing required fields');
      msg.term();
      continue;
    }

    const segmentDuration =
      job.hlsSegmentDuration ?? config.hls.segmentDuration;
    const outputDir = path.join(config.tempDir, jobId, 'output');

    console.log(`[worker] Processing job "${jobId}"`);

    // Set up cancel mechanism
    const abortController = new AbortController();
    const cancelSub = subscribeCancelSubject(nc, config, jobId, () =>
      abortController.abort(),
    );

    try {
      // === Download ===
      publishStatus(nc, config, {
        jobId,
        status: 'downloading',
        currentVariant: null,
        completedVariants: [],
        progress: 0,
        playlistUrl: null,
        error: null,
      });

      const inputPath = await downloadInput(config, s3Client, inputUrl, jobId);

      // === Probe source resolution & filter variants ===
      const sourceInfo = await probeInput(inputPath);
      const applicableVariants = filterVariants(
        VARIANTS,
        sourceInfo.width,
        sourceInfo.height,
      );

      console.log(
        `[worker] Source: ${sourceInfo.width}x${sourceInfo.height}, variants: [${applicableVariants.map((v) => v.name).join(', ')}]`,
      );

      // === Check S3 for already completed variants (resume) ===
      const alreadyDoneNames = await checkCompletedVariants(
        s3Client,
        outputBucket,
        outputPrefix,
        applicableVariants,
      );
      const completedVariants = applicableVariants.filter((v) =>
        alreadyDoneNames.includes(v.name),
      );

      if (completedVariants.length > 0) {
        console.log(
          `[worker] Resuming: ${completedVariants.map((v) => v.name).join(', ')} already done`,
        );
        publishStatus(nc, config, {
          jobId,
          status: 'converting',
          currentVariant: null,
          completedVariants: completedVariants.map((v) => v.name),
          progress: 0,
          playlistUrl: `s3://${outputBucket}/${outputPrefix}master.m3u8`,
          error: null,
        });
      }

      // === Progressive conversion ===
      await fs.promises.mkdir(outputDir, { recursive: true });

      // Determine which variants still need processing
      const remainingVariants = applicableVariants.filter(
        (v) => !alreadyDoneNames.includes(v.name),
      );

      // Throttle status publishes: at most every 5 seconds
      let lastStatusPublishAt = 0;
      const STATUS_THROTTLE_MS = 5000;

      for (const variant of remainingVariants) {

        // Check cancel before starting each variant
        if (abortController.signal.aborted) {
          throw new CancelledError();
        }

        // Publish converting status
        publishStatus(nc, config, {
          jobId,
          status: 'converting',
          currentVariant: variant.name,
          completedVariants: completedVariants.map((v) => v.name),
          progress: 0,
          playlistUrl:
            completedVariants.length > 0
              ? `s3://${outputBucket}/${outputPrefix}master.m3u8`
              : null,
          error: null,
        });

        // Convert variant
        await convertVariant(
          inputPath,
          outputDir,
          variant,
          { segmentDuration },
          {
            onProgress: (percent) => {
              msg.working(); // Reset NATS ack timer

              const now = Date.now();
              if (now - lastStatusPublishAt > STATUS_THROTTLE_MS) {
                lastStatusPublishAt = now;
                publishStatus(nc, config, {
                  jobId,
                  status: 'converting',
                  currentVariant: variant.name,
                  completedVariants: completedVariants.map((v) => v.name),
                  progress: percent,
                  playlistUrl:
                    completedVariants.length > 0
                      ? `s3://${outputBucket}/${outputPrefix}master.m3u8`
                      : null,
                  error: null,
                });
              }
            },
            signal: abortController.signal,
            variantTimeoutMs: config.variantTimeoutMs,
          },
        );

        // Upload variant
        publishStatus(nc, config, {
          jobId,
          status: 'uploading',
          currentVariant: variant.name,
          completedVariants: completedVariants.map((v) => v.name),
          progress: 100,
          playlistUrl:
            completedVariants.length > 0
              ? `s3://${outputBucket}/${outputPrefix}master.m3u8`
              : null,
          error: null,
        });

        await uploadVariant(
          s3Client,
          outputDir,
          variant.name,
          outputBucket,
          outputPrefix,
        );

        // Update master playlist with all completed variants so far
        completedVariants.push(variant);
        await generateMasterPlaylist(outputDir, completedVariants);
        await uploadMasterPlaylist(
          s3Client,
          outputDir,
          outputBucket,
          outputPrefix,
        );

        // Notify: this variant is done, playlist is playable
        const isLast =
          variant === remainingVariants[remainingVariants.length - 1];
        publishStatus(nc, config, {
          jobId,
          status: isLast ? 'completed' : 'converting',
          currentVariant: isLast ? null : variant.name,
          completedVariants: completedVariants.map((v) => v.name),
          progress: isLast ? 100 : 0,
          playlistUrl: `s3://${outputBucket}/${outputPrefix}master.m3u8`,
          error: null,
        });
      }

      // Edge case: all variants were already done from resume
      if (remainingVariants.length === 0) {
        publishStatus(nc, config, {
          jobId,
          status: 'completed',
          currentVariant: null,
          completedVariants: completedVariants.map((v) => v.name),
          progress: 100,
          playlistUrl: `s3://${outputBucket}/${outputPrefix}master.m3u8`,
          error: null,
        });
      }

      msg.ack();
      console.log(`[worker] Job "${jobId}" completed successfully`);
    } catch (err) {
      if (err instanceof CancelledError) {
        console.log(`[worker] Job "${jobId}" cancelled`);
        publishStatus(nc, config, {
          jobId,
          status: 'cancelled',
          currentVariant: null,
          completedVariants: [],
          progress: 0,
          playlistUrl: null,
          error: 'Job cancelled by user',
        });
        msg.ack(); // Don't redeliver cancelled jobs
      } else if (err instanceof PermanentError) {
        console.error(
          `[worker] Job "${jobId}" permanent failure: ${err.message}`,
        );
        publishStatus(nc, config, {
          jobId,
          status: 'failed',
          currentVariant: null,
          completedVariants: [],
          progress: 0,
          playlistUrl: null,
          error: err.message,
        });
        msg.term(); // Don't redeliver — will always fail
      } else {
        console.error(
          `[worker] Job "${jobId}" transient failure: ${err.message}`,
        );
        publishStatus(nc, config, {
          jobId,
          status: 'failed',
          currentVariant: null,
          completedVariants: [],
          progress: 0,
          playlistUrl: null,
          error: err.message,
        });
        msg.nak(); // Redeliver to another pod (with variant-level resume)
      }
    } finally {
      cancelSub.unsubscribe();
      await cleanupJob(config, jobId);
    }
  }
}

// ---------------------------------------------------------------------------
// Health server
// ---------------------------------------------------------------------------

function startHealthServer(config, isNatsConnected) {
  const server = http.createServer((req, res) => {
    if (req.url === '/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else if (req.url === '/readyz' && req.method === 'GET') {
      if (isNatsConnected()) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ready' }));
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'not ready' }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(config.healthPort, () => {
    console.log(`[health] Listening on port ${config.healthPort}`);
  });

  return server;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error(`[worker] Fatal error: ${err.message}`);
  process.exit(1);
});
