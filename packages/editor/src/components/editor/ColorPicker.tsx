import { useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, $isTextNode } from 'lexical'
import { Palette, Highlighter } from 'lucide-react'
import { Button } from '../ui/button'
import { Dropdown } from '../ui/dropdown'

const PRESET_COLORS = [
  // Row 1: grays
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  // Row 2: colors
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  // Row 3: lighter
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  // Row 4: light
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  // Row 5: medium
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
]

function ColorGrid({
  onSelect,
  onReset,
  resetLabel,
}: {
  onSelect: (color: string) => void
  onReset: () => void
  resetLabel: string
}) {
  return (
    <div className="le-color-picker">
      <button onClick={onReset} className="le-color-picker-reset">
        {resetLabel}
      </button>
      <div className="le-color-picker-grid">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className="le-color-picker-swatch"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

export function TextColorPicker() {
  const [editor] = useLexicalComposerContext()

  const applyColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const nodes = selection.getNodes()
      for (const node of nodes) {
        if ($isTextNode(node)) {
          const currentStyle = node.getStyle()
          const newStyle = color
            ? updateStyle(currentStyle, 'color', color)
            : removeStyle(currentStyle, 'color')
          node.setStyle(newStyle)
        }
      }
    })
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon">
          <Palette size={16} />
        </Button>
      }
    >
      <ColorGrid
        onSelect={applyColor}
        onReset={() => applyColor(null)}
        resetLabel="Reset text color"
      />
    </Dropdown>
  )
}

export function TextBgColorPicker() {
  const [editor] = useLexicalComposerContext()

  const applyBgColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const nodes = selection.getNodes()
      for (const node of nodes) {
        if ($isTextNode(node)) {
          const currentStyle = node.getStyle()
          const newStyle = color
            ? updateStyle(currentStyle, 'background-color', color)
            : removeStyle(currentStyle, 'background-color')
          node.setStyle(newStyle)
        }
      }
    })
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon">
          <Highlighter size={16} />
        </Button>
      }
    >
      <ColorGrid
        onSelect={applyBgColor}
        onReset={() => applyBgColor(null)}
        resetLabel="Reset background color"
      />
    </Dropdown>
  )
}

function updateStyle(existingStyle: string, property: string, value: string): string {
  const styles = parseStyle(existingStyle)
  styles[property] = value
  return serializeStyle(styles)
}

function removeStyle(existingStyle: string, property: string): string {
  const styles = parseStyle(existingStyle)
  delete styles[property]
  return serializeStyle(styles)
}

function parseStyle(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {}
  if (!styleStr) return styles
  for (const part of styleStr.split(';')) {
    const [key, val] = part.split(':').map((s) => s.trim())
    if (key && val) styles[key] = val
  }
  return styles
}

function serializeStyle(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}
