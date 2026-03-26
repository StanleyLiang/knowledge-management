import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical'
import { lazy, Suspense, useCallback, useState } from 'react'
import { MapPin } from 'lucide-react'
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

function LandmarkMapComponent({
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
  const [isEditing, setIsEditing] = useState(false)
  const [editJson, setEditJson] = useState('')

  const handleEdit = useCallback(() => {
    setEditJson(JSON.stringify(items, null, 2))
    setIsEditing(true)
  }, [items])

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(editJson) as LandmarkItem[]
      editor.update(() => {
        const node = editor._editorState._nodeMap.get(nodeKey)
        if (node instanceof LandmarkNode) {
          const writable = node.getWritable() as LandmarkNode
          writable.__items = parsed
        }
      })
      setIsEditing(false)
    } catch {
      // Invalid JSON - do nothing
    }
  }, [editor, nodeKey, editJson])

  if (isEditing && editable) {
    return (
      <div className="le-landmark le-landmark-editing" data-lexical-node-key={nodeKey}>
        <textarea
          value={editJson}
          onChange={(e) => setEditJson(e.target.value)}
          className="le-landmark-textarea"
          rows={8}
          spellCheck={false}
        />
        <div className="le-landmark-actions">
          <button onClick={handleSave} className="le-landmark-btn le-landmark-btn-primary">Save</button>
          <button onClick={() => setIsEditing(false)} className="le-landmark-btn">Cancel</button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className="le-landmark le-landmark-empty"
        data-lexical-node-key={nodeKey}
        onDoubleClick={() => editable && handleEdit()}
      >
        <MapPin size={24} />
        <span>No landmarks. {editable ? 'Double-click to add.' : ''}</span>
      </div>
    )
  }

  return (
    <div
      className="le-landmark"
      data-lexical-node-key={nodeKey}
      onDoubleClick={() => editable && handleEdit()}
    >
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
      <div className="le-landmark-list">
        {items.map((item) => (
          <span key={item.id} className="le-landmark-tag">
            <MapPin size={12} /> {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export class LandmarkNode extends DecoratorNode<JSX.Element> {
  __items: LandmarkItem[]

  static getType(): string {
    return 'landmark'
  }

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
    return {
      type: 'landmark',
      version: 1,
      items: this.__items,
    }
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div')
    div.className = 'le-landmark'
    const ul = document.createElement('ul')
    for (const item of this.__items) {
      const li = document.createElement('li')
      li.textContent = `${item.name} (${item.latitude}, ${item.longitude})`
      ul.appendChild(li)
    }
    div.appendChild(ul)
    return { element: div }
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  isInline(): false {
    return false
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return (
      <LandmarkMapComponent
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

export function $isLandmarkNode(
  node: LexicalNode | null | undefined,
): node is LandmarkNode {
  return node instanceof LandmarkNode
}
