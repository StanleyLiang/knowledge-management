import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load and validate environment-based configuration.
 * Fails fast at startup if required vars are missing.
 */
export function loadConfig() {
  const required = ['S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const config = {
    // NATS
    natsUrl: process.env.NATS_URL || 'nats://localhost:4222',
    natsStream: process.env.NATS_STREAM || 'VIDEO_CONVERT',
    natsSubject: process.env.NATS_SUBJECT || 'video.convert',
    natsDurableName: process.env.NATS_DURABLE_NAME || 'video-converter',
    natsStatusSubjectPrefix:
      process.env.NATS_STATUS_SUBJECT_PREFIX || 'video.convert.status',
    natsCancelSubjectPrefix:
      process.env.NATS_CANCEL_SUBJECT_PREFIX || 'video.convert.cancel',

    // S3
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',

    // Paths
    tempDir: process.env.TEMP_DIR || '/tmp/video-converter',

    // Health
    healthPort: parseInt(process.env.HEALTH_PORT || '8080', 10),

    // Timeouts
    shutdownTimeoutMs: parseInt(
      process.env.SHUTDOWN_TIMEOUT_MS || '30000',
      10,
    ),
    variantTimeoutMs: parseInt(
      process.env.VARIANT_TIMEOUT_MS || '300000',
      10,
    ),

    // NATS Stream settings
    streamMaxAgeSeconds: parseInt(
      process.env.STREAM_MAX_AGE_SECONDS || '86400',
      10,
    ),
    ackWaitMs: parseInt(process.env.ACK_WAIT_MS || '300000', 10),
    maxDeliver: parseInt(process.env.MAX_DELIVER || '3', 10),

    // HLS defaults
    hls: {
      segmentDuration: parseInt(
        process.env.HLS_SEGMENT_DURATION || '10',
        10,
      ),
    },
  };

  return Object.freeze(config);
}
