import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { type JSX } from 'react'

export type SerializedCodeSnippetNode = Spread<
  {
    type: 'code-snippet'
    version: 1
    code: string
    language: string
  },
  SerializedLexicalNode
>

const DEFAULT_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'plaintext', label: 'Plain Text' },
]

function CodeSnippetComponent({
  code: initialCode,
  language: initialLanguage,
  nodeKey,
  editable,
  editor,
}: {
  code: string
  language: string
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(initialCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [initialCode])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      editor.update(() => {
        const node = editor.getEditorState().read(() => {
          const editorState = editor.getEditorState()
          let targetNode: CodeSnippetNode | null = null
          editorState.read(() => {
            // Find the node by key
          })
          return targetNode
        })
      })
    },
    [editor, nodeKey],
  )

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      editor.update(() => {
        const node = $getCodeSnippetNodeByKey(editor, nodeKey)
        if (node) {
          node.setLanguage(newLang)
        }
      })
    },
    [editor, nodeKey],
  )

  const lines = initialCode.split('\n')

  return (
    <div className="le-code-snippet" data-lexical-node-key={nodeKey}>
      <div className="le-code-snippet-header">
        {editable ? (
          <select
            value={initialLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="le-code-snippet-lang-select"
          >
            {DEFAULT_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="le-code-snippet-lang-label">
            {DEFAULT_LANGUAGES.find((l) => l.id === initialLanguage)?.label ?? initialLanguage}
          </span>
        )}
        <button onClick={handleCopy} className="le-code-snippet-copy">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="le-code-snippet-body">
        <div className="le-code-snippet-lines">
          {lines.map((_, i) => (
            <span key={i} className="le-code-snippet-line-num">
              {i + 1}
            </span>
          ))}
        </div>
        {editable ? (
          <textarea
            value={initialCode}
            onChange={(e) => {
              editor.update(() => {
                const node = $getCodeSnippetNodeByKey(editor, nodeKey)
                if (node) {
                  node.setCode(e.target.value)
                }
              })
            }}
            className="le-code-snippet-textarea"
            spellCheck={false}
          />
        ) : (
          <pre className="le-code-snippet-pre">
            <code>{initialCode}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

function $getCodeSnippetNodeByKey(
  editor: LexicalEditor,
  key: NodeKey,
): CodeSnippetNode | null {
  const node = editor._editorState._nodeMap.get(key)
  if (node instanceof CodeSnippetNode) return node as CodeSnippetNode
  return null
}

export class CodeSnippetNode extends DecoratorNode<JSX.Element> {
  __code: string
  __language: string

  static getType(): string {
    return 'code-snippet'
  }

  static clone(node: CodeSnippetNode): CodeSnippetNode {
    return new CodeSnippetNode(node.__code, node.__language, node.__key)
  }

  constructor(code: string, language: string = 'javascript', key?: NodeKey) {
    super(key)
    this.__code = code
    this.__language = language
  }

  static importJSON(serializedNode: SerializedCodeSnippetNode): CodeSnippetNode {
    return $createCodeSnippetNode(serializedNode.code, serializedNode.language)
  }

  exportJSON(): SerializedCodeSnippetNode {
    return {
      type: 'code-snippet',
      version: 1,
      code: this.__code,
      language: this.__language,
    }
  }

  exportDOM(): DOMExportOutput {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.className = `language-${this.__language}`
    code.textContent = this.__code
    pre.appendChild(code)
    return { element: pre }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  getCode(): string { return this.__code }
  getLanguage(): string { return this.__language }

  setCode(code: string): void {
    const writable = this.getWritable()
    writable.__code = code
  }

  setLanguage(language: string): void {
    const writable = this.getWritable()
    writable.__language = language
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <CodeSnippetComponent
        code={this.__code}
        language={this.__language}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createCodeSnippetNode(
  code: string = '',
  language: string = 'javascript',
): CodeSnippetNode {
  return new CodeSnippetNode(code, language)
}

export function $isCodeSnippetNode(
  node: LexicalNode | null | undefined,
): node is CodeSnippetNode {
  return node instanceof CodeSnippetNode
}
