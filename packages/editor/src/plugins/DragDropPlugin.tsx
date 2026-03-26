import { useRef, useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin'
import { GripVertical } from 'lucide-react'

function DragHandle() {
  return (
    <div className="le-drag-handle">
      <GripVertical size={14} />
    </div>
  )
}

function TargetLine() {
  return <div className="le-drag-target-line" />
}

export function DragDropPlugin() {
  const [editor] = useLexicalComposerContext()
  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (rootElement) {
      setAnchorElem(rootElement.parentElement)
    }
  }, [editor])

  const isOnMenu = useCallback(
    (element: HTMLElement) => {
      return !!menuRef.current?.contains(element)
    },
    [],
  )

  if (!anchorElem) return null

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={<DragHandle />}
      targetLineComponent={<TargetLine />}
      isOnMenu={isOnMenu}
    />
  )
}
