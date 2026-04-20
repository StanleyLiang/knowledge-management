import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import {
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $findTableNode,
  $findCellNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  TableCellHeaderStates,
  type TableCellNode,
  type TableNode,
} from '@lexical/table'
import { ChevronDown } from 'lucide-react'
import { toast } from '../components/ui/toast'
import {
  checkRowOperation,
  checkColumnOperation,
} from '../utils/tableMergeGuard'

type Section = 'row' | 'column' | 'bg' | 'header'

const BG_COLORS: { label: string; value: string }[] = [
  { label: 'None', value: '' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Yellow', value: '#fef9c3' },
  { label: 'Red', value: '#fee2e2' },
  { label: 'Purple', value: '#f3e8ff' },
  { label: 'Gray', value: '#f3f4f6' },
]

export function TableCellActionMenuPlugin() {
  const [editor] = useLexicalComposerContext()
  const [cellKey, setCellKey] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState<Section | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const positionFor = useCallback(
    (cellEl: HTMLElement) => {
      const editorRoot = editor.getRootElement()
      if (!editorRoot) return null
      const cellRect = cellEl.getBoundingClientRect()
      const rootRect = editorRoot.getBoundingClientRect()
      return {
        top: cellRect.top - rootRect.top + 6,
        left: cellRect.right - rootRect.left - 28,
      }
    },
    [editor],
  )

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()

        let cellNode: TableCellNode | null = null
        if ($isRangeSelection(selection)) {
          cellNode = $findCellNode(selection.anchor.getNode()) as TableCellNode | null
        } else if ($isTableSelection(selection)) {
          const first = selection.getNodes().find((n) => $isTableCellNode(n))
          if (first) cellNode = first as TableCellNode
        }

        if (!cellNode) return

        const cellEl = editor.getElementByKey(cellNode.getKey()) as HTMLElement | null
        if (!cellEl) return

        const pos = positionFor(cellEl)
        if (!pos) return
        setPosition(pos)
        setCellKey(cellNode.getKey())
        setShow(true)
      })
    })
  }, [editor, positionFor])

  useEffect(() => {
    const editorRoot = editor.getRootElement()
    if (!editorRoot) return

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (menuRef.current && menuRef.current.contains(target)) return
      const cellEl = target.closest('th, td') as HTMLElement | null
      if (!cellEl || !editorRoot.contains(cellEl)) return
      const pos = positionFor(cellEl)
      if (!pos) return
      setPosition(pos)
      setCellKey(cellEl.getAttribute('data-lexical-key') || 'hover')
      setShow(true)
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as Node | null
      if (menuRef.current && related && menuRef.current.contains(related)) return
      if (open) return
      const to = related as HTMLElement | null
      if (to && to.closest && to.closest('th, td') && editorRoot.contains(to)) return
      setShow(false)
    }

    editorRoot.addEventListener('mousemove', handleMouseMove)
    editorRoot.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      editorRoot.removeEventListener('mousemove', handleMouseMove)
      editorRoot.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [editor, positionFor, open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const guardedRowOp = useCallback(
    (op: 'insert' | 'delete', fn: () => void) => {
      let blocked: string | null = null
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        let cellNode: TableCellNode | null = null
        if ($isRangeSelection(selection)) {
          cellNode = $findCellNode(selection.anchor.getNode()) as TableCellNode | null
        } else if ($isTableSelection(selection)) {
          const first = selection.getNodes().find((n) => $isTableCellNode(n))
          if (first) cellNode = first as TableCellNode
        }
        if (!cellNode) return
        const tableNode = $findTableNode(cellNode) as TableNode | null
        if (!tableNode) return
        const row = cellNode.getParent()
        if (!$isTableRowNode(row)) return
        const rowIndex = tableNode.getChildren().indexOf(row)
        blocked = checkRowOperation(tableNode, rowIndex, op)
      })
      if (blocked) { toast.warning(blocked); return }
      fn()
    },
    [editor],
  )

  const guardedColOp = useCallback(
    (op: 'insert' | 'delete', fn: () => void) => {
      let blocked: string | null = null
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        let cellNode: TableCellNode | null = null
        if ($isRangeSelection(selection)) {
          cellNode = $findCellNode(selection.anchor.getNode()) as TableCellNode | null
        } else if ($isTableSelection(selection)) {
          const first = selection.getNodes().find((n) => $isTableCellNode(n))
          if (first) cellNode = first as TableCellNode
        }
        if (!cellNode) return
        const tableNode = $findTableNode(cellNode) as TableNode | null
        if (!tableNode) return
        const row = cellNode.getParent()
        if (!$isTableRowNode(row)) return
        const colIndex = row.getChildren().indexOf(cellNode)
        blocked = checkColumnOperation(tableNode, colIndex, op)
      })
      if (blocked) { toast.warning(blocked); return }
      fn()
    },
    [editor],
  )

  const runRow = (direction: 'above' | 'below') =>
    guardedRowOp('insert', () =>
      editor.update(() => $insertTableRow__EXPERIMENTAL(direction === 'below')),
    )
  const runDeleteRow = () =>
    guardedRowOp('delete', () => editor.update(() => $deleteTableRow__EXPERIMENTAL()))
  const runCol = (direction: 'left' | 'right') =>
    guardedColOp('insert', () =>
      editor.update(() => $insertTableColumn__EXPERIMENTAL(direction === 'right')),
    )
  const runDeleteCol = () =>
    guardedColOp('delete', () => editor.update(() => $deleteTableColumn__EXPERIMENTAL()))

  const setBg = (color: string) => {
    editor.update(() => {
      const selection = $getSelection()
      let cells: TableCellNode[] = []
      if ($isTableSelection(selection)) {
        cells = selection.getNodes().filter((n) => $isTableCellNode(n)) as TableCellNode[]
      } else if ($isRangeSelection(selection)) {
        const cell = $findCellNode(selection.anchor.getNode())
        if (cell) cells = [cell as TableCellNode]
      }
      for (const cell of cells) cell.setBackgroundColor(color)
    })
  }

  const toggleHeader = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const cellNode = $findCellNode(selection.anchor.getNode())
      if (!cellNode) return
      const tableNode = $findTableNode(cellNode)
      if (!tableNode) return

      const firstRow = tableNode.getFirstChild()
      if (!$isTableRowNode(firstRow)) return

      const cells = firstRow.getChildren()
      const isCurrentlyHeader =
        cells.length > 0 &&
        $isTableCellNode(cells[0]) &&
        cells[0].getHeaderStyles() === TableCellHeaderStates.ROW

      for (const cell of cells) {
        if ($isTableCellNode(cell)) {
          ;(cell as TableCellNode).setHeaderStyles(
            isCurrentlyHeader
              ? TableCellHeaderStates.NO_STATUS
              : TableCellHeaderStates.ROW,
          )
        }
      }

      ;(tableNode as TableNode).setFrozenRows(isCurrentlyHeader ? 0 : 1)
    })
  }

  const runAndClose = (fn: () => void) => {
    fn()
    setOpen(null)
  }

  if (!show || !cellKey) return null

  const editorRoot = editor.getRootElement()
  const portalTarget = editorRoot?.parentElement ?? document.body

  return createPortal(
    <div
      ref={menuRef}
      className="le-table-cell-action"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}
    >
      <button
        type="button"
        className="le-table-cell-action-button"
        title="Cell actions"
        onClick={() => setOpen(open ? null : 'row')}
      >
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="le-table-cell-action-menu">
          <div className="le-table-cell-action-tabs">
            {(['row', 'column', 'bg', 'header'] as Section[]).map((s) => (
              <button
                key={s}
                type="button"
                className={
                  'le-table-cell-action-tab' +
                  (open === s ? ' le-table-cell-action-tab-active' : '')
                }
                onClick={() => setOpen(s)}
              >
                {s === 'bg' ? 'BG' : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="le-table-cell-action-panel">
            {open === 'row' && (
              <>
                <button className="le-table-cell-action-item" onClick={() => runAndClose(() => runRow('above'))}>Insert Row Above</button>
                <button className="le-table-cell-action-item" onClick={() => runAndClose(() => runRow('below'))}>Insert Row Below</button>
                <button className="le-table-cell-action-item le-table-cell-action-item-danger" onClick={() => runAndClose(runDeleteRow)}>Delete Row</button>
              </>
            )}
            {open === 'column' && (
              <>
                <button className="le-table-cell-action-item" onClick={() => runAndClose(() => runCol('left'))}>Insert Column Left</button>
                <button className="le-table-cell-action-item" onClick={() => runAndClose(() => runCol('right'))}>Insert Column Right</button>
                <button className="le-table-cell-action-item le-table-cell-action-item-danger" onClick={() => runAndClose(runDeleteCol)}>Delete Column</button>
              </>
            )}
            {open === 'bg' && (
              <div className="le-table-cell-action-swatches">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    className="le-table-cell-action-swatch"
                    title={c.label}
                    style={{ background: c.value || 'transparent' }}
                    onClick={() => runAndClose(() => setBg(c.value))}
                  >
                    {!c.value && <span className="le-table-cell-action-swatch-none">∅</span>}
                  </button>
                ))}
              </div>
            )}
            {open === 'header' && (
              <button className="le-table-cell-action-item" onClick={() => runAndClose(toggleHeader)}>
                Toggle Header Row
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    portalTarget,
  )
}
