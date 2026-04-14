import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isTableNode, TableNode } from '@lexical/table'

const FROZEN_CELL_CLASS = 'le-table-frozen-cell'
const FROZEN_CELL_LAST_CLASS = 'le-table-frozen-cell-last'

/**
 * Applies `position: sticky` and correct `left` offsets to frozen columns.
 * Lexical's built-in setFrozenColumns only adds a class/attribute to the
 * wrapper — the actual per-cell sticky positioning is our responsibility.
 */
function applyFrozenColumnStyles(tableElement: HTMLTableElement, frozenCount: number) {
  // Read column widths from colgroup
  const cols = tableElement.querySelectorAll<HTMLElement>('colgroup col')
  const colWidths: number[] = []
  cols.forEach((col) => {
    colWidths.push(parseFloat(col.style.width) || 0)
  })

  // Compute left offsets for each frozen column
  const leftOffsets: number[] = []
  let cumulative = 0
  for (let i = 0; i < frozenCount; i++) {
    leftOffsets.push(cumulative)
    cumulative += colWidths[i] || 0
  }

  // Apply/remove styles on all rows
  const rows = tableElement.querySelectorAll('tr')
  rows.forEach((row) => {
    const cells = row.children
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i] as HTMLElement
      if (i < frozenCount) {
        cell.classList.add(FROZEN_CELL_CLASS)
        cell.style.left = `${leftOffsets[i]}px`
        if (i === frozenCount - 1) {
          cell.classList.add(FROZEN_CELL_LAST_CLASS)
        } else {
          cell.classList.remove(FROZEN_CELL_LAST_CLASS)
        }
      } else {
        cell.classList.remove(FROZEN_CELL_CLASS, FROZEN_CELL_LAST_CLASS)
        cell.style.left = ''
      }
    }
  })
}

function clearFrozenColumnStyles(tableElement: HTMLTableElement) {
  const cells = tableElement.querySelectorAll(`.${FROZEN_CELL_CLASS}`)
  cells.forEach((cell) => {
    const el = cell as HTMLElement
    el.classList.remove(FROZEN_CELL_CLASS, FROZEN_CELL_LAST_CLASS)
    el.style.left = ''
    if (el.tagName === 'TD' && el.style.backgroundColor === 'white') {
      el.style.backgroundColor = ''
    }
  })
}

export function TableFreezeColumnPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerMutationListener(TableNode, (mutations) => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, type] of mutations) {
          if (type === 'destroyed') continue

          const node = editor.getEditorState()._nodeMap.get(nodeKey)
          if (!node || !$isTableNode(node)) continue

          const frozenCount = node.getFrozenColumns()
          const dom = editor.getElementByKey(nodeKey)
          if (!dom) continue

          // dom might be the wrapper div or the table itself
          const tableElement = dom.tagName === 'TABLE'
            ? dom as HTMLTableElement
            : dom.querySelector('table') as HTMLTableElement
          if (!tableElement) continue

          if (frozenCount > 0) {
            applyFrozenColumnStyles(tableElement, frozenCount)
          } else {
            clearFrozenColumnStyles(tableElement)
          }
        }
      })
    })
  }, [editor])

  // Also listen for column resize changes via MutationObserver
  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        // Detect col width changes inside colgroup
        const target = record.target as HTMLElement
        if (target.tagName === 'COL' && record.attributeName === 'style') {
          const table = target.closest('table')
          if (!table || !table.hasAttribute('data-lexical-frozen-column')) continue

          // Re-apply frozen styles with updated widths
          editor.getEditorState().read(() => {
            const wrapper = table.parentElement
            if (!wrapper) return
            const nodeKey = wrapper.getAttribute('data-lexical-node-key') || table.getAttribute('data-lexical-node-key')
            if (!nodeKey) return
            const node = editor.getEditorState()._nodeMap.get(nodeKey)
            if (!node || !$isTableNode(node)) return
            const frozenCount = node.getFrozenColumns()
            if (frozenCount > 0) {
              applyFrozenColumnStyles(table, frozenCount)
            }
          })
        }
      }
    })

    observer.observe(rootElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => observer.disconnect()
  }, [editor])

  return null
}
