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
import { createPortal } from 'react-dom'
import { Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { FloatingNodeToolbar } from '../components/editor/FloatingNodeToolbar'

const CodeMirrorEditor = lazy(() =>
  import('../components/editor/CodeMirrorEditor').then((m) => ({ default: m.CodeMirrorEditor })),
)
import { useResizable } from '../hooks/useResizable'
import { ResizeHandles } from '../components/editor/ResizeHandles'

export type MermaidNodeStatus = 'idle' | 'processing' | 'error'

export type SerializedMermaidNode = Spread<
  {
    type: 'mermaid'
    version: 1
    source: string
    width: number
    height: number
    status?: MermaidNodeStatus
    errorMessage?: string | null
  },
  SerializedLexicalNode
>

/* ── Fullscreen Mermaid Editor (Portal) ── */

function MermaidEditor({
  source,
  onSave,
  onCancel,
}: {
  source: string
  onSave: (source: string) => void
  onCancel: () => void
}) {
  const [code, setCode] = useState(source)
  const [preview, setPreview] = useState<string>('')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced mermaid render
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!code.trim()) {
        setPreview('')
        setPreviewError(null)
        return
      }
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })
        const id = `mermaid-editor-preview-${Date.now()}`
        const { svg } = await mermaid.render(id, code)
        setPreview(svg)
        setPreviewError(null)
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : 'Syntax error')
        setPreview('')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [code])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return createPortal(
    <div className="le-mermaid-portal-overlay">
      <div className="le-mermaid-portal">
        <div className="le-mermaid-portal-header">
          <span className="le-mermaid-portal-title">Mermaid Editor</span>
          <button onClick={onCancel} className="le-mermaid-portal-close" title="Close (ESC)">
            <X size={18} />
          </button>
        </div>
        <div className="le-mermaid-portal-body">
          <div className="le-mermaid-portal-editor">
            <Suspense fallback={<div className="le-mermaid-loading">Loading editor...</div>}>
              <CodeMirrorEditor
                value={code}
                onChange={setCode}
                className="le-mermaid-portal-codemirror"
                autoFocus
              />
            </Suspense>
          </div>
          <div className="le-mermaid-portal-preview">
            {previewError ? (
              <div className="le-mermaid-error">{previewError}</div>
            ) : preview ? (
              <div
                className="le-mermaid-portal-preview-svg"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            ) : (
              <div className="le-mermaid-loading">Type Mermaid syntax to preview...</div>
            )}
          </div>
        </div>
        <div className="le-mermaid-portal-footer">
          <button onClick={onCancel} className="le-mermaid-btn">Cancel</button>
          <button onClick={() => onSave(code)} className="le-mermaid-btn le-mermaid-btn-primary">Save</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Mermaid Component ── */

function MermaidComponent({
  source: initialSource,
  width: initialWidth,
  height: initialHeight,
  status,
  errorMessage,
  nodeKey,
  editable,
  editor,
}: {
  source: string
  width: number
  height: number
  status: MermaidNodeStatus
  errorMessage: string | null
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [isSelected, setIsSelected] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
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

  const { size, onDragStart } = useResizable({
    initialWidth,
    initialHeight,
    minWidth: 200,
    minHeight: 100,
    aspectRatio: 0,
    onResize: (w, h) => {
      updateNode((node) => {
        node.__width = Math.round(w)
        node.__height = Math.round(h)
      })
    },
  })

  // Render mermaid SVG
  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })
        const id = `mermaid-${nodeKey}-${Date.now()}`
        const { svg: rendered } = await mermaid.render(id, initialSource)
        if (!cancelled) { setSvg(rendered); setError(null) }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Render error'); setSvg('') }
      }
    }
    if (initialSource.trim()) render()
    return () => { cancelled = true }
  }, [initialSource, nodeKey])

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.remove()
    })
  }, [editor, nodeKey])

  const handleSave = useCallback((newSource: string) => {
    updateNode((node) => { node.__source = newSource })
    setIsEditing(false)
  }, [updateNode])

  return (
    <>
      <div
        className={`le-mermaid ${isSelected && editable ? 'le-node-selected' : ''}`}
        style={{ width: size.width }}
        data-lexical-node-key={nodeKey}
        onClick={() => editable && setIsSelected(true)}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setIsSelected(false)
        }}
        tabIndex={editable ? 0 : undefined}
      >
        {/* Floating toolbar: only Edit Source + Delete per PRD */}
        {isSelected && editable && (
          <FloatingNodeToolbar>
            <button className="le-node-toolbar-btn" onClick={() => setIsEditing(true)} title="Edit Source">
              <Pencil size={14} />
            </button>
            <button className="le-node-toolbar-btn" onClick={deleteNode} title="Delete">
              <Trash2 size={14} />
            </button>
          </FloatingNodeToolbar>
        )}

        {/* Status-based rendering */}
        {status === 'processing' ? (
          <div className="le-mermaid-processing" style={{ height: size.height }}>
            <Loader2 size={24} className="le-mermaid-spinner" />
            <span>Generating diagram...</span>
          </div>
        ) : status === 'error' ? (
          <div className="le-mermaid-generation-error">
            <span>Failed to generate diagram</span>
            {errorMessage && <span className="le-mermaid-generation-error-detail">{errorMessage}</span>}
            {editable && (
              <button className="le-mermaid-generation-error-remove" onClick={deleteNode}>
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            )}
          </div>
        ) : error ? (
          <div className="le-mermaid-error">
            <span>Mermaid Error:</span> {error}
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
      </div>

      {/* Fullscreen Portal Editor */}
      {isEditing && editable && (
        <MermaidEditor
          source={initialSource}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </>
  )
}

/* ── Node Class ── */

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __source: string
  __width: number
  __height: number
  __status: MermaidNodeStatus
  __errorMessage: string | null

  static getType(): string { return 'mermaid' }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__source, node.__width, node.__height, node.__status, node.__errorMessage, node.__key)
  }

  constructor(
    source: string,
    width: number = 600,
    height: number = 300,
    status: MermaidNodeStatus = 'idle',
    errorMessage: string | null = null,
    key?: NodeKey,
  ) {
    super(key)
    this.__source = source
    this.__width = width
    this.__height = height
    this.__status = status
    this.__errorMessage = errorMessage
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return $createMermaidNode(
      serializedNode.source,
      serializedNode.width,
      serializedNode.height,
      serializedNode.status ?? 'idle',
      serializedNode.errorMessage ?? null,
    )
  }

  exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      source: this.__source,
      width: this.__width,
      height: this.__height,
      // status and errorMessage are transient UI states — always persist as idle
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

  updateDOM(): false { return false }
  isInline(): true { return true }

  getSource(): string { return this.__source }
  setSource(source: string): void { this.getWritable().__source = source }

  getStatus(): MermaidNodeStatus { return this.__status }
  setStatus(status: MermaidNodeStatus): void { this.getWritable().__status = status }

  getErrorMessage(): string | null { return this.__errorMessage }
  setErrorMessage(errorMessage: string | null): void { this.getWritable().__errorMessage = errorMessage }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <MermaidComponent
        source={this.__source}
        width={this.__width}
        height={this.__height}
        status={this.__status}
        errorMessage={this.__errorMessage}
        nodeKey={this.__key}
        editable={editor.isEditable()}
        editor={editor}
      />
    )
  }
}

export function $createMermaidNode(
  source: string = '',
  width: number = 600,
  height: number = 300,
  status: MermaidNodeStatus = 'idle',
  errorMessage: string | null = null,
): MermaidNode {
  return new MermaidNode(source, width, height, status, errorMessage)
}

export function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode {
  return node instanceof MermaidNode
}
