/**
 * Browser-side NATS WebSocket subscription for video conversion status.
 * Connects to NATS via WebSocket (port 9222) and subscribes to status updates.
 */

export interface VideoJobStatus {
  jobId: string
  status: 'downloading' | 'converting' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  currentVariant: string | null
  completedVariants: string[]
  progress: number
  playlistUrl: string | null
  error: string | null
  updatedAt: string
}

let wsConnection: {
  ws: WebSocket
  subscriptions: Map<string, (msg: VideoJobStatus) => void>
} | null = null

const NATS_WS_URL = 'ws://localhost:9222'

/**
 * Subscribe to video conversion status updates for a specific job.
 * Returns a cleanup function to unsubscribe.
 */
export function subscribeToJobStatus(
  jobId: string,
  onStatus: (status: VideoJobStatus) => void,
): () => void {
  const subject = `video.convert.status.${jobId}`

  // Use a simple polling approach via NATS WebSocket
  // The nats.ws package requires dynamic import for browser
  let cancelled = false
  let cleanupFn: (() => void) | null = null

  // Dynamic import to avoid SSR issues
  import('nats.ws').then(async ({ connect }) => {
    if (cancelled) return

    try {
      const nc = await connect({ servers: NATS_WS_URL })
      const sub = nc.subscribe(subject)

      cleanupFn = () => {
        sub.unsubscribe()
        nc.drain().catch(() => {})
      }

      const decoder = new TextDecoder()
      for await (const msg of sub) {
        if (cancelled) break
        try {
          const data = JSON.parse(decoder.decode(msg.data)) as VideoJobStatus
          onStatus(data)

          // Auto-unsubscribe on terminal states
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            break
          }
        } catch {
          // Ignore malformed messages
        }
      }

      // Cleanup after subscription ends
      if (!cancelled) {
        nc.drain().catch(() => {})
      }
    } catch (err) {
      console.error('[nats-browser] Connection failed:', err)
      // Report as failed status
      if (!cancelled) {
        onStatus({
          jobId,
          status: 'failed',
          currentVariant: null,
          completedVariants: [],
          progress: 0,
          playlistUrl: null,
          error: `NATS connection failed: ${err instanceof Error ? err.message : 'unknown'}`,
          updatedAt: new Date().toISOString(),
        })
      }
    }
  })

  return () => {
    cancelled = true
    cleanupFn?.()
  }
}
