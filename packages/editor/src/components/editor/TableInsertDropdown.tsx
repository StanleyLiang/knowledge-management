import { useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Table } from 'lucide-react'
import { INSERT_TABLE_COMMAND } from '../../plugins/InsertCommands'
import { Button } from '../ui/button'
import { Dropdown } from '../ui/dropdown'

export function TableInsertDropdown() {
  const [editor] = useLexicalComposerContext()
  const [rows, setRows] = useState('3')
  const [columns, setColumns] = useState('3')

  const handleInsert = () => {
    const r = parseInt(rows, 10)
    const c = parseInt(columns, 10)
    if (r > 0 && c > 0 && r <= 50 && c <= 20) {
      editor.focus(() => {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: r, columns: c })
      })
    }
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon">
          <Table size={16} />
        </Button>
      }
    >
      <div className="le-table-insert-form">
        <div className="le-table-insert-row">
          <label className="le-table-insert-label">Rows</label>
          <input
            type="number"
            min="1"
            max="50"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            className="le-table-insert-input"
          />
        </div>
        <div className="le-table-insert-row">
          <label className="le-table-insert-label">Columns</label>
          <input
            type="number"
            min="1"
            max="20"
            value={columns}
            onChange={(e) => setColumns(e.target.value)}
            className="le-table-insert-input"
          />
        </div>
        <button onClick={handleInsert} className="le-table-insert-btn">
          Insert Table
        </button>
      </div>
    </Dropdown>
  )
}
