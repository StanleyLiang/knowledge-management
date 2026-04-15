import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { $getNodeByKey, $getRoot } from 'lexical'
import {
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  type TableNode,
  type TableCellNode,
} from '@lexical/table'
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { toast } from '../components/ui/toast'
import { tableHasMergedCells } from '../utils/tableMergeGuard'
import {
  getCellTextContent,
  compareCellValues,
  getColumnValues,
  getColumnUniqueValues,
} from '../utils/tableTextExtract'

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  tableKey: string
  columnIndex: number
  direction: 'asc' | 'desc'
}

// tableKey -> columnIndex -> set of hidden values
type FilterState = Map<string, Map<number, Set<string>>>

interface HeaderCellInfo {
  columnIndex: number
  tableKey: string
  rect: { top: number; left: number; width: number; height: number }
  /** Visible bounds of the table's scrollable wrapper (relative to portal parent) */
  wrapperRect: { left: number; right: number }
  /** If true, this cell belongs to a sticky header clone and uses fixed positioning */
  fixed?: boolean
}

const ROW_HIDDEN_CLASS = 'le-table-row-hidden'

function computeHeaderCells(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
): HeaderCellInfo[] {
  const rootEl = editor.getRootElement()
  if (!rootEl) return []
  const portalParent = rootEl.parentElement
  if (!portalParent) return []
  const parentRect = portalParent.getBoundingClientRect()

  const result: HeaderCellInfo[] = []

  editor.getEditorState().read(() => {
    const root = $getRoot()
    for (const child of root.getChildren()) {
      if (!$isTableNode(child)) continue
      const tableKey = child.getKey()
      const tableEl = editor.getElementByKey(tableKey)
      if (!tableEl) continue

      const table =
        tableEl.tagName === 'TABLE'
          ? (tableEl as HTMLTableElement)
          : tableEl.querySelector('table')
      if (!table) continue

      const firstRow = table.rows[0]
      if (!firstRow) continue

      // Check if first row cells are <th> (header)
      const firstCell = firstRow.cells[0]
      if (!firstCell || firstCell.tagName !== 'TH') continue

      // Get the scrollable wrapper bounds (or table element bounds) for clipping
      const wrapper = tableEl.closest('.le-table-scrollable-wrapper') || tableEl
      const wrapperBounds = wrapper.getBoundingClientRect()
      const wrapperLeft = wrapperBounds.left - parentRect.left
      const wrapperRight = wrapperLeft + wrapperBounds.width

      for (let i = 0; i < firstRow.cells.length; i++) {
        const cellRect = firstRow.cells[i].getBoundingClientRect()
        result.push({
          columnIndex: i,
          tableKey,
          rect: {
            top: cellRect.top - parentRect.top,
            left: cellRect.left - parentRect.left,
            width: cellRect.width,
            height: cellRect.height,
          },
          wrapperRect: { left: wrapperLeft, right: wrapperRight },
        })
      }

      // Also detect sticky header clone for this table.
      // The sticky clone is a fixed-position DOM clone appended to document.body
      // by TableStickyHeaderPlugin. Match by column count.
      const stickyClones = document.querySelectorAll<HTMLDivElement>(
        '.le-table-sticky-header-clone-wrapper',
      )
      for (const clone of stickyClones) {
        if (clone.style.display === 'none') continue
        const cloneTable = clone.querySelector('table')
        if (!cloneTable) continue
        const cloneRow = cloneTable.rows[0]
        if (!cloneRow) continue
        // Match by column count
        if (cloneRow.cells.length !== firstRow.cells.length) continue
        // Check the clone is actually visible (its wrapper left/width matches)
        const cloneRect = clone.getBoundingClientRect()
        if (cloneRect.height === 0) continue

        for (let i = 0; i < cloneRow.cells.length; i++) {
          const cellRect = cloneRow.cells[i].getBoundingClientRect()
          result.push({
            columnIndex: i,
            tableKey,
            rect: {
              // Use viewport coords directly for fixed positioning
              top: cellRect.top,
              left: cellRect.left,
              width: cellRect.width,
              height: cellRect.height,
            },
            wrapperRect: { left: cloneRect.left, right: cloneRect.right },
            fixed: true,
          })
        }
      }
    }
  })

  return result
}

// ─── Sort/Filter Dropdown ───────────────────────────────────────────

