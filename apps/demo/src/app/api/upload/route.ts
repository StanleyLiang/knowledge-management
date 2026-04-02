import { NextRequest, NextResponse } from 'next/server'
import { uploadToMinio } from '../../../lib/minio'
import { publishVideoJob } from '../../../lib/nats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'
const BUCKET = process.env.MINIO_BUCKET || 'videos'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 })
    }

    const jobId = crypto.randomUUID()
    // Use jobId as filename to avoid encoding issues with non-ASCII chars
    const ext = (file.name || 'video.mp4').split('.').pop() || 'mp4'
    const key = `uploads/${jobId}.${ext}`

    // 1. Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadToMinio(BUCKET, key, buffer, file.type)

    // 2. Publish NATS JetStream message
    await publishVideoJob({
      jobId,
      inputUrl: `s3://${BUCKET}/${key}`,
      outputBucket: BUCKET,
      outputPrefix: `hls/${jobId}/`,
    })

    // 3. Return job info
    const hlsUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/hls/${jobId}/master.m3u8`

    return NextResponse.json({
      jobId,
      src: `${MINIO_PUBLIC_URL}/${BUCKET}/${key}`,
      hlsUrl,
    })
  } catch (error) {
    console.error('[upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
