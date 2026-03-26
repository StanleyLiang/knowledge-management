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

export type SerializedMentionNode = Spread<
  {
    type: 'mention'
    version: 1
    mentionId: string
    mentionName: string
  },
  SerializedLexicalNode
>

function MentionComponent({
  mentionId,
  mentionName,
}: {
  mentionId: string
  mentionName: string
}) {
  return (
    <span className="le-mention" data-mention-id={mentionId}>
      @{mentionName}
    </span>
  )
}

export class MentionNode extends DecoratorNode<JSX.Element> {
  __mentionId: string
  __mentionName: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionId, node.__mentionName, node.__key)
  }

  constructor(mentionId: string, mentionName: string, key?: NodeKey) {
    super(key)
    this.__mentionId = mentionId
    this.__mentionName = mentionName
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.mentionId, serializedNode.mentionName)
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      version: 1,
      mentionId: this.__mentionId,
      mentionName: this.__mentionName,
    }
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span')
    span.className = 'le-mention'
    span.dataset.mentionId = this.__mentionId
    span.textContent = `@${this.__mentionName}`
    return { element: span }
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

  decorate(): JSX.Element {
    return (
      <MentionComponent
        mentionId={this.__mentionId}
        mentionName={this.__mentionName}
      />
    )
  }
}

export function $createMentionNode(
  mentionId: string,
  mentionName: string,
): MentionNode {
  return new MentionNode(mentionId, mentionName)
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode
}
