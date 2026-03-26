import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type JSX } from 'react'

export type SerializedMermaidNode = Spread<
  {
    type: 'mermaid'
    version: 1
    source: string
  },
  SerializedLexicalNode
>

function MermaidComponent({
  source: initialSource,
  nodeKey,
  editable,
  editor,
}: {
  source: string
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editSource, setEditSource] = useState(initialSource)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
        })
        const id = `mermaid-${nodeKey}-${Date.now()}`
        const { svg: rendered } = await mermaid.render(id, initialSource)
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Render error')
          setSvg('')
        }
      }
    }
    if (initialSource.trim()) {
      render()
    }
    return () => { cancelled = true }
  }, [initialSource, nodeKey])

  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = editor._editorState._nodeMap.get(nodeKey)
      if (node instanceof MermaidNode) {
        (node.getWritable() as MermaidNode).__source = editSource
      }
    })
    setIsEditing(false)
  }, [editor, nodeKey, editSource])

  if (isEditing && editable) {
    return (
      <div className="le-mermaid le-mermaid-editing" data-lexical-node-key={nodeKey}>
        <textarea
          value={editSource}
          onChange={(e) => setEditSource(e.target.value)}
          className="le-mermaid-textarea"
          rows={8}
          spellCheck={false}
        />
        <div className="le-mermaid-actions">
          <button onClick={handleSave} className="le-mermaid-btn le-mermaid-btn-primary">
            Save
          </button>
          <button
            onClick={() => { setEditSource(initialSource); setIsEditing(false) }}
            className="le-mermaid-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="le-mermaid"
      data-lexical-node-key={nodeKey}
      onDoubleClick={() => editable && setIsEditing(true)}
    >
      {error ? (
        <div className="le-mermaid-error">
          <span>⚠️ Mermaid Error:</span> {error}
        </div>
      ) : svg ? (
        <div
          className="le-mermaid-svg"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="le-mermaid-loading">Loading diagram...</div>
      )}
      {editable && !isEditing && (
        <div className="le-mermaid-hint">Double-click to edit</div>
      )}
    </div>
  )
}

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __source: string

  static getType(): string {
    return 'mermaid'
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__source, node.__key)
  }

  constructor(source: string, key?: NodeKey) {
    super(key)
    this.__source = source
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return $createMermaidNode(serializedNode.source)
  }

  exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      source: this.__source,
    }
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div')
    div.className = 'le-mermaid'
    const pre = document.createElement('pre')
    pre.className = 'mermaid'
    pre.textContent = this.__source
    div.appendChild(pre)
    return { element: div }
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

  getSource(): string {
    return this.__source
  }

  setSource(source: string): void {
    const writable = this.getWritable()
    writable.__source = source
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <MermaidComponent
        source={this.__source}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createMermaidNode(source: string = ''): MermaidNode {
  return new MermaidNode(source)
}

export function $isMermaidNode(
  node: LexicalNode | null | undefined,
): node is MermaidNode {
  return node instanceof MermaidNode
}
