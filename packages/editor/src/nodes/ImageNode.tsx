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

export type ImageAlignment = 'left' | 'center' | 'right'

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
  width,
  height,
  alignment,
  showCaption,
  caption,
  nodeKey,
}: {
  src: string
  altText: string
  width: number
  height: number
  alignment: ImageAlignment
  showCaption: boolean
  caption: string
  nodeKey: NodeKey
}) {
  const alignClass =
    alignment === 'center'
      ? 'le-image-center'
      : alignment === 'right'
        ? 'le-image-right'
        : 'le-image-left'

  return (
    <span className={`le-image-wrapper ${alignClass}`} data-lexical-node-key={nodeKey}>
      <img
        src={src}
        alt={altText}
        width={width}
        height={height}
        loading="lazy"
        className="le-image"
        draggable={false}
      />
      {showCaption && caption && (
        <span className="le-image-caption">{caption}</span>
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
  __caption: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__alignment,
      node.__showCaption,
      node.__caption,
      node.__key,
    )
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

  decorate(_editor: LexicalEditor): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        alignment={this.__alignment}
        showCaption={this.__showCaption}
        caption={this.__caption}
        nodeKey={this.__key}
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