function SortFilterDropdown({
  tableKey,
  columnIndex,
  sortDirection,
  filterHiddenValues,
  onSort,
  onFilter,
  onClose,
  anchorRect,
  editor,
  fixed,
}: {
  tableKey: string
  columnIndex: number
  sortDirection: SortDirection
  filterHiddenValues: Set<string>
  onSort: (direction: SortDirection) => void
  onFilter: (hiddenValues: Set<string>) => void
  onClose: () => void
  anchorRect: { top: number; left: number; width: number; height: number }
  editor: ReturnType<typeof useLexicalComposerContext>[0]
  fixed?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [uniqueValues, setUniqueValues] = useState<string[]>([])
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set(filterHiddenValues))

  // Compute unique values on mount
  useEffect(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(tableKey)
      if (node && $isTableNode(node)) {
        setUniqueValues(getColumnUniqueValues(node as TableNode, columnIndex))
      }
    })
  }, [editor, tableKey, columnIndex])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const filteredValues = uniqueValues.filter((v) => {
    if (!search) return true
    const display = v || '(Empty)'
    return display.toLowerCase().includes(search.toLowerCase())
  })

  const toggleValue = (value: string) => {
    const next = new Set(localHidden)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    setLocalHidden(next)
    onFilter(next)
  }

  const selectAll = () => {
    setLocalHidden(new Set())
    onFilter(new Set())
  }

  const deselectAll = () => {
    const all = new Set(uniqueValues)
    setLocalHidden(all)
    onFilter(all)
  }

  // Position dropdown below the anchor, right-aligned
  const dropdownLeft = anchorRect.left + anchorRect.width - 220
  const dropdownTop = anchorRect.top + anchorRect.height + 4

  return (
    <div
      ref={ref}
      className="le-table-sort-filter-dropdown"
      style={{
        position: fixed ? 'fixed' : undefined,
        top: dropdownTop,
        left: Math.max(0, dropdownLeft),
      }}
      onMouseDown={(e) => {
        // Prevent editor blur
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT') {
          e.preventDefault()
        }
      }}
    >
      {/* Sort section */}
      <div className="le-table-sort-filter-section">
        <button
          className={`le-table-sort-filter-btn ${sortDirection === 'asc' ? 'le-table-sort-filter-btn-active' : ''}`}
          onClick={() => onSort(sortDirection === 'asc' ? null : 'asc')}
        >
          <ArrowUp size={14} />
          <span>Sort A → Z</span>
          {sortDirection === 'asc' && <Check size={14} className="le-table-sort-filter-check" />}
        </button>
        <button
          className={`le-table-sort-filter-btn ${sortDirection === 'desc' ? 'le-table-sort-filter-btn-active' : ''}`}
          onClick={() => onSort(sortDirection === 'desc' ? null : 'desc')}
        >
          <ArrowDown size={14} />
          <span>Sort Z → A</span>
          {sortDirection === 'desc' && <Check size={14} className="le-table-sort-filter-check" />}
        </button>
      </div>

      {/* Divider */}
      <div className="le-table-sort-filter-divider" />

      {/* Filter section */}
      <div className="le-table-sort-filter-section">
        <div className="le-table-sort-filter-filter-header">
          <span className="le-table-sort-filter-filter-title">Filter</span>
          <div className="le-table-sort-filter-filter-actions">
            <button className="le-table-sort-filter-link" onClick={selectAll}>
              All
            </button>
            <button className="le-table-sort-filter-link" onClick={deselectAll}>
              None
            </button>
          </div>
        </div>
        {uniqueValues.length > 5 && (
          <input
            type="text"
            className="le-table-sort-filter-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        <div className="le-table-sort-filter-values">
          {filteredValues.map((value) => {
            const isChecked = !localHidden.has(value)
            return (
              <label key={value || '__empty__'} className="le-table-sort-filter-value-item">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleValue(value)}
                />
                <span>{value || '(Empty)'}</span>
              </label>
            )
          })}
          {filteredValues.length === 0 && (
            <div className="le-table-sort-filter-no-values">No values</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Plugin ────────────────────────────────────────────────────

export function TableSortFilterPlugin() {
  const [editor] = useLexicalComposerContext()
  const [headerCells, setHeaderCells] = useState<HeaderCellInfo[]>([])
  const [sortState, setSortState] = useState<SortState | null>(null)
  const [filterState, setFilterState] = useState<FilterState>(new Map())
  const [activeDropdown, setActiveDropdown] = useState<{
    tableKey: string
    columnIndex: number
    fixed?: boolean
  } | null>(null)

  // Stores original row order (before any sort) so we can restore it on "Remove Sort"
  // Map<tableKey, rowKey[]>
  const originalRowOrderRef = useRef<Map<string, string[]>>(new Map())

  // Keep a ref to the latest filterState so the update listener never has a stale closure
  const filterStateRef = useRef<FilterState>(filterState)
  useEffect(() => { filterStateRef.current = filterState }, [filterState])

  // Stable callback that reads filter state from the ref (no stale closure)
  const applyAllFilters = useCallback(() => {
    const currentFilter = filterStateRef.current
    editor.getEditorState().read(() => {
      const root = $getRoot()
      for (const child of root.getChildren()) {
        if (!$isTableNode(child)) continue
        const tableKey = child.getKey()
        const columnFilters = currentFilter.get(tableKey)

        const rows = child.getChildren()
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!$isTableRowNode(row)) continue
          const rowEl = editor.getElementByKey(row.getKey())
          if (!rowEl) continue

          let hidden = false
          if (columnFilters) {
            const cells = row.getChildren()
            for (const [colIdx, hiddenValues] of columnFilters) {
              if (hiddenValues.size === 0) continue
              if (colIdx >= cells.length) continue
              const cell = cells[colIdx]
              if (!$isTableCellNode(cell)) continue
              if (hiddenValues.has(getCellTextContent(cell as TableCellNode))) {
                hidden = true
                break
              }
            }
          }

          if (hidden) rowEl.classList.add(ROW_HIDDEN_CLASS)
          else rowEl.classList.remove(ROW_HIDDEN_CLASS)
        }
      }
    })
  }, [editor])

  // Recompute header cell positions
  useEffect(() => {
    const update = () => setHeaderCells(computeHeaderCells(editor))
    const unregister = editor.registerUpdateListener(update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    update()
    return () => {
      unregister()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editor])

  // Re-apply filter visibility after every Lexical DOM reconciliation
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      applyAllFilters()
    })
  }, [editor, applyAllFilters])

  // Also apply immediately when filter state changes (for instant feedback)
  useEffect(() => {
    applyAllFilters()
  }, [filterState, applyAllFilters])

  const getSortDirection = useCallback(
    (tableKey: string, columnIndex: number): SortDirection => {
      if (
        sortState &&
        sortState.tableKey === tableKey &&
        sortState.columnIndex === columnIndex
      ) {
        return sortState.direction
      }
      return null
    },
    [sortState],
  )

  const getFilterHiddenValues = useCallback(
    (tableKey: string, columnIndex: number): Set<string> => {
      return filterState.get(tableKey)?.get(columnIndex) ?? new Set()
    },
    [filterState],
  )

  const hasActiveFilter = useCallback(
    (tableKey: string, columnIndex: number): boolean => {
      const hidden = filterState.get(tableKey)?.get(columnIndex)
      return hidden !== undefined && hidden.size > 0
    },
    [filterState],
  )

  const handleSort = useCallback(
    (tableKey: string, columnIndex: number, direction: SortDirection) => {
      if (!direction) {
        // Restore original row order
        const savedOrder = originalRowOrderRef.current.get(tableKey)
        if (savedOrder) {
          editor.update(() => {
            const tableNode = $getNodeByKey(tableKey)
            if (!tableNode || !$isTableNode(tableNode)) return
            const headerRow = (tableNode as TableNode).getFirstChild()
            if (!headerRow) return

            let lastInserted = headerRow
            for (const rowKey of savedOrder) {
              const rowNode = $getNodeByKey(rowKey)
              if (rowNode) {
                lastInserted.insertAfter(rowNode)
                lastInserted = rowNode
              }
            }
          })
          originalRowOrderRef.current.delete(tableKey)
        }
        setSortState(null)
        return
      }

      // Check merge guard
      let blocked = false
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(tableKey)
        if (node && $isTableNode(node) && tableHasMergedCells(node as TableNode)) {
          blocked = true
        }
      })
      if (blocked) {
        toast.warning('Please unmerge cells before sorting')
        return
      }

      editor.update(() => {
        const tableNode = $getNodeByKey(tableKey)
        if (!tableNode || !$isTableNode(tableNode)) return

        // Save original row order before the first sort on this table
        if (!originalRowOrderRef.current.has(tableKey)) {
          const rows = (tableNode as TableNode).getChildren()
          const rowKeys: string[] = []
          for (let i = 1; i < rows.length; i++) {
            if ($isTableRowNode(rows[i])) {
              rowKeys.push(rows[i].getKey())
            }
          }
          originalRowOrderRef.current.set(tableKey, rowKeys)
        }

        const values = getColumnValues(tableNode as TableNode, columnIndex)
        const multiplier = direction === 'asc' ? 1 : -1

        // Sort the value-rowKey pairs
        values.sort((a, b) => multiplier * compareCellValues(a.value, b.value))

        // Reorder rows: insert each row after the header (first child)
        const headerRow = (tableNode as TableNode).getFirstChild()
        if (!headerRow) return

        let lastInserted = headerRow
        for (const { rowKey } of values) {
          const rowNode = $getNodeByKey(rowKey)
          if (rowNode) {
            lastInserted.insertAfter(rowNode)
            lastInserted = rowNode
          }
        }
      })

      setSortState({ tableKey, columnIndex, direction })
    },
    [editor],
  )

  const handleFilter = useCallback(
    (tableKey: string, columnIndex: number, hiddenValues: Set<string>) => {
      setFilterState((prev) => {
        const next = new Map(prev)
        if (!next.has(tableKey)) {
          next.set(tableKey, new Map())
        }
        const tableFilters = new Map(next.get(tableKey)!)
        if (hiddenValues.size === 0) {
          tableFilters.delete(columnIndex)
        } else {
          tableFilters.set(columnIndex, new Set(hiddenValues))
        }
        if (tableFilters.size === 0) {
          next.delete(tableKey)
        } else {
          next.set(tableKey, tableFilters)
        }
        return next
      })
    },
    [],
  )

  const handleIconClick = useCallback(
    (tableKey: string, columnIndex: number, fixed?: boolean) => {
      // Check merge guard for filter too
      let blocked = false
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(tableKey)
        if (node && $isTableNode(node) && tableHasMergedCells(node as TableNode)) {
          blocked = true
        }
      })
      if (blocked) {
        toast.warning('Please unmerge cells before using sort/filter')
        return
      }

      setActiveDropdown((prev) => {
        if (prev && prev.tableKey === tableKey && prev.columnIndex === columnIndex) {
          return null
        }
        return { tableKey, columnIndex, fixed }
      })
    },
    [editor],
  )

  const rootEl = editor.getRootElement()
  const portalTarget = rootEl?.parentElement
  if (!portalTarget) return null

  const normalCells = headerCells.filter((c) => !c.fixed)
  const fixedCells = headerCells.filter((c) => c.fixed)

  function renderIcon(cell: HeaderCellInfo, keyPrefix: string) {
    const iconLeft = cell.rect.left + cell.rect.width - 24
    if (iconLeft + 20 < cell.wrapperRect.left || iconLeft > cell.wrapperRect.right) {
      return null
    }

    const direction = getSortDirection(cell.tableKey, cell.columnIndex)
    const filtered = hasActiveFilter(cell.tableKey, cell.columnIndex)

    const SortIcon =
      direction === 'asc'
        ? ArrowUp
        : direction === 'desc'
          ? ArrowDown
          : ArrowUpDown

    return (
      <button
        key={`${keyPrefix}-${cell.tableKey}-${cell.columnIndex}`}
        className={`le-table-sort-filter-icon ${direction ? 'le-table-sort-filter-icon-active' : ''} ${filtered ? 'le-table-sort-filter-icon-filtered' : ''}`}
        style={{
          position: cell.fixed ? 'fixed' : 'absolute',
          top: cell.rect.top + 4,
          left: iconLeft,
        }}
        onClick={() => handleIconClick(cell.tableKey, cell.columnIndex, cell.fixed)}
        onMouseDown={(e) => e.preventDefault()}
        title="Sort & Filter"
      >
        <SortIcon size={14} />
      </button>
    )
  }

  // Find the anchor cell for the dropdown
  // When opened from a fixed (sticky) icon, use the fixed cell rect
  const isFixedDropdown = activeDropdown?.fixed
  const dropdownAnchor = activeDropdown
    ? isFixedDropdown
      ? headerCells.find(
          (c) =>
            c.fixed &&
            c.tableKey === activeDropdown.tableKey &&
            c.columnIndex === activeDropdown.columnIndex,
        )
      : headerCells.find(
          (c) =>
            !c.fixed &&
            c.tableKey === activeDropdown.tableKey &&
            c.columnIndex === activeDropdown.columnIndex,
        )
    : null

  const dropdownElement = activeDropdown && dropdownAnchor && (
    <SortFilterDropdown
      tableKey={activeDropdown.tableKey}
      columnIndex={activeDropdown.columnIndex}
      sortDirection={getSortDirection(
        activeDropdown.tableKey,
        activeDropdown.columnIndex,
      )}
      filterHiddenValues={getFilterHiddenValues(
        activeDropdown.tableKey,
        activeDropdown.columnIndex,
      )}
      onSort={(dir) => {
        handleSort(activeDropdown.tableKey, activeDropdown.columnIndex, dir)
      }}
      onFilter={(hidden) => {
        handleFilter(
          activeDropdown.tableKey,
          activeDropdown.columnIndex,
          hidden,
        )
      }}
      onClose={() => setActiveDropdown(null)}
      anchorRect={dropdownAnchor.rect}
      editor={editor}
      fixed={isFixedDropdown}
    />
  )

  return (
    <>
      {/* Normal (absolute-positioned) icons + dropdown in editor portal */}
      {createPortal(
        <>
          {normalCells.map((cell) => renderIcon(cell, 'abs'))}
          {!isFixedDropdown && dropdownElement}
        </>,
        portalTarget,
      )}

      {/* Fixed-positioned icons + dropdown for sticky header clone in body portal */}
      {(fixedCells.length > 0 || isFixedDropdown) &&
        createPortal(
          <>
            {fixedCells.map((cell) => renderIcon(cell, 'fix'))}
            {isFixedDropdown && dropdownElement}
          </>,
          document.body,
        )}
    </>
  )
}
