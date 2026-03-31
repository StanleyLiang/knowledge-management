import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useCallback } from 'react'
import { $isTableNode, $findTableNode, $findCellNode } from '@lexical/table'

const RESIZE_HANDLE_WIDTH = 6 // pixels near border that triggers resize cursor
const MIN_COL_WIDTH = 50

export function TableColumnResizePlugin() {
  const [editor] = useLexicalComposerContext()
  const draggingRef = useRef<{
    tableEl: HTMLTableElement
    colIndex: number
    startX: number
    startWidths: number[]
  } | null>(null)

  useEffect(() => {
    const rootEl = editor.getRootElement()
    if (!rootEl) return

    function getTableAndColIndex(
      e: MouseEvent,
    ): { tableEl: HTMLTableElement; colIndex: number } | null {
      const target = e.target instanceof Element ? e.target : (e.target as Node).parentElement
      if (!target) return null
      const cell = target.closest('td, th') as HTMLTableCellElement | null
      if (!cell) return null
      const table = cell.closest('table') as HTMLTableElement | null
      if (!table) return null

      const cellRect = cell.getBoundingClientRect()
      const x = e.clientX

      // Check if near right border of this cell
      if (Math.abs(x - cellRect.right) <= RESIZE_HANDLE_WIDTH) {
        return { tableEl: table, colIndex: cell.cellIndex }
      }
      // Check if near left border (resize previous column)
      if (
        Math.abs(x - cellRect.left) <= RESIZE_HANDLE_WIDTH &&
        cell.cellIndex > 0
      ) {
        return { tableEl: table, colIndex: cell.cellIndex - 1 }
      }
      return null
    }

    function getColumnWidths(table: HTMLTableElement): number[] {
      const firstRow = table.rows[0]
      if (!firstRow) return []
      return Array.from(firstRow.cells).map(
        (cell) => cell.getBoundingClientRect().width,
      )
    }

    function setColumnWidths(table: HTMLTableElement, widths: number[]) {
      // Use colgroup for column widths
      let colgroup = table.querySelector('colgroup')
      if (!colgroup) {
        colgroup = document.createElement('colgroup')
        table.prepend(colgroup)
      }
      colgroup.innerHTML = ''
      for (const w of widths) {
        const col = document.createElement('col')
        col.style.width = `${w}px`
        colgroup.appendChild(col)
      }
      table.style.tableLayout = 'fixed'
      table.style.width = `${widths.reduce((a, b) => a + b, 0)}px`
    }

    const handleMouseMove = (e: MouseEvent) => {
      const drag = draggingRef.current
      if (drag) {
        // Dragging — resize column
        const dx = e.clientX - drag.startX
        const newWidths = [...drag.startWidths]
        const newWidth = Math.max(MIN_COL_WIDTH, newWidths[drag.colIndex] + dx)
        newWidths[drag.colIndex] = newWidth
        setColumnWidths(drag.tableEl, newWidths)
        e.preventDefault()
        return
      }

      // Hovering — show resize cursor
      const info = getTableAndColIndex(e)
      const target = e.target as HTMLElement
      const cell = target.closest('td, th') as HTMLElement | null
      if (info && cell) {
        cell.style.cursor = 'col-resize'
      } else if (cell) {
        cell.style.cursor = ''
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      const info = getTableAndColIndex(e)
      if (!info) return

      e.preventDefault()
      draggingRef.current = {
        tableEl: info.tableEl,
        colIndex: info.colIndex,
        startX: e.clientX,
        startWidths: getColumnWidths(info.tableEl),
      }
      document.body.style.cursor = 'col-resize'
    }

    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null
        document.body.style.cursor = ''
      }
    }

    rootEl.addEventListener('mousemove', handleMouseMove)
    rootEl.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      rootEl.removeEventListener('mousemove', handleMouseMove)
      rootEl.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [editor])

  return null
}
