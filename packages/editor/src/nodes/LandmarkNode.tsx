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
import { lazy, Suspense, useState } from 'react'
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
    name: string
    latitude: number
    longitude: number
  },
  SerializedLexicalNode
>

/* ── Map Modal (portrait) ── */
function LandmarkMapModal({
  name,
  latitude,
  longitude,
  onClose,
}: {
  name: string
  latitude: number
  longitude: number
  onClose: () => void
}) {
  return createPortal(
    <div className="le-landmark-modal-overlay" onClick={onClose}>
      <div className="le-landmark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="le-landmark-modal-header">
          <span className="le-landmark-modal-title">
            <MapPin size={16} /> {name}
          </span>
          <button onClick={onClose} className="le-landmark-modal-close">
            <X size={18} />
          </button>
        </div>
        <div className="le-landmark-modal-body">
          <Suspense fallback={<div className="le-landmark-loading">Loading map...</div>}>
            <ComposableMap
              projectionConfig={{ center: [longitude, latitude], scale: 800 }}
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
              <Marker coordinates={[longitude, latitude]}>
                <circle r={8} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />
                <text
                  textAnchor="middle"
                  y={-16}
                  style={{ fontSize: 12, fontWeight: 600, fill: '#1E293B' }}
                >
                  {name}
                </text>
              </Marker>
            </ComposableMap>
          </Suspense>
          <div className="le-landmark-modal-coords">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Inline Tag Component ── */
function LandmarkComponent({
  name,
  latitude,
  longitude,
  nodeKey,
}: {
  name: string
  latitude: number
  longitude: number
  nodeKey: NodeKey
  editable: boolean
  editor: LexicalEditor
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <span
        className="le-landmark-tag"
        data-lexical-node-key={nodeKey}
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
        title={`${name} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`}
      >
        <MapPin size={16} />
        <span>{name}</span>
      </span>
      {showModal && (
        <LandmarkMapModal
          name={name}
          latitude={latitude}
          longitude={longitude}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

/* ── Node Class ── */

export class LandmarkNode extends DecoratorNode<JSX.Element> {
  __name: string
  __latitude: number
  __longitude: number

  static getType(): string { return 'landmark' }

  static clone(node: LandmarkNode): LandmarkNode {
    return new LandmarkNode(node.__name, node.__latitude, node.__longitude, node.__key)
  }

  constructor(name: string, latitude: number, longitude: number, key?: NodeKey) {
    super(key)
    this.__name = name
    this.__latitude = latitude
    this.__longitude = longitude
  }

  static importJSON(serializedNode: SerializedLandmarkNode): LandmarkNode {
    return $createLandmarkNode(serializedNode.name, serializedNode.latitude, serializedNode.longitude)
  }

  exportJSON(): SerializedLandmarkNode {
    return {
      type: 'landmark',
      version: 1,
      name: this.__name,
      latitude: this.__latitude,
      longitude: this.__longitude,
    }
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span')
    span.className = 'le-landmark-tag'
    span.textContent = `📍 ${this.__name}`
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
        name={this.__name}
        latitude={this.__latitude}
        longitude={this.__longitude}
        nodeKey={this.__key}
        editable={editor._config.editable ?? true}
        editor={editor}
      />
    )
  }
}

export function $createLandmarkNode(
  name: string = 'Unknown',
  latitude: number = 0,
  longitude: number = 0,
): LandmarkNode {
  return new LandmarkNode(name, latitude, longitude)
}

export function $isLandmarkNode(node: LexicalNode | null | undefined): node is LandmarkNode {
  return node instanceof LandmarkNode
}
