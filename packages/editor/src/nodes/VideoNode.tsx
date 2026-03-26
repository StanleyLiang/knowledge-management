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
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import { useResizable } from '../hooks/useResizable'
import { ResizeHandles } from '../components/editor/ResizeHandles'
import { FloatingNodeToolbar } from '../components/editor/FloatingNodeToolbar'

export type VideoFormat = 'mp4' | 'hls'

export type SerializedVideoNode = Spread<
  {
    type: 'video'
    version: 1
    src: string
    width: number
    height: number
    format: VideoFormat
  },
  SerializedLexicalNode
>

function VideoComponent({
  src,
  width: initialWidth,
  height: initialHeight,
  format,
  nodeKey,
  editable,
  editor,
}: {
  src: string
  width: number
  height: number
  format: VideoFormat
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [isSelected, setIsSelected] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const updateNode = useCallback(
    (updater: (node: VideoNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node instanceof VideoNode) {
          updater(node.getWritable() as VideoNode)
        }
      })
    },
    [editor, nodeKey],
  )

  const { size, onDragStart, setWidth, setHeight } = useResizable({
    initialWidth,
    initialHeight,
    minWidth: 100,
    onResize: (w, h) => {
      updateNode((node) => {
        node.__width = Math.round(w)
        node.__height = Math.round(h)
      })
    },
  })

  // HLS.js dynamic import
  useEffect(() => {
    if (format !== 'hls' || !videoRef.current) return

    let hls: { destroy: () => void } | null = null
    import('hls.js').then((HlsModule) => {
      const Hls = HlsModule.default
      if (Hls.isSupported() && videoRef.current) {
        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(videoRef.current)
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src
      }
    }).catch(() => {
      // HLS.js not available, fallback
      if (videoRef.current) videoRef.current.src = src
    })

    return () => { hls?.destroy() }
  }, [src, format])

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (node) node.remove()
    })
  }, [editor, nodeKey])

  return (
    <span
      className={`le-video-wrapper ${isSelected && editable ? 'le-node-selected' : ''}`}
      data-lexical-node-key={nodeKey}
      onClick={() => editable && setIsSelected(true)}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setIsSelected(false)
      }}
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
          <button className="le-node-toolbar-btn" onClick={deleteNode} title="Delete">
            <Trash2 size={14} />
          </button>
        </FloatingNodeToolbar>
      )}

      <video
        ref={videoRef}
        src={format === 'mp4' ? src : undefined}
        width={size.width}
        height={size.height}
        controls
        className="le-video"
        draggable={false}
      />

      {isSelected && editable && <ResizeHandles onDragStart={onDragStart} />}
    </span>
  )
}

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string
  __width: number
  __height: number
  __format: VideoFormat

  static getType(): string {
    return 'video'
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__width, node.__height, node.__format, node.__key)
  }

  constructor(src: string, width: number, height: number, format: VideoFormat = 'mp4', key?: NodeKey) {
    super(key)
    this.__src = src
    this.__width = width
    this.__height = height
    this.__format = format
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return $createVideoNode({
      src: serializedNode.src,
      width: serializedNode.width,
      height: serializedNode.height,
      format: serializedNode.format,
    })
  }

  exportJSON(): SerializedVideoNode {
    return {
      type: 'video',
      version: 1,
      src: this.__src,
      width: this.__width,
      height: this.__height,
      format: this.__format,
    }
  }

  exportDOM(): DOMExportOutput {
    const video = document.createElement('video')
    video.src = this.__src
    video.width = this.__width
    video.height = this.__height
    video.controls = true
    return { element: video }
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

  setWidth(width: number): void {
    const writable = this.getWritable()
    writable.__width = width
  }

  setHeight(height: number): void {
    const writable = this.getWritable()
    writable.__height = height
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <VideoComponent
        src={this.__src}
        width={this.__width}
        height={this.__height}
        format={this.__format}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createVideoNode(options: {
  src: string
  width?: number
  height?: number
  format?: VideoFormat
}): VideoNode {
  return new VideoNode(
    options.src,
    options.width ?? 640,
    options.height ?? 360,
    options.format ?? 'mp4',
  )
}

export function $isVideoNode(node: LexicalNode | null | undefined): node is VideoNode {
  return node instanceof VideoNode
}
