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
import { useCallback, useState, type JSX } from 'react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  CaptionIcon,
  Trash2,
  ImageIcon,
} from 'lucide-react'
import { useResizable } from '../hooks/useResizable'
import { ResizeHandles } from '../components/editor/ResizeHandles'
import { FloatingNodeToolbar } from '../components/editor/FloatingNodeToolbar'

export type ImageAlignment = 'left' | 'center' | 'right'
export type ImageStatus = 'ready' | 'uploading' | 'converting' | 'error'

export type SerializedImageNode = Spread<
  {
    type: 'image'
    version: 1
    src: string
    altText: string
    width: number
    height: number
    alignment: ImageAlignment
    showCaption: boolean
    caption: string
  },
  SerializedLexicalNode
>

function ImageComponent({
  src,
  altText,
  width: initialWidth,
  height: initialHeight,
  alignment,
  showCaption,
  caption,
  status,
  errorMessage,
  nodeKey,
  editable,
  editor,
}: {
  src: string
  altText: string
  width: number
  height: number
  alignment: ImageAlignment
  showCaption: boolean
  caption: string
  status: ImageStatus
  errorMessage: string
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [isSelected, setIsSelected] = useState(false)
  const [captionText, setCaptionText] = useState(caption)

  const updateNode = useCallback(
    (updater: (node: ImageNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node instanceof ImageNode) {
          updater(node.getWritable() as ImageNode)
        }
      })
    },
    [editor, nodeKey],
  )

  const { size, onDragStart, setWidth, setHeight } = useResizable({
    initialWidth,
    initialHeight,
    minWidth: 50,
    onResize: (w, h) => {
      updateNode((node) => {
        node.__width = Math.round(w)
        node.__height = Math.round(h)
      })
    },
  })

  const setAlignment = useCallback(
    (a: ImageAlignment) => {
      updateNode((node) => { node.__alignment = a })
    },
    [updateNode],
  )

  const toggleCaption = useCallback(() => {
    updateNode((node) => {
      node.__showCaption = !node.__showCaption
      if (node.__showCaption && !node.__caption) node.__caption = ''
    })
  }, [updateNode])

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.remove()
    })
  }, [editor, nodeKey])

  const alignClass =
    alignment === 'center'
      ? 'le-image-center'
      : alignment === 'right'
        ? 'le-image-right'
        : 'le-image-left'

  return (
    <span
      className={`le-image-wrapper ${alignClass} ${isSelected && editable ? 'le-node-selected' : ''}`}
      data-lexical-node-key={nodeKey}
      onClick={() => editable && setIsSelected(true)}
      onBlur={(e) => {
        // Don't deselect if focus moved to a child element (e.g. toolbar input)
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setIsSelected(false)
      }}
      tabIndex={editable ? 0 : undefined}
    >
      {/* Floating Toolbar */}
      {isSelected && editable && (
        <FloatingNodeToolbar>
          <button
            className={`le-node-toolbar-btn ${alignment === 'left' ? 'le-node-toolbar-btn-active' : ''}`}
            onClick={() => setAlignment('left')}
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            className={`le-node-toolbar-btn ${alignment === 'center' ? 'le-node-toolbar-btn-active' : ''}`}
            onClick={() => setAlignment('center')}
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            className={`le-node-toolbar-btn ${alignment === 'right' ? 'le-node-toolbar-btn-active' : ''}`}
            onClick={() => setAlignment('right')}
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <div className="le-node-toolbar-sep" />
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
          <button
            className={`le-node-toolbar-btn ${showCaption ? 'le-node-toolbar-btn-active' : ''}`}
            onClick={toggleCaption}
            title="Toggle Caption"
          >
            Aa
          </button>
          <button className="le-node-toolbar-btn" onClick={deleteNode} title="Delete">
            <Trash2 size={14} />
          </button>
        </FloatingNodeToolbar>
      )}

      {/* Upload status overlay */}
      {status !== 'ready' && (
        <div className="le-image-status-overlay" style={{ width: size.width, height: size.height }}>
          {status === 'uploading' && (
            <div className="le-image-status-content">
              <div className="le-image-spinner" />
              <span>Uploading...</span>
            </div>
          )}
          {status === 'converting' && (
            <div className="le-image-status-content">
              <div className="le-image-spinner" />
              <span>Processing...</span>
            </div>
          )}
          {status === 'error' && (
            <div className="le-image-status-content le-image-status-error">
              <span>⚠️ {errorMessage || 'Upload failed'}</span>
              <button className="le-image-retry-btn">Retry</button>
            </div>
          )}
        </div>
      )}

      <img
        src={src}
        alt={altText}
        width={size.width}
        height={size.height}
        loading="lazy"
        className={`le-image ${status !== 'ready' ? 'le-image-loading' : ''}`}
        draggable={false}
      />

      {/* Resize Handles */}
      {isSelected && editable && <ResizeHandles onDragStart={onDragStart} />}

      {/* Caption */}
      {showCaption && (
        editable ? (
          <input
            value={captionText}
            onChange={(e) => {
              setCaptionText(e.target.value)
              updateNode((node) => { node.__caption = e.target.value })
            }}
            placeholder="Add a caption..."
            className="le-image-caption-input"
          />
        ) : (
          caption && <span className="le-image-caption">{caption}</span>
        )
      )}
    </span>
  )
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText: string
  __width: number
  __height: number
  __alignment: ImageAlignment
  __showCaption: boolean
  __status: ImageStatus
  __errorMessage: string
  __caption: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    const n = new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__alignment,
      node.__showCaption,
      node.__caption,
      node.__key,
    )
    n.__status = node.__status
    n.__errorMessage = node.__errorMessage
    return n
  }

  constructor(
    src: string,
    altText: string,
    width: number,
    height: number,
    alignment: ImageAlignment = 'left',
    showCaption: boolean = false,
    caption: string = '',
    key?: NodeKey,
  ) {
    super(key)
    this.__src = src
    this.__altText = altText
    this.__width = width
    this.__height = height
    this.__alignment = alignment
    this.__showCaption = showCaption
    this.__caption = caption
    this.__status = 'ready'
    this.__errorMessage = ''
  }

  setStatus(status: ImageStatus): void {
    const writable = this.getWritable()
    writable.__status = status
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
      alignment: serializedNode.alignment,
      showCaption: serializedNode.showCaption,
      caption: serializedNode.caption,
    })
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      showCaption: this.__showCaption,
      caption: this.__caption,
    }
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img')
    img.src = this.__src
    img.alt = this.__altText
    img.width = this.__width
    img.height = this.__height
    return { element: img }
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

  getSrc(): string { return this.__src }
  getAltText(): string { return this.__altText }
  getWidth(): number { return this.__width }
  getHeight(): number { return this.__height }
  getAlignment(): ImageAlignment { return this.__alignment }

  setWidth(width: number): void {
    const writable = this.getWritable()
    writable.__width = width
  }

  setHeight(height: number): void {
    const writable = this.getWritable()
    writable.__height = height
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable()
    writable.__alignment = alignment
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        alignment={this.__alignment}
        showCaption={this.__showCaption}
        caption={this.__caption}
        status={this.__status}
        errorMessage={this.__errorMessage}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createImageNode(options: {
  src: string
  altText?: string
  width?: number
  height?: number
  alignment?: ImageAlignment
  showCaption?: boolean
  caption?: string
}): ImageNode {
  return new ImageNode(
    options.src,
    options.altText ?? '',
    options.width ?? 300,
    options.height ?? 200,
    options.alignment ?? 'left',
    options.showCaption ?? false,
    options.caption ?? '',
  )
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
