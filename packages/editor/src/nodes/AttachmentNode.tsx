import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { FileText, FileImage, FileVideo, File } from 'lucide-react'
import { type JSX } from 'react'

export type SerializedAttachmentNode = Spread<
  {
    type: 'attachment'
    version: 1
    url: string
    fileName: string
    fileSize: number
    mimeType: string
  },
  SerializedLexicalNode
>

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('video/')) return FileVideo
  if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document'))
    return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentComponent({
  url,
  fileName,
  fileSize,
  mimeType,
  nodeKey,
}: {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  nodeKey: NodeKey
}) {
  const Icon = getFileIcon(mimeType)

  return (
    <span className="le-attachment" data-lexical-node-key={nodeKey}>
      <Icon size={16} className="le-attachment-icon" />
      <span className="le-attachment-name">{fileName}</span>
      {fileSize > 0 && (
        <span className="le-attachment-size">({formatFileSize(fileSize)})</span>
      )}
    </span>
  )
}

export class AttachmentNode extends DecoratorNode<JSX.Element> {
  __url: string
  __fileName: string
  __fileSize: number
  __mimeType: string

  static getType(): string {
    return 'attachment'
  }

  static clone(node: AttachmentNode): AttachmentNode {
    return new AttachmentNode(
      node.__url, node.__fileName, node.__fileSize, node.__mimeType, node.__key,
    )
  }

  constructor(url: string, fileName: string, fileSize: number, mimeType: string, key?: NodeKey) {
    super(key)
    this.__url = url
    this.__fileName = fileName
    this.__fileSize = fileSize
    this.__mimeType = mimeType
  }

  static importJSON(serializedNode: SerializedAttachmentNode): AttachmentNode {
    return $createAttachmentNode({
      url: serializedNode.url,
      fileName: serializedNode.fileName,
      fileSize: serializedNode.fileSize,
      mimeType: serializedNode.mimeType,
    })
  }

  exportJSON(): SerializedAttachmentNode {
    return {
      type: 'attachment',
      version: 1,
      url: this.__url,
      fileName: this.__fileName,
      fileSize: this.__fileSize,
      mimeType: this.__mimeType,
    }
  }

  exportDOM(): DOMExportOutput {
    const a = document.createElement('a')
    a.href = this.__url
    a.textContent = this.__fileName
    a.download = this.__fileName
    return { element: a }
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.style.display = 'inline'
    return span
  }

  updateDOM(): false {
    return false
  }

  isInline(): true {
    return true
  }

  decorate(_editor: LexicalEditor): JSX.Element {
    return (
      <AttachmentComponent
        url={this.__url}
        fileName={this.__fileName}
        fileSize={this.__fileSize}
        mimeType={this.__mimeType}
        nodeKey={this.__key}
      />
    )
  }
}

export function $createAttachmentNode(options: {
  url: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}): AttachmentNode {
  return new AttachmentNode(
    options.url,
    options.fileName ?? 'file',
    options.fileSize ?? 0,
    options.mimeType ?? 'application/octet-stream',
  )
}

export function $isAttachmentNode(node: LexicalNode | null | undefined): node is AttachmentNode {
  return node instanceof AttachmentNode
}
