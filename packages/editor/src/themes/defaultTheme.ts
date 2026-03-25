import type { EditorThemeClasses } from 'lexical'

export const defaultTheme: EditorThemeClasses = {
  paragraph: 'le-paragraph',
  heading: {
    h1: 'le-heading-h1',
    h2: 'le-heading-h2',
    h3: 'le-heading-h3',
    h4: 'le-heading-h4',
    h5: 'le-heading-h5',
    h6: 'le-heading-h6',
  },
  text: {
    bold: 'le-text-bold',
    italic: 'le-text-italic',
    underline: 'le-text-underline',
    strikethrough: 'le-text-strikethrough',
    code: 'le-text-code',
    subscript: 'le-text-subscript',
    superscript: 'le-text-superscript',
    underlineStrikethrough: 'le-text-underline-strikethrough',
  },
  list: {
    ul: 'le-list-ul',
    ol: 'le-list-ol',
    listitem: 'le-listitem',
    nested: {
      listitem: 'le-listitem-nested',
    },
    listitemChecked: 'le-listitem-checked',
    listitemUnchecked: 'le-listitem-unchecked',
    olDepth: ['le-list-ol-1', 'le-list-ol-2', 'le-list-ol-3'],
  },
  quote: 'le-quote',
  link: 'le-link',
  table: 'le-table',
  tableCell: 'le-table-cell',
  tableCellHeader: 'le-table-cell-header',
  tableRow: 'le-table-row',
}
