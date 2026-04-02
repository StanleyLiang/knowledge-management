import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useCallback } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { UPLOAD_ATTACHMENT_COMMAND } from './InsertCommands'
import { $createAttachmentNode, AttachmentNode } from '../nodes/AttachmentNode'
import type { OnUpload } from '../types'

export function AttachmentUploadPlugin({
  onUpload,
}: {
  onUpload?: OnUpload
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      UPLOAD_ATTACHMENT_COMMAND,
      (file: File) => {
        // Insert attachment node immediately with file metadata
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          const node = $createAttachmentNode({
            url: '#',
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          })
          selection.insertNodes([node])

          const nodeKey = node.getKey()
          startUpload(file, nodeKey)
        })

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, onUpload])

  const startUpload = useCallback(
    async (file: File, nodeKey: string) => {
      try {
        if (onUpload) {
          const result = await onUpload(file, 'attachment', () => {})

          // Update node with final URL from upload
          editor.update(() => {
            const node = editor._editorState._nodeMap.get(nodeKey)
            if (node instanceof AttachmentNode) {
              const writable = node.getWritable() as AttachmentNode
              writable.__url = result.url
              if (result.fileName) writable.__fileName = result.fileName
              if (result.fileSize) writable.__fileSize = result.fileSize
              if (result.mimeType) writable.__mimeType = result.mimeType
            }
          })
        }
        // No onUpload → keep '#' as URL (data URL not useful for attachments)
      } catch (err) {
        console.error('[AttachmentUpload] Error:', err)
      }
    },
    [editor, onUpload],
  )

  return null
}
