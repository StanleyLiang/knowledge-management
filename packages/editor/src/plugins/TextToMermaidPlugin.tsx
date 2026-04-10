import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
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
        const { text, anchorBlockKey } = payload

        // Insert the processing node, then start async generation
        editor.update(() => {
          const anchorBlock = $getNodeByKey(anchorBlockKey)
          if (!anchorBlock) return

          const paragraph = $createParagraphNode()
          const mermaidNode = $createMermaidNode('', 600, 300, 'processing')
          paragraph.append(mermaidNode)
          anchorBlock.insertAfter(paragraph)

          const nodeKey = mermaidNode.getKey()

          // Use queueMicrotask to run async work after the update is flushed
          queueMicrotask(() => {
            onGenerateRef.current(text)
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
          })
        })

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
