import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useCallback, useState } from 'react'
import { $getRoot } from 'lexical'
import { $isHeadingNode } from '@lexical/rich-text'

function getHeadingLevel(element: HTMLElement): number {
  const tag = element.tagName.toLowerCase()
  const match = tag.match(/^h(\d)$/)
  return match ? parseInt(match[1], 10) : 0
}

function setCollapsedSiblings(headingEl: HTMLElement, level: number, collapsed: boolean) {
  let sibling = headingEl.nextElementSibling as HTMLElement | null
  while (sibling) {
    const siblingLevel = getHeadingLevel(sibling)
    if (siblingLevel > 0 && siblingLevel <= level) break
    sibling.style.display = collapsed ? 'none' : ''
    sibling = sibling.nextElementSibling as HTMLElement | null
  }
}

interface HeadingInfo {
  key: string
  level: number
  top: number
  left: number
}

export function CollapsibleHeadingPlugin() {
  const [editor] = useLexicalComposerContext()
  const [headingInfos, setHeadingInfos] = useState<HeadingInfo[]>([])
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set())
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Find the content container for positioning reference
  useEffect(() => {
    const root = editor.getRootElement()
    if (root) {
      setContainer(root.closest('.le-editor-container, .le-viewer-container') as HTMLElement)
    }
  }, [editor])

  // Extract heading positions
  useEffect(() => {
    const update = () => {
      if (!container) return
      const items: HeadingInfo[] = []
      const containerRect = container.getBoundingClientRect()

      editor.getEditorState().read(() => {
        const root = $getRoot()
        for (const child of root.getChildren()) {
          if (!$isHeadingNode(child)) continue
          const el = editor.getElementByKey(child.getKey())
          if (!el) continue
          const level = getHeadingLevel(el)
          if (level === 0) continue
          const rect = el.getBoundingClientRect()
          items.push({
            key: child.getKey(),
            level,
            top: rect.top - containerRect.top + container.scrollTop + (rect.height - 20) / 2,
            left: rect.left - containerRect.left - 22,
          })
        }
      })
      setHeadingInfos(items)
    }

    if (!container) return

    update()
    const unregister = editor.registerUpdateListener(() => { requestAnimationFrame(update) })

    const observer = new ResizeObserver(update)
    observer.observe(container)

    return () => {
      unregister()
      observer.disconnect()
    }
  }, [editor, container])

  // Attach hover listeners on heading DOM elements
  useEffect(() => {
    const cleanups: Array<() => void> = []

    editor.getEditorState().read(() => {
      const root = $getRoot()
      for (const child of root.getChildren()) {
        if (!$isHeadingNode(child)) continue
        const el = editor.getElementByKey(child.getKey())
        if (!el) continue
        const key = child.getKey()
        const onEnter = () => setHoveredKey(key)
        const onLeave = () => setHoveredKey((prev) => (prev === key ? null : prev))
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          el.removeEventListener('mouseenter', onEnter)
          el.removeEventListener('mouseleave', onLeave)
        })
      }
    })

    return () => cleanups.forEach((fn) => fn())
  }, [editor, headingInfos])

  // Apply collapsed state to DOM
  useEffect(() => {
    editor.getEditorState().read(() => {
      const root = $getRoot()
      for (const child of root.getChildren()) {
        if (!$isHeadingNode(child)) continue
        const el = editor.getElementByKey(child.getKey())
        if (!el) continue
        const level = getHeadingLevel(el)
        if (level === 0) continue
        setCollapsedSiblings(el, level, collapsedKeys.has(child.getKey()))
      }
    })
  }, [editor, collapsedKeys])

  const toggleKey = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  if (!container) return null

  return (
    <div className="le-heading-toggle-layer">
      {headingInfos.map((h) => {
        const isCollapsed = collapsedKeys.has(h.key)
        const isVisible = isCollapsed || hoveredKey === h.key
        return (
          <button
            key={h.key}
            className={`le-heading-toggle ${isVisible ? 'le-heading-toggle-visible' : ''}`}
            style={{ position: 'absolute', top: h.top, left: h.left }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleKey(h.key)
            }}
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            type="button"
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )
      })}
    </div>
  )
}
