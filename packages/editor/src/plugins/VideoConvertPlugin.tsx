import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef } from 'react'
import { $getNodeByKey } from 'lexical'
import { VideoNode, $isVideoNode } from '../nodes/VideoNode'
import { subscribeToJobStatus, type VideoJobStatus } from '../utils/nats-browser'
import type { VideoConvertConfig } from '../types'

interface TrackedJob {
  jobId: string
  nodeKey: string
  hlsUrl: string
  cleanupNats: (() => void) | null
  pollTimer: ReturnType<typeof setInterval> | null
}

/**
 * Plugin that monitors VideoNodes in 'converting' state and subscribes
 * to NATS WebSocket + polling for conversion status updates.
 *
 * When conversion completes, updates the node to 'ready' with HLS src.
 * Callers opt-in by providing `videoConvert` config to the Editor.
 */
export function VideoConvertPlugin({
  natsWsUrl,
  statusSubjectPrefix = 'video.convert.status',
  pollInterval = 3000,
}: VideoConvertConfig) {
  const [editor] = useLexicalComposerContext()
  const trackedJobs = useRef<Map<string, TrackedJob>>(new Map())

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const nodeMap = editorState._nodeMap

        // Find all VideoNodes in 'converting' state with a jobId
        const convertingJobs = new Set<string>()

        for (const [key, node] of nodeMap) {
          if ($isVideoNode(node) && node.__status === 'converting' && node.__jobId) {
            convertingJobs.add(node.__jobId)

            // Start tracking if not already
            if (!trackedJobs.current.has(node.__jobId)) {
              startTracking(node.__jobId, key, node.__src)
            }
          }
        }

        // Cleanup jobs that are no longer in converting state
        for (const [jobId, job] of trackedJobs.current) {
          if (!convertingJobs.has(jobId)) {
            stopTracking(jobId)
          }
        }
      })
    })

    return () => {
      unregister()
      // Cleanup all tracked jobs on unmount
      for (const [jobId] of trackedJobs.current) {
        stopTracking(jobId)
      }
    }
  }, [editor, natsWsUrl, statusSubjectPrefix, pollInterval])

  function startTracking(jobId: string, nodeKey: string, hlsUrl: string) {
    const job: TrackedJob = {
      jobId,
      nodeKey,
      hlsUrl,
      cleanupNats: null,
      pollTimer: null,
    }

    // 1. Subscribe to NATS WebSocket
    job.cleanupNats = subscribeToJobStatus(
      jobId,
      (status) => handleStatus(jobId, status),
      natsWsUrl,
      statusSubjectPrefix,
    )

    // 2. Start polling fallback
    if (pollInterval > 0) {
      job.pollTimer = setInterval(() => pollHlsUrl(jobId, hlsUrl), pollInterval)
    }

    trackedJobs.current.set(jobId, job)
    console.log(`[VideoConvertPlugin] Tracking job ${jobId}`)
  }

  function stopTracking(jobId: string) {
    const job = trackedJobs.current.get(jobId)
    if (!job) return

    job.cleanupNats?.()
    if (job.pollTimer) clearInterval(job.pollTimer)
    trackedJobs.current.delete(jobId)
  }

  function handleStatus(jobId: string, status: VideoJobStatus) {
    const job = trackedJobs.current.get(jobId)
    if (!job) return

    console.log(`[VideoConvertPlugin] Job ${jobId}: ${status.status}`)

    if (status.status === 'completed') {
      completeJob(jobId)
    } else if (status.status === 'failed') {
      failJob(jobId, status.error || 'Conversion failed')
    }
  }

  async function pollHlsUrl(jobId: string, hlsUrl: string) {
    try {
      const res = await fetch(hlsUrl, { method: 'HEAD' })
      if (res.ok) {
        console.log(`[VideoConvertPlugin] Job ${jobId}: HLS available via polling`)
        completeJob(jobId)
      }
    } catch {
      // Not ready yet
    }
  }

  function completeJob(jobId: string) {
    const job = trackedJobs.current.get(jobId)
    if (!job) return

    editor.update(() => {
      const node = editor._editorState._nodeMap.get(job.nodeKey)
      if (node && $isVideoNode(node)) {
        const writable = node.getWritable() as VideoNode
        writable.__status = 'ready'
        writable.__format = 'hls'
        // src should already be the HLS URL (set by VideoUploadPlugin)
      }
    })

    stopTracking(jobId)
  }

  function failJob(jobId: string, errorMessage: string) {
    const job = trackedJobs.current.get(jobId)
    if (!job) return

    editor.update(() => {
      const node = editor._editorState._nodeMap.get(job.nodeKey)
      if (node && $isVideoNode(node)) {
        const writable = node.getWritable() as VideoNode
        writable.__status = 'error'
        writable.__errorMessage = errorMessage
      }
    })

    stopTracking(jobId)
  }

  return null
}
