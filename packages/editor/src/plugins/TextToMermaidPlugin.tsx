import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { $createMermaidNode, $isMermaidNode } from '../nodes/MermaidNode'
import { GENERATE_MERMAID_COMMAND } from './InsertCommands'

export function TextToMermaidPlugin({
  onGenerate,
}: {
  onGenerate: (text: string) => Promise<string>
}) {
  const [editor] = useLexicalComposerContext()
  const onGenerateRef = useRef(onGenerate)
  onGenerateRef.current = onGenerate

  useEffect(() => {
    let disposed = false

    const unregister = editor.registerCommand(
      GENERATE_MERMAID_COMMAND,
      (payload) => {
        let mermaidNodeKey: string | null = null

        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          // Find the top-level block containing the selection
          const anchorNode = selection.anchor.getNode()
          const topLevelBlock = anchorNode.getTopLevelElement()
          if (!topLevelBlock) return

          // Create a new paragraph after the block and insert a processing MermaidNode
          const paragraph = $createParagraphNode()
          const mermaidNode = $createMermaidNode('', 600, 300, 'processing')
          paragraph.append(mermaidNode)
          topLevelBlock.insertAfter(paragraph)

          mermaidNodeKey = mermaidNode.getKey()
        })

        // Async: call the external generator
        if (mermaidNodeKey) {
          const nodeKey = mermaidNodeKey
          onGenerateRef.current(payload.text)
            .then((source) => {
              if (disposed) return
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if ($isMermaidNode(node)) {
                  const writable = node.getWritable()
                  writable.__source = source
                  writable.__status = 'idle'
                  writable.__errorMessage = null
                }
              })
            })
            .catch((err) => {
              if (disposed) return
              editor.update(() => {
                const node = $getNodeByKey(nodeKey)
                if ($isMermaidNode(node)) {
                  const writable = node.getWritable()
                  writable.__status = 'error'
                  writable.__errorMessage = err instanceof Error ? err.message : 'Generation failed'
                }
              })
            })
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )

    return () => {
      disposed = true
      unregister()
    }
  }, [editor])

  return null
}
