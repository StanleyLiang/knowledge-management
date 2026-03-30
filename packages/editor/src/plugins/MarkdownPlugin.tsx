import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import {
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
  type ElementTransformer,
} from '@lexical/markdown'
import { $createParagraphNode } from 'lexical'
import {
  $createCodeSnippetNode,
  $isCodeSnippetNode,
  CodeSnippetNode,
} from '../nodes/CodeSnippetNode'

/**
 * Custom transformer: ```lang → CodeSnippetNode
 * Replaces the built-in CODE transform to use our CodeSnippetNode.
 */
const CODE_SNIPPET_TRANSFORMER: ElementTransformer = {
  dependencies: [CodeSnippetNode],
  export: (node) => {
    if (!$isCodeSnippetNode(node)) return null
    return `\`\`\`${node.getLanguage()}\n${node.getCode()}\n\`\`\``
  },
  regExp: /^```(\w+)?\s?$/,
  replace: (parentNode, _children, match) => {
    const language = match[1] || 'plaintext'
    const codeNode = $createCodeSnippetNode('', language)
    const paragraphAfter = $createParagraphNode()
    parentNode.insertAfter(codeNode)
    codeNode.insertAfter(paragraphAfter)
    parentNode.remove()
    paragraphAfter.selectStart()
  },
  type: 'element',
}

const TRANSFORMERS = [
  CODE_SNIPPET_TRANSFORMER,
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
]

export function MarkdownPlugin() {
  return <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
}
