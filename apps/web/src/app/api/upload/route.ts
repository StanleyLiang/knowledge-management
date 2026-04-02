import { NextRequest, NextResponse } from 'next/server'
import { uploadToMinio } from '@/lib/minio'
import { publishVideoJob } from '@/lib/nats'

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

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isVideo && !isImage) {
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 })
    }

    const jobId = crypto.randomUUID()
    const ext = (file.name || 'file').split('.').pop() || (isImage ? 'png' : 'mp4')
    const prefix = isImage ? 'images' : 'uploads'
    const key = `${prefix}/${jobId}.${ext}`

    // 1. Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadToMinio(BUCKET, key, buffer, file.type)

    const publicUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/${key}`

    // 2. Video: also publish NATS conversion job
    if (isVideo) {
      await publishVideoJob({
        jobId,
        inputUrl: `s3://${BUCKET}/${key}`,
        outputBucket: BUCKET,
        outputPrefix: `hls/${jobId}/`,
      })

      const hlsUrl = `${MINIO_PUBLIC_URL}/${BUCKET}/hls/${jobId}/master.m3u8`

      return NextResponse.json({
        jobId,
        src: publicUrl,
        hlsUrl,
        type: 'video',
      })
    }

    // 3. Image: just return the public URL
    return NextResponse.json({
      src: publicUrl,
      type: 'image',
    })
  } catch (error) {
    console.error('[upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
