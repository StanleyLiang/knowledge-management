import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical'
import { Globe, Pencil, Trash2 } from 'lucide-react'
import { type JSX } from 'react'

export type SerializedBookmarkNode = Spread<
  {
    type: 'bookmark'
    version: 1
    title: string
    url: string
  },
  SerializedLexicalNode
>

function BookmarkEditorComponent({
  title,
  url,
  nodeKey,
}: {
  title: string
  url: string
  nodeKey: NodeKey
}) {
  return (
    <div className="le-bookmark" data-lexical-node-key={nodeKey}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="le-bookmark-link"
      >
        <Globe size={20} className="le-bookmark-icon" />
        <div className="le-bookmark-text">
          <div className="le-bookmark-title">{title || 'Untitled'}</div>
          <div className="le-bookmark-url">{url}</div>
        </div>
      </a>
    </div>
  )
}

export class BookmarkNode extends DecoratorNode<JSX.Element> {
  __title: string
  __url: string

  static getType(): string {
    return 'bookmark'
  }

  static clone(node: BookmarkNode): BookmarkNode {
    return new BookmarkNode(node.__title, node.__url, node.__key)
  }

  constructor(title: string, url: string, key?: NodeKey) {
    super(key)
    this.__title = title
    this.__url = url
  }

  static importJSON(serializedNode: SerializedBookmarkNode): BookmarkNode {
    return $createBookmarkNode(serializedNode.title, serializedNode.url)
  }

  exportJSON(): SerializedBookmarkNode {
    return {
      type: 'bookmark',
      version: 1,
      title: this.__title,
      url: this.__url,
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a')
    element.href = this.__url
    element.target = '_blank'
    element.rel = 'noopener noreferrer'
    element.textContent = this.__title || this.__url
    return { element }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  getTitle(): string {
    return this.__title
  }

  getUrl(): string {
    return this.__url
  }

  setTitle(title: string): void {
    const writable = this.getWritable()
    writable.__title = title
  }

  setUrl(url: string): void {
    const writable = this.getWritable()
    writable.__url = url
  }

  isInline(): false {
    return false
  }

  decorate(_editor: LexicalEditor): JSX.Element {
    return (
      <BookmarkEditorComponent
        title={this.__title}
        url={this.__url}
        nodeKey={this.__key}
      />
    )
  }
}

export function $createBookmarkNode(title: string, url: string): BookmarkNode {
  return new BookmarkNode(title, url)
}

export function $isBookmarkNode(node: LexicalNode | null | undefined): node is BookmarkNode {
  return node instanceof BookmarkNode
}
