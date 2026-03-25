import {
  ElementNode,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
  $createParagraphNode,
  type RangeSelection,
  type EditorConfig,
} from 'lexical'

// ========== CollapsibleContainerNode ==========

export type SerializedCollapsibleContainerNode = Spread<
  { type: 'collapsible-container'; version: 1; open: boolean },
  SerializedElementNode
>

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean

  static getType(): string {
    return 'collapsible-container'
  }

  static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key)
  }

  constructor(open: boolean = true, key?: NodeKey) {
    super(key)
    this.__open = open
  }

  static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
    const node = $createCollapsibleContainerNode(serializedNode.open)
    return node
  }

  exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-container',
      version: 1,
      open: this.__open,
    }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement('details')
    el.classList.add('le-collapsible')
    if (this.__open) el.open = true
    return el
  }

  updateDOM(prevNode: CollapsibleContainerNode, dom: HTMLDetailsElement): boolean {
    if (prevNode.__open !== this.__open) {
      dom.open = this.__open
    }
    return false
  }

  getOpen(): boolean {
    return this.__open
  }

  toggleOpen(): void {
    const writable = this.getWritable()
    writable.__open = !writable.__open
  }
}

// ========== CollapsibleTitleNode ==========

export type SerializedCollapsibleTitleNode = Spread<
  { type: 'collapsible-title'; version: 1 },
  SerializedElementNode
>

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-title'
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key)
  }

  static importJSON(_serializedNode: SerializedCollapsibleTitleNode): CollapsibleTitleNode {
    return $createCollapsibleTitleNode()
  }

  exportJSON(): SerializedCollapsibleTitleNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-title',
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    const el = document.createElement('summary')
    el.classList.add('le-collapsible-title')
    return el
  }

  updateDOM(): boolean {
    return false
  }

  collapseAtStart(_selection: RangeSelection): boolean {
    return true
  }

  insertNewAfter(_selection: RangeSelection): ElementNode {
    const container = this.getParentOrThrow()
    if (!(container instanceof CollapsibleContainerNode)) {
      throw new Error('CollapsibleTitleNode must be a child of CollapsibleContainerNode')
    }
    const contentNode = container.getChildAtIndex(1)
    if (contentNode) {
      const paragraph = $createParagraphNode()
      contentNode.append(paragraph)
      paragraph.select()
      return paragraph
    }
    return this
  }
}

// ========== CollapsibleContentNode ==========

export type SerializedCollapsibleContentNode = Spread<
  { type: 'collapsible-content'; version: 1 },
  SerializedElementNode
>

export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return 'collapsible-content'
  }

  static clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key)
  }

  static importJSON(_serializedNode: SerializedCollapsibleContentNode): CollapsibleContentNode {
    return $createCollapsibleContentNode()
  }

  exportJSON(): SerializedCollapsibleContentNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-content',
      version: 1,
    }
  }

  createDOM(): HTMLElement {
    const el = document.createElement('div')
    el.classList.add('le-collapsible-content')
    return el
  }

  updateDOM(): boolean {
    return false
  }
}

// ========== Factory Functions ==========

export function $createCollapsibleContainerNode(open: boolean = true): CollapsibleContainerNode {
  return new CollapsibleContainerNode(open)
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode()
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return new CollapsibleContentNode()
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode
}

export function $isCollapsibleContentNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode
}
