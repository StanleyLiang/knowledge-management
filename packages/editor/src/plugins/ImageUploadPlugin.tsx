import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useCallback } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { UPLOAD_IMAGE_COMMAND, INSERT_IMAGE_COMMAND } from './InsertCommands'
import { $createImageNode, ImageNode } from '../nodes/ImageNode'
import type { OnUpload } from '../types'

export function ImageUploadPlugin({
  onUpload,
}: {
  onUpload?: OnUpload
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      UPLOAD_IMAGE_COMMAND,
      (file: File) => {
        // 1. Create a data URL preview immediately
        const reader = new FileReader()
        reader.onload = () => {
          const previewUrl = reader.result as string

          // 2. Get image dimensions
          const img = new Image()
          img.onload = () => {
            const width = Math.min(img.width, 600)
            const ratio = img.width / img.height
            const height = Math.round(width / ratio)

            // 3. Insert node with uploading status
            editor.update(() => {
              const selection = $getSelection()
              if (!$isRangeSelection(selection)) return

              const imageNode = $createImageNode({
                src: previewUrl,
                altText: file.name,
                width,
                height,
              })
              imageNode.setStatus('uploading')
              selection.insertNodes([imageNode])

              // 4. Start upload
              const nodeKey = imageNode.getKey()
              startUpload(file, nodeKey)
            })
          }
          img.src = previewUrl
        }
        reader.readAsDataURL(file)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, onUpload])

  const startUpload = useCallback(
    async (file: File, nodeKey: string) => {
      try {
        if (onUpload) {
          const result = await onUpload(file, 'image', (status) => {
            // Update node status during upload
            editor.update(() => {
              const node = editor._editorState._nodeMap.get(nodeKey)
              if (node instanceof ImageNode) {
                const writable = node.getWritable() as ImageNode
                writable.__status = status === 'converting' ? 'converting' : 'uploading'
              }
            })
          })

          // Success — update node with real URL
          editor.update(() => {
            const node = editor._editorState._nodeMap.get(nodeKey)
            if (node instanceof ImageNode) {
              const writable = node.getWritable() as ImageNode
              writable.__src = result.url
              if (result.width) writable.__width = result.width
              if (result.height) writable.__height = result.height
              writable.__status = 'ready'
            }
          })
        } else {
          // No onUpload — data URL is already the final source
          // Simulate a brief upload delay for demo purposes
          await new Promise((r) => setTimeout(r, 800))
          editor.update(() => {
            const node = editor._editorState._nodeMap.get(nodeKey)
            if (node instanceof ImageNode) {
              const writable = node.getWritable() as ImageNode
              writable.__status = 'ready'
            }
          })
        }
      } catch (err) {
        // Error
        editor.update(() => {
          const node = editor._editorState._nodeMap.get(nodeKey)
          if (node instanceof ImageNode) {
            const writable = node.getWritable() as ImageNode
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
