import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import {
  $isTableCellNode,
  $isTableRowNode,
  $isTableNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $getTableColumnIndexFromTableCellNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $unmergeCell,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import {
  Plus,
  Minus,
  Rows3,
  Columns3,
  ToggleLeft,
  Trash2,
} from 'lucide-react'

function TableActionBar({
  editor,
  tableCellNode,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  tableCellNode: TableCellNode
}) {
  const insertRowAbove = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(false)
    })
  }, [editor])

  const insertRowBelow = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(true)
    })
  }, [editor])

  const insertColLeft = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(false)
    })
  }, [editor])

  const insertColRight = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(true)
    })
  }, [editor])

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL()
    })
  }, [editor])

  const deleteCol = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL()
    })
  }, [editor])

  const toggleHeader = useCallback(() => {
    editor.update(() => {
      try {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const firstRow = tableNode.getFirstChild()
        if (!$isTableRowNode(firstRow)) return

        const firstCell = firstRow.getFirstChild()
        if (!$isTableCellNode(firstCell)) return

        const isHeader = firstCell.getHeaderStyles() === TableCellHeaderStates.ROW
        const newState = isHeader ? TableCellHeaderStates.NO_STATUS : TableCellHeaderStates.ROW

        for (const cell of firstRow.getChildren()) {
          if ($isTableCellNode(cell)) {
            (cell as TableCellNode).setHeaderStyles(newState)
          }
        }
      } catch {
        // ignore
      }
    })
  }, [editor, tableCellNode])

  const deleteTable = useCallback(() => {
    editor.update(() => {
      try {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        tableNode.remove()
      } catch {
        // ignore
      }
    })
  }, [editor, tableCellNode])

  return (
    <div className="le-table-action-bar">
      <div className="le-table-action-group">
        <span className="le-table-action-label">Row</span>
        <button className="le-node-toolbar-btn" onClick={insertRowAbove} title="Insert Row Above">
          <Plus size={12} />↑
        </button>
        <button className="le-node-toolbar-btn" onClick={insertRowBelow} title="Insert Row Below">
          <Plus size={12} />↓
        </button>
        <button className="le-node-toolbar-btn" onClick={deleteRow} title="Delete Row">
          <Minus size={12} />
        </button>
      </div>
      <div className="le-node-toolbar-sep" />
      <div className="le-table-action-group">
        <span className="le-table-action-label">Col</span>
        <button className="le-node-toolbar-btn" onClick={insertColLeft} title="Insert Column Left">
          <Plus size={12} />←
        </button>
        <button className="le-node-toolbar-btn" onClick={insertColRight} title="Insert Column Right">
          <Plus size={12} />→
        </button>
        <button className="le-node-toolbar-btn" onClick={deleteCol} title="Delete Column">
          <Minus size={12} />
        </button>
      </div>
      <div className="le-node-toolbar-sep" />
      <button className="le-node-toolbar-btn" onClick={toggleHeader} title="Toggle Header Row">
        <ToggleLeft size={14} />
      </button>
      <button className="le-node-toolbar-btn" onClick={deleteTable} title="Delete Table">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function TableActionPlugin() {
  const [editor] = useLexicalComposerContext()
  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(null)
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          setTableCellNode(null)
          return false
        }

        const anchorNode = selection.anchor.getNode()
        let node = anchorNode
        while (node) {
          if ($isTableCellNode(node)) {
            setTableCellNode(node as TableCellNode)
            // Find anchor element
            const element = editor.getElementByKey(node.getKey())
            if (element) {
              // Find the table DOM element
              let tableElement = element.closest('table')
              if (tableElement) {
                setAnchorElem(tableElement.parentElement)
              }
            }
            return false
          }
          node = node.getParent() as typeof node
        }

        setTableCellNode(null)
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  if (!tableCellNode || !anchorElem) return null

  return createPortal(
    <TableActionBar editor={editor} tableCellNode={tableCellNode} />,
    anchorElem,
  )
}
