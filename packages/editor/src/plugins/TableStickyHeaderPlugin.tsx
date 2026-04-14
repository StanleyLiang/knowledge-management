import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TableNode } from '@lexical/table'

/**
 * Creates a fixed-position clone of the table header row that appears
 * when the original header scrolls above the viewport. Works regardless
 * of scroll context (including tables inside overflow-x wrappers).
 */
export function TableStickyHeaderPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const clones = new Map<HTMLTableElement, HTMLDivElement>()

    function syncClone(table: HTMLTableElement) {
      const headerRow = table.querySelector('tr:first-of-type')
      if (!headerRow) return
      const ths = headerRow.querySelectorAll('th')
      if (ths.length === 0) return

      const wrapper = table.parentElement
      if (!wrapper) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const headerRect = headerRow.getBoundingClientRect()
      const tableRect = table.getBoundingClientRect()

      const shouldShow = headerRect.bottom < 0 && tableRect.bottom > headerRect.height

      let clone = clones.get(table)

      if (!shouldShow) {
        if (clone) {
          clone.remove()
          clones.delete(table)
        }
        return
      }

      if (!clone) {
        clone = document.createElement('div')
        clone.className = 'le-table-sticky-header-clone-wrapper'
        clone.style.cssText = 'position:fixed;top:0;z-index:40;pointer-events:none;overflow:hidden;'
        document.body.appendChild(clone)
        clones.set(table, clone)
      }

      clone.style.left = `${wrapperRect.left}px`
      clone.style.width = `${wrapperRect.width}px`

      // Measure actual rendered column widths
      const colWidths: number[] = []
      ths.forEach((th) => colWidths.push(th.getBoundingClientRect().width))
      const scrollLeft = wrapper.scrollLeft

      // Clone the entire table, strip body rows, force exact column widths
      const cloneTable = table.cloneNode(true) as HTMLTableElement
      const cloneRows = cloneTable.querySelectorAll('tr')
      for (let i = 1; i < cloneRows.length; i++) {
        cloneRows[i].remove()
      }
      cloneTable.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'))
      cloneTable.querySelectorAll('[data-lexical-node-key]').forEach((el) => el.removeAttribute('data-lexical-node-key'))

      // Key: explicit pixel width + table-layout:fixed + colgroup widths
      // This overrides the CSS `width: 100%` and ensures the clone matches the original
      cloneTable.style.tableLayout = 'fixed'
      cloneTable.style.width = `${table.offsetWidth}px`
      cloneTable.style.marginLeft = `${-scrollLeft}px`

      // Replace colgroup with exact measured widths
      let colgroup = cloneTable.querySelector('colgroup')
      if (!colgroup) {
        colgroup = document.createElement('colgroup')
        cloneTable.prepend(colgroup)
      }
      colgroup.innerHTML = ''
      colWidths.forEach((w) => {
        const col = document.createElement('col')
        col.style.width = `${w}px`
        colgroup!.appendChild(col)
      })

      // Handle frozen columns in the clone: counteract the horizontal scroll
      // offset so frozen cells stay pinned at the left edge
      const frozenCount = parseInt(table.getAttribute('data-lexical-frozen-column') ? '1' : '0', 10)
      if (frozenCount > 0 && scrollLeft > 0) {
        const cloneHeaderRow = cloneTable.querySelector('tr:first-of-type')
        if (cloneHeaderRow) {
          // Read frozenColumnCount from the wrapper's data or the original table's frozen cells
          const origFrozenCells = table.querySelectorAll('tr:first-of-type .le-table-frozen-cell')
          const frozenCellCount = origFrozenCells.length
          const cloneCells = cloneHeaderRow.querySelectorAll('th')
          for (let i = 0; i < frozenCellCount && i < cloneCells.length; i++) {
            const cell = cloneCells[i] as HTMLElement
            cell.style.position = 'relative'
            cell.style.left = `${scrollLeft}px`
            cell.style.zIndex = '2'
            cell.style.backgroundColor = '#f3f4f6' // gray-100, ensure opaque
          }
        }
      }

      clone.innerHTML = ''
      clone.appendChild(cloneTable)
    }

    function updateAll() {
      const rootEl = editor.getRootElement()
      if (!rootEl) return
      const tables = rootEl.querySelectorAll<HTMLTableElement>(
        'table[data-lexical-frozen-row]',
      )
      const activeTables = new Set<HTMLTableElement>()

      tables.forEach((table) => {
        activeTables.add(table)
        syncClone(table)
      })

      for (const [table, clone] of clones) {
        if (!activeTables.has(table)) {
          clone.remove()
          clones.delete(table)
        }
      }
    }

    const scrollHandler = () => requestAnimationFrame(updateAll)
    window.addEventListener('scroll', scrollHandler, { passive: true })

    const rootEl = editor.getRootElement()
    let wrapperObserver: MutationObserver | null = null
    const wrapperScrollHandlers = new Map<HTMLElement, () => void>()

    function attachWrapperListeners() {
      for (const [el, handler] of wrapperScrollHandlers) {
        el.removeEventListener('scroll', handler)
      }
      wrapperScrollHandlers.clear()
      if (!rootEl) return
      rootEl.querySelectorAll<HTMLElement>('.le-table-scrollable-wrapper').forEach((w) => {
        const handler = () => requestAnimationFrame(updateAll)
        w.addEventListener('scroll', handler, { passive: true })
        wrapperScrollHandlers.set(w, handler)
      })
    }

    attachWrapperListeners()

    if (rootEl) {
      wrapperObserver = new MutationObserver(() => {
        attachWrapperListeners()
        updateAll()
      })
      wrapperObserver.observe(rootEl, { childList: true, subtree: true })
    }

    const unregister = editor.registerMutationListener(TableNode, () => {
      requestAnimationFrame(updateAll)
    })

    return () => {
      window.removeEventListener('scroll', scrollHandler)
      for (const [el, handler] of wrapperScrollHandlers) {
        el.removeEventListener('scroll', handler)
      }
      wrapperObserver?.disconnect()
      unregister()
      for (const clone of clones.values()) {
        clone.remove()
      }
      clones.clear()
    }
  }, [editor])

  return null
}
