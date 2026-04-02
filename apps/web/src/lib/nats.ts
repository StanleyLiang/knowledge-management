import { connect, type NatsConnection, type JetStreamClient, StringCodec } from 'nats'

let nc: NatsConnection | null = null
let js: JetStreamClient | null = null
const sc = StringCodec()

async function getConnection(): Promise<{ nc: NatsConnection; js: JetStreamClient }> {
  if (nc && !nc.isClosed()) {
    return { nc, js: js! }
  }

  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222'
  nc = await connect({ servers: natsUrl })
  js = nc.jetstream()

  // Ensure stream exists
  const jsm = await nc.jetstreamManager()
  try {
    await jsm.streams.info('VIDEO_CONVERT')
  } catch {
    await jsm.streams.add({
      name: 'VIDEO_CONVERT',
      subjects: ['video.convert'],
      retention: 'workqueue' as unknown as number,
      max_age: 86400_000_000_000, // 24h in nanos
    })
  }

  return { nc, js }
}

export async function publishVideoJob(job: {
  jobId: string
  inputUrl: string
  outputBucket: string
  outputPrefix: string
}): Promise<void> {
  const { js } = await getConnection()
  await js.publish('video.convert', sc.encode(JSON.stringify(job)))
}
