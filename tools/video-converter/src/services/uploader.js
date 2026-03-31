import fs from 'node:fs';
import path from 'node:path';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

/** Map file extensions to content types. */
const CONTENT_TYPE_MAP = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
};

/**
 * Get the content type for a file based on its extension.
 * @param {string} filePath
 * @returns {string}
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
}

/**
 * Upload a single file to S3.
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} filePath - Local file path
 * @param {string} bucket
 * @param {string} key - S3 object key
 */
async function uploadFile(s3Client, filePath, bucket, key) {
  const body = fs.createReadStream(filePath);
  const contentType = getContentType(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * Upload all files for a single variant (.ts segments + playlist.m3u8).
 * Uploads segments first, playlist last (playlist existence = variant complete).
 *
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} outputDir - Base output directory for the job
 * @param {string} variantName - e.g. "360p"
 * @param {string} outputBucket
 * @param {string} outputPrefix - e.g. "hls/jobId/"
 */
export async function uploadVariant(
  s3Client,
  outputDir,
  variantName,
  outputBucket,
  outputPrefix,
) {
  const variantDir = path.join(outputDir, variantName);
  const files = await fs.promises.readdir(variantDir);

  // Sort: .ts segments first, playlist.m3u8 last
  const segments = files.filter((f) => f.endsWith('.ts')).sort();
  const playlists = files.filter((f) => f.endsWith('.m3u8'));

  const ordered = [...segments, ...playlists];

  console.log(
    `[upload] Uploading ${ordered.length} files for variant ${variantName}`,
  );

  for (const file of ordered) {
    const filePath = path.join(variantDir, file);
    const key = `${outputPrefix}${variantName}/${file}`;
    await uploadFile(s3Client, filePath, outputBucket, key);
  }

  console.log(`[upload] Variant ${variantName} uploaded`);
}

/**
 * Upload (or overwrite) the master playlist to S3.
 *
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} outputDir - Base output directory for the job
 * @param {string} outputBucket
 * @param {string} outputPrefix
 */
export async function uploadMasterPlaylist(
  s3Client,
  outputDir,
  outputBucket,
  outputPrefix,
) {
  const masterPath = path.join(outputDir, 'master.m3u8');
  const key = `${outputPrefix}master.m3u8`;

  await uploadFile(s3Client, masterPath, outputBucket, key);
  console.log(`[upload] Master playlist uploaded to s3://${outputBucket}/${key}`);
}

/**
 * Check which variants have already been completed in S3.
 * Uses HeadObject to check for the existence of each variant's playlist.m3u8.
 * (playlist.m3u8 is uploaded last, so its existence = variant is complete)
 *
 * @param {import('@aws-sdk/client-s3').S3Client} s3Client
 * @param {string} outputBucket
 * @param {string} outputPrefix
 * @param {Array<{ name: string }>} variants - Variants to check
 * @returns {Promise<string[]>} Names of completed variants
 */
export async function checkCompletedVariants(
  s3Client,
  outputBucket,
  outputPrefix,
  variants,
) {
  const completed = [];

  for (const variant of variants) {
    const key = `${outputPrefix}${variant.name}/playlist.m3u8`;

    try {
      await s3Client.send(
        new HeadObjectCommand({ Bucket: outputBucket, Key: key }),
      );
      completed.push(variant.name);
      console.log(
        `[upload] Variant ${variant.name} already exists in S3, will skip`,
      );
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        // Not found — variant not completed
      } else {
        // Unexpected error — re-throw
        throw new Error(
          `Failed to check variant ${variant.name} in S3: ${err.message}`,
        );
      }
    }
  }

  return completed;
}
