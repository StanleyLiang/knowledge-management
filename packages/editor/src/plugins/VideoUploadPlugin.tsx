import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useCallback } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { UPLOAD_VIDEO_COMMAND } from './InsertCommands'
import { $createVideoNode, VideoNode } from '../nodes/VideoNode'
import type { OnUpload } from '../types'

export function VideoUploadPlugin({
  onUpload,
}: {
  onUpload?: OnUpload
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      UPLOAD_VIDEO_COMMAND,
      (file: File) => {
        // 1. Create blob URL for instant preview
        const blobUrl = URL.createObjectURL(file)

        // 2. Get video dimensions
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          const width = Math.min(video.videoWidth || 640, 640)
          const ratio = (video.videoWidth || 640) / (video.videoHeight || 360)
          const height = Math.round(width / ratio)
          URL.revokeObjectURL(video.src) // release metadata probe

          // 3. Insert node with uploading status + blob preview
          editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return

            const videoNode = $createVideoNode({
              src: blobUrl,
              width,
              height,
              format: 'mp4',
            })
            videoNode.setStatus('uploading')
            selection.insertNodes([videoNode])

            const nodeKey = videoNode.getKey()
            startUpload(file, nodeKey, blobUrl)
          })
        }
        video.src = blobUrl

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, onUpload])

  const startUpload = useCallback(
    async (file: File, nodeKey: string, blobUrl: string) => {
      try {
        if (onUpload) {
          const result = await onUpload(file, 'video', (status) => {
            editor.update(() => {
              const node = editor._editorState._nodeMap.get(nodeKey)
              if (node instanceof VideoNode) {
                const writable = node.getWritable() as VideoNode
                writable.__status = status === 'converting' ? 'converting' : 'uploading'
              }
            })
          })

          // Update node with upload result
          editor.update(() => {
            const node = editor._editorState._nodeMap.get(nodeKey)
            if (node instanceof VideoNode) {
              const writable = node.getWritable() as VideoNode
              writable.__src = result.url
              writable.__format = result.format ?? 'mp4'
              if (result.width) writable.__width = result.width
              if (result.height) writable.__height = result.height

              if (result.jobId) {
                // Has jobId → conversion pending, let VideoConvertPlugin handle status
                writable.__jobId = result.jobId
                writable.__status = 'converting'
              } else {
                // No jobId → upload complete, ready to play
                writable.__status = 'ready'
              }
            }
          })
        } else {
          // No onUpload — blob URL is the final source (data URL fallback)
          await new Promise((r) => setTimeout(r, 800))
          editor.update(() => {
            const node = editor._editorState._nodeMap.get(nodeKey)
            if (node instanceof VideoNode) {
              const writable = node.getWritable() as VideoNode
              writable.__status = 'ready'
            }
          })
          return // keep blobUrl as src
        }

        // Revoke blob URL after successful upload
        URL.revokeObjectURL(blobUrl)
      } catch (err) {
        editor.update(() => {
          const node = editor._editorState._nodeMap.get(nodeKey)
          if (node instanceof VideoNode) {
            const writable = node.getWritable() as VideoNode
            writable.__status = 'error'
            writable.__errorMessage = err instanceof Error ? err.message : 'Upload failed'
          }
        })
      }
    },
    [editor, onUpload],
  )

  return null
}
