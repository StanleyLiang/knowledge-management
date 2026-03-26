import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState, useCallback } from 'react'
import { $getRoot, $isElementNode } from 'lexical'
import { $isHeadingNode, HeadingNode } from '@lexical/rich-text'

interface TocItem {
  key: string
  text: string
  tag: string
  level: number
}

function extractHeadings(editor: ReturnType<typeof useLexicalComposerContext>[0]): TocItem[] {
  const items: TocItem[] = []
  editor.getEditorState().read(() => {
    const root = $getRoot()
    for (const child of root.getChildren()) {
      if ($isHeadingNode(child)) {
        const tag = child.getTag()
        const level = parseInt(tag.replace('h', ''), 10)
        items.push({
          key: child.getKey(),
          text: child.getTextContent(),
          tag,
          level,
        })
      }
    }
  })
  return items
}

export function TableOfContentsPlugin() {
  const [editor] = useLexicalComposerContext()
  const [headings, setHeadings] = useState<TocItem[]>([])

  useEffect(() => {
    const update = () => setHeadings(extractHeadings(editor))
    update()
    return editor.registerUpdateListener(() => update())
  }, [editor])

  const scrollToHeading = useCallback(
    (key: string) => {
      editor.getEditorState().read(() => {
        const element = editor.getElementByKey(key)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    },
    [editor],
  )

  if (headings.length === 0) return null

  return (
    <nav className="le-toc" aria-label="Table of contents">
      <div className="le-toc-title">Table of Contents</div>
      <ul className="le-toc-list">
        {headings.map((item) => (
          <li key={item.key} className="le-toc-item" style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
            <button
              onClick={() => scrollToHeading(item.key)}
              className="le-toc-link"
            >
              {item.text || '(untitled)'}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
