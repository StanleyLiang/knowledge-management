import type { MouseEvent } from 'react'

interface ResizeHandlesProps {
  onDragStart: (e: MouseEvent) => void
}

const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

export function ResizeHandles({ onDragStart }: ResizeHandlesProps) {
  return (
    <>
      {CORNERS.map((corner) => (
        <div
          key={corner}
          className={`le-resize-handle le-resize-handle-${corner}`}
          onMouseDown={onDragStart}
        />
      ))}
    </>
  )
}
