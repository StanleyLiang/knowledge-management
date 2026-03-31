import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connect, JSONCodec } from 'nats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jc = JSONCodec();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '3000', 10);
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const NATS_WS_URL = process.env.NATS_WS_URL || 'ws://localhost:9222';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';

const NATS_STREAM = 'VIDEO_CONVERT';
const NATS_SUBJECT = 'video.convert';
const S3_BUCKET = 'videos';

// ---------------------------------------------------------------------------
// S3 Client
// ---------------------------------------------------------------------------

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: 'us-east-1',
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
  forcePathStyle: true,
});

// ---------------------------------------------------------------------------
// Multer (disk storage to avoid memory issues with large files)
// ---------------------------------------------------------------------------

const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 files are accepted'));
    }
  },
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Connect to NATS
  const nc = await connect({ servers: NATS_URL, name: 'video-demo' });
  console.log(`[demo] Connected to NATS at ${NATS_URL}`);

  // Ensure JetStream stream exists
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.info(NATS_STREAM);
    console.log(`[demo] Stream "${NATS_STREAM}" exists`);
  } catch {
    await jsm.streams.add({
      name: NATS_STREAM,
      subjects: [NATS_SUBJECT],
      retention: 'workqueue',
      max_age: 86400 * 1_000_000_000,
    });
    console.log(`[demo] Stream "${NATS_STREAM}" created`);
  }

  const js = nc.jetstream();

  // Create uploads dir
  await fs.promises.mkdir(path.join(__dirname, 'uploads'), { recursive: true });

  // ---------------------------------------------------------------------------
  // Express
  // ---------------------------------------------------------------------------

  const app = express();

  // Serve static frontend
  app.use(express.static(path.join(__dirname, 'public')));

  // Runtime config for the frontend
  app.get('/api/config', (_req, res) => {
    res.json({
      natsWsUrl: NATS_WS_URL,
      minioPublicUrl: MINIO_PUBLIC_URL,
    });
  });

  // Upload MP4 → MinIO → publish NATS job
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const jobId = crypto.randomUUID();
    const s3Key = `uploads/${jobId}.mp4`;

    try {
      // Stream upload to MinIO
      const fileStream = fs.createReadStream(req.file.path);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: fileStream,
          ContentType: 'video/mp4',
        }),
      );
      console.log(`[demo] Uploaded ${req.file.originalname} → s3://${S3_BUCKET}/${s3Key}`);

      // Publish conversion job to NATS JetStream
      const jobPayload = {
        jobId,
        inputUrl: `s3://${S3_BUCKET}/${s3Key}`,
        outputBucket: S3_BUCKET,
        outputPrefix: `hls/${jobId}/`,
      };

      await js.publish(NATS_SUBJECT, jc.encode(jobPayload));
      console.log(`[demo] Published job "${jobId}" to ${NATS_SUBJECT}`);

      const hlsUrl = `${MINIO_PUBLIC_URL}/${S3_BUCKET}/hls/${jobId}/master.m3u8`;

      res.status(202).json({ jobId, hlsUrl });
    } catch (err) {
      console.error(`[demo] Upload failed: ${err.message}`);
      res.status(500).json({ error: 'Upload failed' });
    } finally {
      // Clean up temp file
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  });

  // Error handler for multer errors
  app.use((err, _req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 500 MB)' });
    }
    if (err.message === 'Only MP4 files are accepted') {
      return res.status(415).json({ error: err.message });
    }
    console.error(`[demo] Error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`[demo] Server running at http://localhost:${PORT}`);
    console.log(`[demo] NATS WS for browser: ${NATS_WS_URL}`);
    console.log(`[demo] MinIO public URL: ${MINIO_PUBLIC_URL}`);
  });
}

main().catch((err) => {
  const isConnectionRefused =
    err.code === 'CONNECTION_REFUSED' ||
    err.message?.includes('CONNECTION_REFUSED') ||
    err.message?.includes('ECONNREFUSED');

  if (isConnectionRefused) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  ❌ 無法連線到 NATS / MinIO');
    console.error('');
    console.error('  請先啟動 Docker 基礎設施：');
    console.error('');
    console.error('    cd tools/video-converter && docker compose up -d');
    console.error('');
    console.error(`  目前嘗試連線: NATS=${NATS_URL}  S3=${S3_ENDPOINT}`);
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
  } else {
    console.error(`[demo] Fatal: ${err.message}`);
  }

  process.exit(1);
});
