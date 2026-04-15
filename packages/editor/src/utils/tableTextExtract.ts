import {
  $isTableCellNode,
  $isTableRowNode,
  type TableCellNode,
  type TableNode,
} from '@lexical/table'

/** Extract trimmed plain text from a table cell node. */
export function getCellTextContent(cellNode: TableCellNode): string {
  return cellNode.getTextContent().trim()
}

/**
 * Numeric-aware comparison for cell text values.
 * If both values parse as numbers, compare numerically.
 * Empty strings sort last regardless of direction.
 */
export function compareCellValues(a: string, b: string): number {
  if (a === '' && b === '') return 0
  if (a === '') return 1
  if (b === '') return -1

  const numA = parseFloat(a)
  const numB = parseFloat(b)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }

  return a.localeCompare(b)
}

/**
 * Get unique text values for a column across all data rows (skip header row).
 * Returns array of { rowKey, value } pairs.
 */
export function getColumnValues(
  tableNode: TableNode,
  columnIndex: number,
): Array<{ rowKey: string; value: string }> {
  const results: Array<{ rowKey: string; value: string }> = []
  const rows = tableNode.getChildren()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!$isTableRowNode(row)) continue
    // Skip header row (first row)
    if (i === 0) continue

    const cells = row.getChildren()
    if (columnIndex >= cells.length) continue

    const cell = cells[columnIndex]
    if (!$isTableCellNode(cell)) continue

    results.push({
      rowKey: row.getKey(),
      value: getCellTextContent(cell as TableCellNode),
    })
  }

  return results
}

/** Get unique values from column data for filter checkboxes. */
export function getColumnUniqueValues(
  tableNode: TableNode,
  columnIndex: number,
): string[] {
  const values = getColumnValues(tableNode, columnIndex)
  const unique = new Set(values.map((v) => v.value))
  return Array.from(unique).sort((a, b) => compareCellValues(a, b))
}
