// Extract plain text from a Lexical editor JSON tree.
// Walks the node tree and concatenates any `text` fields, inserting newlines
// for block-level boundaries so clustering/embeddings see document structure.

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
}

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'quote',
  'listitem',
  'list',
  'code',
  'table',
  'tablerow',
  'tablecell',
  'landmark',
  'collapsible-container',
])

export function extractPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: LexicalNode }).root
  if (!root) return ''
  const parts: string[] = []
  walk(root, parts)
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}

function walk(node: LexicalNode, out: string[]): void {
  if (typeof node.text === 'string') {
    out.push(node.text)
    return
  }
  if (node.children) {
    for (const child of node.children) walk(child, out)
  }
  if (node.type && BLOCK_TYPES.has(node.type)) {
    out.push('\n')
  }
}
