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
import { lazy, Suspense, useState, type JSX } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X } from 'lucide-react'
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

// Taiwan counties TopoJSON (taiwan-atlas, 144KB)
const TAIWAN_COUNTIES_URL = 'https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json'

/** Check if coordinates fall within Taiwan's bounding box */
function isInTaiwan(lat: number, lng: number): boolean {
  return lat >= 21.8 && lat <= 25.4 && lng >= 119.3 && lng <= 122.1
}

// Country boundaries (50m resolution)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
// Admin-1 states/provinces boundaries (50m, Natural Earth — 2.3MB, lazy loaded)
const ADMIN1_GEO_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson'

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

/* ── Taiwan Map (react-simple-maps + taiwan-atlas) ── */
function TaiwanMapView({
  name,
  latitude,
  longitude,
}: {
  name: string
  latitude: number
  longitude: number
}) {
  const [hoveredCounty, setHoveredCounty] = useState<string>('')

  return (
    <Suspense fallback={<div className="le-landmark-loading">Loading Taiwan map...</div>}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [121, 23.5], scale: 6000 }}
        style={{ width: '100%', height: 'auto', background: '#EFF6FF' }}
      >
        <Geographies geography={TAIWAN_COUNTIES_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { COUNTYNAME?: string } }> }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={hoveredCounty === geo.rsmKey ? '#BFDBFE' : '#E8F0FE'}
                stroke="#93C5FD"
                strokeWidth={0.5}
                onMouseEnter={() => setHoveredCounty(geo.rsmKey)}
                onMouseLeave={() => setHoveredCounty('')}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#BFDBFE', outline: 'none', cursor: 'pointer' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        <Marker coordinates={[longitude, latitude]}>
          <circle r={16} fill="#3B82F6" fillOpacity={0.15} />
          <circle r={6} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />
          <text
            textAnchor="middle"
            y={-14}
            style={{ fontSize: 9, fontWeight: 700, fill: '#1E40AF' }}
          >
            {name}
          </text>
        </Marker>
      </ComposableMap>
    </Suspense>
  )
}

/* ── World Map (react-simple-maps) ── */
function WorldMapView({
  name,
  latitude,
  longitude,
}: {
  name: string
  latitude: number
  longitude: number
}) {
  return (
    <Suspense fallback={<div className="le-landmark-loading">Loading map...</div>}>
      <ComposableMap
        projectionConfig={{ center: [longitude, latitude], scale: 4000 }}
        style={{ width: '100%', height: 'auto', background: '#EFF6FF' }}
      >
        <defs>
          <linearGradient id="land-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <filter id="land-shadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#94A3B8" floodOpacity="0.25" />
          </filter>
          <radialGradient id="marker-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="url(#land-gradient)"
                stroke="#CBD5E1"
                strokeWidth={0.3}
                style={{
                  default: { filter: 'url(#land-shadow)' },
                  hover: { fill: '#DBEAFE' },
                  pressed: { fill: '#BFDBFE' },
                }}
              />
            ))
          }
        </Geographies>
        <Geographies geography={ADMIN1_GEO_URL}>
          {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="transparent"
                stroke="#93C5FD"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#DBEAFE', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
        <Marker coordinates={[longitude, latitude]}>
          <circle r={24} fill="url(#marker-glow)" />
          <circle r={10} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={3} />
          <circle r={3} fill="#FFFFFF" />
          <text
            textAnchor="middle"
            y={-20}
            style={{ fontSize: 13, fontWeight: 700, fill: '#1E40AF' }}
          >
            {name}
          </text>
        </Marker>
      </ComposableMap>
    </Suspense>
  )
}

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
  const taiwan = isInTaiwan(latitude, longitude)

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
          {taiwan ? (
            <TaiwanMapView name={name} latitude={latitude} longitude={longitude} />
          ) : (
            <WorldMapView name={name} latitude={latitude} longitude={longitude} />
          )}
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
