import {
  $isTableCellNode,
  $isTableRowNode,
  $computeTableMap,
  type TableNode,
  type TableCellNode,
} from '@lexical/table'

const TOAST_MSG = 'Please unmerge cells first'

/**
 * Check if a row operation is safe (no merged cells span across the row boundary).
 * Returns the toast message if blocked, or null if safe.
 */
export function checkRowOperation(
  tableNode: TableNode,
  rowIndex: number,
  operation: 'insert' | 'delete' | 'move',
): string | null {
  const rows = tableNode.getChildren()
  if (rowIndex < 0 || rowIndex >= rows.length) return null

  const row = rows[rowIndex]
  if (!$isTableRowNode(row)) return null

  const cells = row.getChildren()
  for (const cell of cells) {
    if ($isTableCellNode(cell)) {
      const rowspan = (cell as TableCellNode).getRowSpan?.() ?? 1
      if (rowspan > 1) {
        return TOAST_MSG
      }
    }
  }

  // Also check rows above — if any cell above spans into this row
  for (let r = 0; r < rowIndex; r++) {
    const aboveRow = rows[r]
    if (!$isTableRowNode(aboveRow)) continue
    const aboveCells = aboveRow.getChildren()
    for (const cell of aboveCells) {
      if ($isTableCellNode(cell)) {
        const rowspan = (cell as TableCellNode).getRowSpan?.() ?? 1
        if (r + rowspan > rowIndex) {
          return TOAST_MSG
        }
      }
    }
  }

  return null
}

/**
 * Check if a column operation is safe (no merged cells span across the column boundary).
 */
export function checkColumnOperation(
  tableNode: TableNode,
  colIndex: number,
  operation: 'insert' | 'delete' | 'move',
): string | null {
  const rows = tableNode.getChildren()

  for (const row of rows) {
    if (!$isTableRowNode(row)) continue
    const cells = row.getChildren()
    let currentCol = 0
    for (const cell of cells) {
      if ($isTableCellNode(cell)) {
        const colspan = (cell as TableCellNode).getColSpan?.() ?? 1
        if (colspan > 1) {
          // This cell spans multiple columns
          const startCol = currentCol
          const endCol = currentCol + colspan - 1
          if (colIndex >= startCol && colIndex <= endCol) {
            return TOAST_MSG
          }
        }
        currentCol += (cell as TableCellNode).getColSpan?.() ?? 1
      }
    }
  }

  return null
}

/**
 * Check if a table has any merged cells at all.
 */
export function tableHasMergedCells(tableNode: TableNode): boolean {
  const rows = tableNode.getChildren()
  for (const row of rows) {
    if (!$isTableRowNode(row)) continue
    for (const cell of row.getChildren()) {
      if ($isTableCellNode(cell)) {
        const colspan = (cell as TableCellNode).getColSpan?.() ?? 1
        const rowspan = (cell as TableCellNode).getRowSpan?.() ?? 1
        if (colspan > 1 || rowspan > 1) return true
      }
    }
  }
  return false
}
