import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  $getNodeByKey,
  $getRoot,
} from 'lexical'
import {
  $isTableNode,
  $isTableRowNode,
  $moveTableColumn,
  type TableNode,
} from '@lexical/table'
import { GripVertical } from 'lucide-react'

interface HandleInfo {
  type: 'row' | 'column'
  index: number
  tableKey: string
  rect: { top: number; left: number; width: number; height: number }
}

function computeHandles(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
): HandleInfo[] {
  const rootEl = editor.getRootElement()
  if (!rootEl) return []

  const table = rootEl.querySelector('table')
  if (!table) return []

  let tableKey: string | null = null
  editor.getEditorState().read(() => {
    const root = $getRoot()
    for (const child of root.getChildren()) {
      if ($isTableNode(child)) {
        tableKey = child.getKey()
        break
      }
    }
  })
  if (!tableKey) return []

  const portalParent = rootEl.parentElement
  if (!portalParent) return []
  const parentRect = portalParent.getBoundingClientRect()

  const handles: HandleInfo[] = []
  const rows = table.rows

  for (let i = 0; i < rows.length; i++) {
    const rr = rows[i].getBoundingClientRect()
    handles.push({
      type: 'row',
      index: i,
      tableKey,
      rect: {
        top: rr.top - parentRect.top,
        left: rr.left - parentRect.left - 24,
        width: 20,
        height: rr.height,
      },
    })
  }

  const firstRow = rows[0]
  if (firstRow) {
    for (let i = 0; i < firstRow.cells.length; i++) {
      const cr = firstRow.cells[i].getBoundingClientRect()
      handles.push({
        type: 'column',
        index: i,
        tableKey,
        rect: {
          top: cr.top - parentRect.top - 24,
          left: cr.left - parentRect.left,
          width: cr.width,
          height: 20,
        },
      })
    }
  }

  return handles
}

export function TableDragReorderPlugin() {
  const [editor] = useLexicalComposerContext()
  const [handles, setHandles] = useState<HandleInfo[]>([])
  const [dragging, setDragging] = useState<{
    type: 'row' | 'column'
    index: number
    tableKey: string
  } | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [indicatorPos, setIndicatorPos] = useState<{
    top: number; left: number; width: number; height: number
  } | null>(null)

  // Recompute handles on editor update + scroll + resize
  useEffect(() => {
    const update = () => setHandles(computeHandles(editor))

    const unregister = editor.registerUpdateListener(update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    // Initial
    update()

    return () => {
      unregister()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editor])

  const handleDragStart = useCallback(
    (type: 'row' | 'column', index: number, tableKey: string, e: React.MouseEvent) => {
      e.preventDefault()
      setDragging({ type, index, tableKey })
      setDropIndex(index)
    },
    [],
  )

  // Drag move + drop
  useEffect(() => {
    if (!dragging) return

    const rootEl = editor.getRootElement()
    if (!rootEl) return
    const table = rootEl.querySelector('table')
    if (!table) return
    const portalParent = rootEl.parentElement
    if (!portalParent) return

    const handleMouseMove = (e: MouseEvent) => {
      const parentRect = portalParent.getBoundingClientRect()

      if (dragging.type === 'row') {
        const rows = table.rows
        let closest = dragging.index
        let minDist = Infinity
        for (let i = 0; i < rows.length; i++) {
          const rect = rows[i].getBoundingClientRect()
          const mid = rect.top + rect.height / 2
          const dist = Math.abs(e.clientY - mid)
          if (dist < minDist) { minDist = dist; closest = i }
        }
        setDropIndex(closest)

        const targetRect = rows[Math.min(closest, rows.length - 1)].getBoundingClientRect()
        const y = e.clientY < targetRect.top + targetRect.height / 2
          ? targetRect.top : targetRect.bottom
        setIndicatorPos({
          top: y - parentRect.top,
          left: targetRect.left - parentRect.left,
          width: targetRect.width,
          height: 2,
        })
      } else {
        const firstRow = table.rows[0]
        if (!firstRow) return
        let closest = dragging.index
        let minDist = Infinity
        for (let i = 0; i < firstRow.cells.length; i++) {
          const rect = firstRow.cells[i].getBoundingClientRect()
          const mid = rect.left + rect.width / 2
          const dist = Math.abs(e.clientX - mid)
          if (dist < minDist) { minDist = dist; closest = i }
        }
        setDropIndex(closest)

        const targetRect = firstRow.cells[Math.min(closest, firstRow.cells.length - 1)].getBoundingClientRect()
        const tableRect = table.getBoundingClientRect()
        const x = e.clientX < targetRect.left + targetRect.width / 2
          ? targetRect.left : targetRect.right
        setIndicatorPos({
          top: tableRect.top - parentRect.top,
          left: x - parentRect.left,
          width: 2,
          height: tableRect.height,
        })
      }
    }

    const handleMouseUp = () => {
      if (dragging && dropIndex !== null && dropIndex !== dragging.index) {
        editor.update(() => {
          const tableNode = $getNodeByKey(dragging.tableKey)
          if (!tableNode || !$isTableNode(tableNode)) return

          if (dragging.type === 'column') {
            $moveTableColumn(tableNode as TableNode, dragging.index, dropIndex)
          } else {
            // Move row
            const rows = tableNode.getChildren()
            if (dragging.index < rows.length && dropIndex < rows.length) {
              const rowToMove = rows[dragging.index]
              if ($isTableRowNode(rowToMove)) {
                rowToMove.remove()
                const updatedRows = tableNode.getChildren()
                const insertIdx = dropIndex > dragging.index ? dropIndex - 1 : dropIndex
                if (insertIdx === 0) {
                  const first = tableNode.getFirstChild()
                  if (first) first.insertBefore(rowToMove)
                  else tableNode.append(rowToMove)
                } else if (insertIdx <= updatedRows.length - 1) {
                  updatedRows[insertIdx - 1].insertAfter(rowToMove)
                } else {
                  tableNode.append(rowToMove)
                }
              }
            }
          }
        })
      }
      setDragging(null)
      setDropIndex(null)
      setIndicatorPos(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [editor, dragging, dropIndex])

  const rootEl = editor.getRootElement()
  const portalTarget = rootEl?.parentElement
  if (!portalTarget) return null

  return createPortal(
    <>
      {handles
        .filter((h) => h.type === 'row')
        .map((h) => (
          <div
            key={`row-${h.index}`}
            className="le-table-drag-handle le-table-drag-handle-row"
            style={{ top: h.rect.top, left: h.rect.left, height: h.rect.height }}
            onMouseDown={(e) => handleDragStart('row', h.index, h.tableKey, e)}
            title={`Drag to reorder row ${h.index + 1}`}
          >
            <GripVertical size={12} />
          </div>
        ))}
      {handles
        .filter((h) => h.type === 'column')
        .map((h) => (
          <div
            key={`col-${h.index}`}
            className="le-table-drag-handle le-table-drag-handle-col"
            style={{ top: h.rect.top, left: h.rect.left, width: h.rect.width }}
            onMouseDown={(e) => handleDragStart('column', h.index, h.tableKey, e)}
            title={`Drag to reorder column ${h.index + 1}`}
          >
            <GripVertical size={12} className="rotate-90" />
          </div>
        ))}
      {indicatorPos && (
        <div
          className="le-table-drop-indicator"
          style={{
            top: indicatorPos.top,
            left: indicatorPos.left,
            width: indicatorPos.width,
            height: indicatorPos.height,
          }}
        />
      )}
    </>,
    portalTarget,
  )
}
