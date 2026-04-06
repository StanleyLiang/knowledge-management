import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

export interface SlideData {
  title: string
  nodes: SerializedLexicalNode[]
}

/**
 * Extract slides from a Lexical serialized editor state.
 * Splits on H1 and H2 headings — each H1/H2 starts a new slide.
 * Content before the first H1/H2 becomes the first slide.
 */
export function extractSlides(
  editorState: SerializedEditorState | string,
): SlideData[] {
  const state: SerializedEditorState =
    typeof editorState === 'string' ? JSON.parse(editorState) : editorState

  const rootChildren = state.root?.children ?? []
  if (rootChildren.length === 0) return []

  const slides: SlideData[] = []
  let currentNodes: SerializedLexicalNode[] = []
  let currentTitle = ''

  for (const node of rootChildren) {
    const isSlideBreak =
      node.type === 'heading' &&
      ('tag' in node) &&
      (node.tag === 'h1' || node.tag === 'h2')

    if (isSlideBreak) {
      // Save previous slide if it has content
      if (currentNodes.length > 0) {
        slides.push({ title: currentTitle, nodes: currentNodes })
      }

      // Start new slide
      currentTitle = extractTextFromNode(node)
      currentNodes = [node]
    } else {
      currentNodes.push(node)
    }
  }

  // Push last slide
  if (currentNodes.length > 0) {
    slides.push({ title: currentTitle, nodes: currentNodes })
  }

  return slides
}

function extractTextFromNode(node: SerializedLexicalNode): string {
  if ('text' in node && typeof node.text === 'string') {
    return node.text
  }
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join('')
  }
  return ''
}

/**
 * Build a SerializedEditorState containing only the given nodes.
 */
export function buildSlideState(nodes: SerializedLexicalNode[]): SerializedEditorState {
  return {
    root: {
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as SerializedEditorState
}
