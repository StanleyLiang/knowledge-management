import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { $createDividerNode } from '../nodes/DividerNode'
import { $createBookmarkNode } from '../nodes/BookmarkNode'
import { $createImageNode } from '../nodes/ImageNode'
import { $createVideoNode } from '../nodes/VideoNode'
import { $createAttachmentNode } from '../nodes/AttachmentNode'
import {
  $createCollapsibleContainerNode,
  $createCollapsibleTitleNode,
  $createCollapsibleContentNode,
} from '../nodes/CollapsibleNodes'
import {
  INSERT_DIVIDER_COMMAND,
  INSERT_BOOKMARK_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_VIDEO_COMMAND,
  INSERT_ATTACHMENT_COMMAND,
} from './InsertCommands'

export function CustomNodesPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregisters = [
      editor.registerCommand(
        INSERT_DIVIDER_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createDividerNode()])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_BOOKMARK_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createBookmarkNode(payload.title, payload.url)])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const container = $createCollapsibleContainerNode(true)
              const title = $createCollapsibleTitleNode()
              const content = $createCollapsibleContentNode()
              title.append($createTextNode('Toggle'))
              content.append($createParagraphNode())
              container.append(title, content)
              selection.insertNodes([container])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createImageNode(payload)])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_VIDEO_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createVideoNode(payload)])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_ATTACHMENT_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([$createAttachmentNode(payload)])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    ]

    return () => unregisters.forEach((fn) => fn())
  }, [editor])

  return null
}
