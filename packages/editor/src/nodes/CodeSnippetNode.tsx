import {
  DecoratorNode,
  $getNodeByKey,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useState, useCallback, useEffect, useRef, type JSX } from 'react'
import { Copy, Check } from 'lucide-react'

export type SerializedCodeSnippetNode = Spread<
  {
    type: 'code-snippet'
    version: 1
    code: string
    language: string
  },
  SerializedLexicalNode
>

export const DEFAULT_LANGUAGES = [
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

/* ── Prism lazy loader ── */
let prismLoaded = false
async function loadPrism(): Promise<typeof import('prismjs')> {
  const Prism = (await import('prismjs')).default
  if (!prismLoaded) {
    // Load common languages
    await Promise.allSettled([
      import('prismjs/components/prism-typescript'),
      import('prismjs/components/prism-python'),
      import('prismjs/components/prism-java'),
      import('prismjs/components/prism-go'),
      import('prismjs/components/prism-rust'),
      import('prismjs/components/prism-bash'),
      import('prismjs/components/prism-json'),
      import('prismjs/components/prism-yaml'),
      import('prismjs/components/prism-sql'),
      import('prismjs/components/prism-markdown'),
      import('prismjs/components/prism-css'),
    ])
    prismLoaded = true
  }
  return Prism
}

/* ── Highlighted Code Display ── */
function HighlightedCode({ code, language }: { code: string; language: string }) {
  const ref = useRef<HTMLElement>(null)
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    loadPrism().then((Prism) => {
      if (cancelled) return
      const grammar = Prism.languages[language] || Prism.languages['plaintext']
      if (grammar) {
        setHtml(Prism.highlight(code, grammar, language))
      } else {
        setHtml(escapeHtml(code))
      }
    })
    return () => { cancelled = true }
  }, [code, language])

  if (!html) {
    return (
      <pre className="le-code-snippet-pre">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <pre className="le-code-snippet-pre">
      <code
        ref={ref}
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  )
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ── Component ── */
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

  const handleLanguageChange = useCallback(
    (newLang: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node instanceof CodeSnippetNode) {
          node.setLanguage(newLang)
        }
      })
    },
    [editor, nodeKey],
  )

  const handleCodeChange = useCallback(
    (newCode: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node instanceof CodeSnippetNode) {
          node.setCode(newCode)
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
        <div className="le-code-snippet-code-wrapper">
          <HighlightedCode code={initialCode} language={initialLanguage} />
          {editable && (
            <textarea
              value={initialCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="le-code-snippet-textarea"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Node class ── */

export class CodeSnippetNode extends DecoratorNode<JSX.Element> {
  __code: string
  __language: string

  static getType(): string { return 'code-snippet' }

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
    return { type: 'code-snippet', version: 1, code: this.__code, language: this.__language }
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

  updateDOM(): false { return false }
  isInline(): false { return false }

  getCode(): string { return this.__code }
  getLanguage(): string { return this.__language }

  setCode(code: string): void { this.getWritable().__code = code }
  setLanguage(language: string): void { this.getWritable().__language = language }

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

export function $createCodeSnippetNode(code: string = '', language: string = 'javascript'): CodeSnippetNode {
  return new CodeSnippetNode(code, language)
}

export function $isCodeSnippetNode(node: LexicalNode | null | undefined): node is CodeSnippetNode {
  return node instanceof CodeSnippetNode
}
