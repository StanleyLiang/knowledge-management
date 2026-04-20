import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import {
  $isTableCellNode,
  $isTableSelection,
  $findTableNode,
  $findCellNode,
  $mergeCells,
  $unmergeCell,
  type TableCellNode,
  type TableNode,
} from '@lexical/table'
import {
  Trash2,
  ChevronDown,
  Merge,
  SplitSquareHorizontal,
  AlignLeft,
  PanelLeft,
} from 'lucide-react'

interface DropdownItem {
  label: string
  action: () => void
}

function ToolbarDropdown({
  icon: Icon,
  label,
  items,
}: {
  icon: React.ElementType
  label: string
  items: DropdownItem[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="le-table-toolbar-dropdown">
      <button
        className="le-table-toolbar-btn"
        onClick={() => setOpen(!open)}
        title={label}
      >
        <Icon size={14} />
        <span className="le-table-toolbar-btn-label">{label}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="le-table-toolbar-menu">
          {items.map((item) => (
            <button
              key={item.label}
              className="le-table-toolbar-menu-item"
              onClick={() => {
                item.action()
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TableActionToolbar() {
  const [editor] = useLexicalComposerContext()
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [canMerge, setCanMerge] = useState(false)
  const [canSplit, setCanSplit] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()

        let cellNode: TableCellNode | null = null
        let tableNode: TableNode | null = null
        let hasMultiCellSelection = false

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode()
          cellNode = $findCellNode(anchorNode)
        } else if ($isTableSelection(selection)) {
          hasMultiCellSelection = true
          const nodes = selection.getNodes()
          const firstCell = nodes.find((n) => $isTableCellNode(n))
          if (firstCell && $isTableCellNode(firstCell)) {
            cellNode = firstCell as TableCellNode
          }
        }

        if (!cellNode) {
          setShow(false)
          setCanMerge(false)
          setCanSplit(false)
          return
        }

        tableNode = $findTableNode(cellNode)
        if (!tableNode) {
          setShow(false)
          return
        }

        // Check merge/split availability
        setCanMerge(hasMultiCellSelection)
        const colspan = cellNode.getColSpan?.() ?? 1
        const rowspan = cellNode.getRowSpan?.() ?? 1
        setCanSplit(colspan > 1 || rowspan > 1)

        // Position toolbar above the table
        const tableElement = editor.getElementByKey(tableNode.getKey())
        if (!tableElement) {
          setShow(false)
          return
        }

        const editorRoot = editor.getRootElement()
        if (!editorRoot) return

        const tableRect = tableElement.getBoundingClientRect()
        const rootRect = editorRoot.getBoundingClientRect()

        setPosition({
          top: tableRect.top - rootRect.top - 40,
          left: tableRect.left - rootRect.left,
        })
        setShow(true)
      })
    })
  }, [editor])

  const mergeCells = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isTableSelection(selection)) {
        const cells = selection.getNodes().filter((n) => $isTableCellNode(n)) as TableCellNode[]
        if (cells.length > 1) {
          $mergeCells(cells)
        }
      }
    })
  }, [editor])

  const splitCell = useCallback(() => {
    editor.update(() => {
      $unmergeCell()
    })
  }, [editor])

  const setCellAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      editor.update(() => {
        const selection = $getSelection()
        let cells: TableCellNode[] = []
        if ($isTableSelection(selection)) {
          cells = selection.getNodes().filter((n) => $isTableCellNode(n)) as TableCellNode[]
        } else if ($isRangeSelection(selection)) {
          const cell = $findCellNode(selection.anchor.getNode())
          if (cell) cells = [cell as TableCellNode]
        }
        for (const cell of cells) {
          // Set format on all paragraphs in cell
          const children = cell.getChildren()
          for (const child of children) {
            if ('setFormat' in child && typeof child.setFormat === 'function') {
              child.setFormat(align)
            }
          }
        }
      })
    },
    [editor],
  )

  const setFreezeColumns = useCallback(
    (count: number) => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        const cellNode = $findCellNode(selection.anchor.getNode())
        if (!cellNode) return
        const tableNode = $findTableNode(cellNode)
        if (tableNode) {
          ;(tableNode as TableNode).setFrozenColumns(count)
        }
      })
    },
    [editor],
  )

  const deleteTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const cellNode = $findCellNode(selection.anchor.getNode())
      if (!cellNode) return
      const tableNode = $findTableNode(cellNode)
      if (tableNode) {
        tableNode.remove()
      }
    })
  }, [editor])

  if (!show) return null

  return createPortal(
    <div
      ref={toolbarRef}
      className="le-table-action-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => {
        // Prevent editor blur
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}
    >
      {canMerge && (
        <button className="le-table-toolbar-btn" onClick={mergeCells} title="Merge Cells">
          <Merge size={14} />
          <span className="le-table-toolbar-btn-label">Merge</span>
        </button>
      )}
      {canSplit && (
        <button className="le-table-toolbar-btn" onClick={splitCell} title="Split Cell">
          <SplitSquareHorizontal size={14} />
          <span className="le-table-toolbar-btn-label">Split</span>
        </button>
      )}
      {(canMerge || canSplit) && <div className="le-table-toolbar-sep" />}
      <ToolbarDropdown
        icon={AlignLeft}
        label="Align"
        items={[
          { label: 'Align Left', action: () => setCellAlign('left') },
          { label: 'Align Center', action: () => setCellAlign('center') },
          { label: 'Align Right', action: () => setCellAlign('right') },
        ]}
      />
      <div className="le-table-toolbar-sep" />
      <ToolbarDropdown
        icon={PanelLeft}
        label="Freeze"
        items={[
          { label: 'No Freeze', action: () => setFreezeColumns(0) },
          { label: 'Freeze 1 Column', action: () => setFreezeColumns(1) },
          { label: 'Freeze 2 Columns', action: () => setFreezeColumns(2) },
          { label: 'Freeze 3 Columns', action: () => setFreezeColumns(3) },
        ]}
      />
      <div className="le-table-toolbar-sep" />
      <button className="le-table-toolbar-btn le-table-toolbar-btn-danger" onClick={deleteTable} title="Delete Table">
        <Trash2 size={14} />
      </button>
    </div>,
    editor.getRootElement()?.parentElement ?? document.body,
  )
}
