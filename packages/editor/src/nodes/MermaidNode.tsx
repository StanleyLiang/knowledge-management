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
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { FloatingNodeToolbar } from '../components/editor/FloatingNodeToolbar'
import { useResizable } from '../hooks/useResizable'
import { ResizeHandles } from '../components/editor/ResizeHandles'

export type SerializedMermaidNode = Spread<
  {
    type: 'mermaid'
    version: 1
    source: string
    width: number
    height: number
  },
  SerializedLexicalNode
>

function MermaidComponent({
  source: initialSource,
  width: initialWidth,
  height: initialHeight,
  nodeKey,
  editable,
  editor,
}: {
  source: string
  width: number
  height: number
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [isSelected, setIsSelected] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editSource, setEditSource] = useState(initialSource)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string>('')

  const updateNode = useCallback(
    (updater: (node: MermaidNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node instanceof MermaidNode) {
          updater(node.getWritable() as MermaidNode)
        }
      })
    },
    [editor, nodeKey],
  )

  const { size, onDragStart, setWidth, setHeight } = useResizable({
    initialWidth,
    initialHeight,
    minWidth: 200,
    minHeight: 100,
    lockAspectRatio: false,
    onResize: (w, h) => {
      updateNode((node) => {
        node.__width = Math.round(w)
        node.__height = Math.round(h)
      })
    },
  })

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
    updateNode((node) => { node.__source = editSource })
    setIsEditing(false)
  }, [updateNode, editSource])

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.remove()
    })
  }, [editor, nodeKey])

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
      className={`le-mermaid ${isSelected && editable ? 'le-node-selected' : ''}`}
      style={{ width: size.width }}
      data-lexical-node-key={nodeKey}
      onClick={() => editable && setIsSelected(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setIsSelected(false)
      }}
      onDoubleClick={() => editable && setIsEditing(true)}
      tabIndex={editable ? 0 : undefined}
    >
      {isSelected && editable && (
        <FloatingNodeToolbar>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={Math.round(size.width)}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) setWidth(v) }}
            className="le-node-toolbar-input"
            title="Width"
          />
          <span className="text-xs text-gray-400">×</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={Math.round(size.height)}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) setHeight(v) }}
            className="le-node-toolbar-input"
            title="Height"
          />
          <div className="le-node-toolbar-sep" />
          <button className="le-node-toolbar-btn" onClick={() => setIsEditing(true)} title="Edit Source">
            <Pencil size={14} />
          </button>
          <button className="le-node-toolbar-btn" onClick={deleteNode} title="Delete">
            <Trash2 size={14} />
          </button>
        </FloatingNodeToolbar>
      )}
      {error ? (
        <div className="le-mermaid-error">
          <span>⚠️ Mermaid Error:</span> {error}
        </div>
      ) : svg ? (
        <div
          className="le-mermaid-svg"
          style={{ height: size.height }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="le-mermaid-loading">Loading diagram...</div>
      )}
      {isSelected && editable && <ResizeHandles onDragStart={onDragStart} />}
      {editable && !isEditing && !isSelected && (
        <div className="le-mermaid-hint">Click to select, double-click to edit</div>
      )}
    </div>
  )
}

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __source: string
  __width: number
  __height: number

  static getType(): string {
    return 'mermaid'
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__source, node.__width, node.__height, node.__key)
  }

  constructor(source: string, width: number = 600, height: number = 300, key?: NodeKey) {
    super(key)
    this.__source = source
    this.__width = width
    this.__height = height
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return $createMermaidNode(serializedNode.source, serializedNode.width, serializedNode.height)
  }

  exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      source: this.__source,
      width: this.__width,
      height: this.__height,
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
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    return span
  }

  updateDOM(): false {
    return false
  }

  isInline(): true {
    return true
  }

  getSource(): string { return this.__source }

  setSource(source: string): void {
    const writable = this.getWritable()
    writable.__source = source
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <MermaidComponent
        source={this.__source}
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createMermaidNode(
  source: string = '',
  width: number = 600,
  height: number = 300,
): MermaidNode {
  return new MermaidNode(source, width, height)
}

export function $isMermaidNode(
  node: LexicalNode | null | undefined,
): node is MermaidNode {
  return node instanceof MermaidNode
}
