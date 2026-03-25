import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import {
  COMMAND_PRIORITY_EDITOR,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
} from 'lexical'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  TableCellHeaderStates,
} from '@lexical/table'
import { INSERT_TABLE_COMMAND } from './InsertCommands'

export function TablePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_TABLE_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          const { rows, columns } = payload
          const tableNode = $createTableNode()

          for (let r = 0; r < rows; r++) {
            const rowNode = $createTableRowNode()
            for (let c = 0; c < columns; c++) {
              const headerState =
                r === 0
                  ? TableCellHeaderStates.ROW
                  : TableCellHeaderStates.NO_STATUS
              const cellNode = $createTableCellNode(headerState)
              const paragraph = $createParagraphNode()
              paragraph.append($createTextNode(''))
              cellNode.append(paragraph)
              rowNode.append(cellNode)
            }
            tableNode.append(rowNode)
          }

          selection.insertNodes([tableNode])
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
