import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { $getRoot } from 'lexical'
import { $isHeadingNode } from '@lexical/rich-text'

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

function getHashId(key: string): string {
  return `h-${key}`
}

export function TableOfContentsPlugin() {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation('lexicalEditor')
  const [headings, setHeadings] = useState<TocItem[]>([])

  // Extract headings and set id attributes on heading DOM elements
  useEffect(() => {
    const update = () => {
      const items = extractHeadings(editor)
      setHeadings(items)

      // Set id attributes on heading elements for hash navigation
      for (const item of items) {
        const element = editor.getElementByKey(item.key)
        if (element) {
          element.id = getHashId(item.key)
        }
      }
    }
    update()
    return editor.registerUpdateListener(() => { update() })
  }, [editor])

  // On mount, scroll to heading if URL hash matches
  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove '#'
    if (!hash) return

    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }, [])

  const scrollToHeading = useCallback(
    (key: string) => {
      const hashId = getHashId(key)
      window.history.replaceState(null, '', `#${hashId}`)

      const element = editor.getElementByKey(key)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [editor],
  )

  if (headings.length === 0) return null

  return (
    <nav className="le-toc" aria-label="Table of contents">
      <div className="le-toc-title">{t('toc.title')}</div>
      <ul className="le-toc-list">
        {headings.map((item) => (
          <li key={item.key} className="le-toc-item" style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
            <button
              onClick={() => scrollToHeading(item.key)}
              className="le-toc-link"
              title={item.text || '(untitled)'}
            >
              {item.text || '(untitled)'}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
