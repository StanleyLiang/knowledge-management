import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { type JSX } from 'react'

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
  width,
  height,
  format,
  nodeKey,
}: {
  src: string
  width: number
  height: number
  format: VideoFormat
  nodeKey: NodeKey
}) {
  return (
    <span className="le-video-wrapper" data-lexical-node-key={nodeKey}>
      <video
        src={format === 'mp4' ? src : undefined}
        width={width}
        height={height}
        controls
        className="le-video"
        draggable={false}
      />
      {format === 'hls' && (
        <span className="le-video-hls-badge">HLS</span>
      )}
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

  decorate(_editor: LexicalEditor): JSX.Element {
    return (
      <VideoComponent
        src={this.__src}
        width={this.__width}
        height={this.__height}
        format={this.__format}
        nodeKey={this.__key}
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
