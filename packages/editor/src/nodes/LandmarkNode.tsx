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
import { lazy, Suspense, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X } from 'lucide-react'
import { type JSX } from 'react'
import type { LandmarkItem } from '../types'

const ComposableMap = lazy(() =>
  import('react-simple-maps').then((m) => ({ default: m.ComposableMap })),
)
const Geographies = lazy(() =>
  import('react-simple-maps').then((m) => ({ default: m.Geographies })),
)
const Geography = lazy(() =>
  import('react-simple-maps').then((m) => ({ default: m.Geography })),
)
const Marker = lazy(() =>
  import('react-simple-maps').then((m) => ({ default: m.Marker })),
)

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export type SerializedLandmarkNode = Spread<
  {
    type: 'landmark'
    version: 1
    items: LandmarkItem[]
  },
  SerializedLexicalNode
>

/* ── Map Modal (portrait) ── */
function LandmarkMapModal({
  items,
  onClose,
}: {
  items: LandmarkItem[]
  onClose: () => void
}) {
  return createPortal(
    <div className="le-landmark-modal-overlay" onClick={onClose}>
      <div
        className="le-landmark-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="le-landmark-modal-header">
          <span className="le-landmark-modal-title">
            <MapPin size={16} /> Landmarks ({items.length})
          </span>
          <button onClick={onClose} className="le-landmark-modal-close">
            <X size={18} />
          </button>
        </div>
        <div className="le-landmark-modal-body">
          <Suspense fallback={<div className="le-landmark-loading">Loading map...</div>}>
            <ComposableMap
              projectionConfig={{ scale: 147 }}
              style={{ width: '100%', height: 'auto' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#E2E8F0"
                      stroke="#CBD5E1"
                      strokeWidth={0.5}
                    />
                  ))
                }
              </Geographies>
              {items.map((item) => (
                <Marker key={item.id} coordinates={[item.longitude, item.latitude]}>
                  <circle r={6} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
                  <text
                    textAnchor="middle"
                    y={-12}
                    style={{ fontSize: 10, fontWeight: 600, fill: '#1E293B' }}
                  >
                    {item.name}
                  </text>
                </Marker>
              ))}
            </ComposableMap>
          </Suspense>
          <div className="le-landmark-modal-list">
            {items.map((item) => (
              <div key={item.id} className="le-landmark-modal-item">
                <MapPin size={14} className="text-red-500" />
                <div>
                  <div className="le-landmark-modal-item-name">{item.name}</div>
                  <div className="le-landmark-modal-item-coords">
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Inline Tag Component ── */
function LandmarkComponent({
  items,
  nodeKey,
  editable,
  editor,
}: {
  items: LandmarkItem[]
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [showModal, setShowModal] = useState(false)

  if (items.length === 0) {
    return (
      <span className="le-landmark-tag le-landmark-tag-empty" data-lexical-node-key={nodeKey}>
        <MapPin size={12} /> No landmarks
      </span>
    )
  }

  // Show first item name + count
  const label = items.length === 1
    ? items[0].name
    : `${items[0].name} +${items.length - 1}`

  return (
    <>
      <span
        className="le-landmark-tag le-landmark-tag-clickable"
        data-lexical-node-key={nodeKey}
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
        title={items.map((i) => i.name).join(', ')}
      >
        <MapPin size={12} />
        <span>{label}</span>
      </span>
      {showModal && (
        <LandmarkMapModal items={items} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

/* ── Node Class ── */

export class LandmarkNode extends DecoratorNode<JSX.Element> {
  __items: LandmarkItem[]

  static getType(): string { return 'landmark' }

  static clone(node: LandmarkNode): LandmarkNode {
    return new LandmarkNode(node.__items, node.__key)
  }

  constructor(items: LandmarkItem[], key?: NodeKey) {
    super(key)
    this.__items = items
  }

  static importJSON(serializedNode: SerializedLandmarkNode): LandmarkNode {
    return $createLandmarkNode(serializedNode.items)
  }

  exportJSON(): SerializedLandmarkNode {
    return { type: 'landmark', version: 1, items: this.__items }
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span')
    span.className = 'le-landmark-tag'
    span.textContent = this.__items.map((i) => i.name).join(', ')
    return { element: span }
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.style.display = 'inline-block'
    return span
  }

  updateDOM(): false { return false }
  isInline(): true { return true }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <LandmarkComponent
        items={this.__items}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createLandmarkNode(items: LandmarkItem[] = []): LandmarkNode {
  return new LandmarkNode(items)
}

export function $isLandmarkNode(node: LexicalNode | null | undefined): node is LandmarkNode {
  return node instanceof LandmarkNode
}
