import fs from 'node:fs';
import path from 'node:path';

/**
 * Remove temporary files for a job.
 * Failures are logged but never thrown — cleanup should not crash the worker.
 *
 * @param {import('../config.js').Config} config
 * @param {string} jobId
 */
export async function cleanupJob(config, jobId) {
  const jobDir = path.join(config.tempDir, jobId);

  try {
    await fs.promises.rm(jobDir, { recursive: true, force: true });
    console.log(`[cleanup] Removed temp files for job "${jobId}"`);
  } catch (err) {
    console.warn(
      `[cleanup] Failed to remove temp files for job "${jobId}": ${err.message}`,
    );
  }
}
