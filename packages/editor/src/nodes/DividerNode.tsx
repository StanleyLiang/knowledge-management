import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { type JSX } from 'react'

export type SerializedDividerNode = Spread<
  { type: 'divider'; version: 1 },
  SerializedLexicalNode
>

function DividerComponent({ nodeKey }: { nodeKey: NodeKey }) {
  return <hr className="le-divider" data-lexical-node-key={nodeKey} />
}

export class DividerNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'divider'
  }

  static clone(node: DividerNode): DividerNode {
    return new DividerNode(node.__key)
  }

  static importJSON(_serializedNode: SerializedDividerNode): DividerNode {
    return $createDividerNode()
  }

  static importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: () => ({ node: $createDividerNode() }),
        priority: 0,
      }),
    }
  }

  exportJSON(): SerializedDividerNode {
    return { type: 'divider', version: 1 }
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement('hr') }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  getTextContent(): string {
    return '\n'
  }

  isInline(): false {
    return false
  }

  decorate(): JSX.Element {
    return <DividerComponent nodeKey={this.__key} />
  }
}

export function $createDividerNode(): DividerNode {
  return new DividerNode()
}

export function $isDividerNode(node: LexicalNode | null | undefined): node is DividerNode {
  return node instanceof DividerNode
}
