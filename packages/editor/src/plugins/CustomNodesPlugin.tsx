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
import { $createCodeSnippetNode } from '../nodes/CodeSnippetNode'
import { $createMermaidNode } from '../nodes/MermaidNode'
import { $createLandmarkNode } from '../nodes/LandmarkNode'
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
  INSERT_CODE_SNIPPET_COMMAND,
  INSERT_MERMAID_COMMAND,
  INSERT_LANDMARK_COMMAND,
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

      editor.registerCommand(
        INSERT_CODE_SNIPPET_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertNodes([
                $createCodeSnippetNode(payload.code ?? '', payload.language ?? 'javascript'),
              ])
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_MERMAID_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const mermaidNode = $createMermaidNode(
                payload.source ?? 'graph TD\n    A[Start] --> B[End]',
              )
              const paragraphBefore = $createParagraphNode()
              const paragraphAfter = $createParagraphNode()
              selection.insertNodes([paragraphBefore, mermaidNode, paragraphAfter])
              paragraphAfter.selectStart()
            }
          })
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_LANDMARK_COMMAND,
        (payload) => {
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const items = payload.items ?? [
                { id: '1', name: 'Taipei', latitude: 25.033, longitude: 121.565 },
                { id: '2', name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
              ]
              selection.insertNodes([$createLandmarkNode(items)])
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
