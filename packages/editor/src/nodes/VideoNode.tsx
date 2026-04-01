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
import { Trash2 } from 'lucide-react'
import { useResizable } from '../hooks/useResizable'
import { ResizeHandles } from '../components/editor/ResizeHandles'
import { FloatingNodeToolbar } from '../components/editor/FloatingNodeToolbar'

export type VideoFormat = 'mp4' | 'hls'
export type VideoStatus = 'ready' | 'uploading' | 'converting' | 'error'

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
  status,
  errorMessage,
  nodeKey,
  editable,
  editor,
}: {
  src: string
  width: number
  height: number
  format: VideoFormat
  status: VideoStatus
  errorMessage: string
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [isSelected, setIsSelected] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  const hlsSrcRef = useRef<string>('')

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

  // HLS.js dynamic import — guard against re-render loops
  useEffect(() => {
    if (status !== 'ready') return
    if (format !== 'hls' || !videoRef.current) return
    // Skip if already attached to the same source
    if (hlsRef.current && hlsSrcRef.current === src) return

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    let cancelled = false
    hlsSrcRef.current = src

    import('hls.js').then((HlsModule) => {
      if (cancelled || !videoRef.current) return
      const Hls = HlsModule.default
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true })
        hlsRef.current = hls
        hls.loadSource(src)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {})
        })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src
      }
    }).catch(() => {
      if (videoRef.current) videoRef.current.src = src
    })

    return () => {
      cancelled = true
      // Don't destroy on re-render — only on unmount or src change
    }
  }, [src, format, status])

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

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
      {isSelected && editable && status === 'ready' && (
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

      {/* Status overlay */}
      {status !== 'ready' && (
        <div className="le-video-status-overlay" style={{ width: size.width, height: size.height }}>
          {status === 'uploading' && (
            <div className="le-video-status-content">
              <div className="le-video-spinner" />
              <span>Uploading...</span>
            </div>
          )}
          {status === 'converting' && (
            <div className="le-video-status-content">
              <div className="le-video-spinner" />
              <span>Converting...</span>
            </div>
          )}
          {status === 'error' && (
            <div className="le-video-status-content le-video-status-error">
              <span>⚠️ {errorMessage || 'Upload failed'}</span>
            </div>
          )}
        </div>
      )}

      {/* Video player — show preview during upload, real player when ready */}
      <video
        ref={videoRef}
        src={format === 'mp4' ? src : undefined}
        width={size.width}
        height={size.height}
        controls={status === 'ready'}
        className={`le-video ${status !== 'ready' ? 'le-video-loading' : ''}`}
        draggable={false}
      />

      {isSelected && editable && status === 'ready' && <ResizeHandles onDragStart={onDragStart} />}
    </span>
  )
}

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string
  __width: number
  __height: number
  __format: VideoFormat
  __status: VideoStatus
  __errorMessage: string
  __jobId: string

  static getType(): string { return 'video' }

  static clone(node: VideoNode): VideoNode {
    const n = new VideoNode(node.__src, node.__width, node.__height, node.__format, node.__key)
    n.__status = node.__status
    n.__errorMessage = node.__errorMessage
    n.__jobId = node.__jobId
    return n
  }

  constructor(src: string, width: number, height: number, format: VideoFormat = 'mp4', key?: NodeKey) {
    super(key)
    this.__src = src
    this.__width = width
    this.__height = height
    this.__format = format
    this.__status = 'ready'
    this.__errorMessage = ''
    this.__jobId = ''
  }

  setStatus(status: VideoStatus): void { this.getWritable().__status = status }
  setJobId(jobId: string): void { this.getWritable().__jobId = jobId }
  getJobId(): string { return this.__jobId }
  setErrorMessage(msg: string): void { this.getWritable().__errorMessage = msg }
  setSrc(src: string): void { this.getWritable().__src = src }
  setFormat(format: VideoFormat): void { this.getWritable().__format = format }

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

  updateDOM(): false { return false }
  isInline(): true { return true }

  setWidth(width: number): void { this.getWritable().__width = width }
  setHeight(height: number): void { this.getWritable().__height = height }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <VideoComponent
        src={this.__src}
        width={this.__width}
        height={this.__height}
        format={this.__format}
        status={this.__status}
        errorMessage={this.__errorMessage}
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
