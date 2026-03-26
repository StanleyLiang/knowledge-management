import type { HandlePosition } from '../../hooks/useResizable'

interface ResizeHandlesProps {
  onDragStart: (handle: HandlePosition) => (e: React.MouseEvent) => void
}

const HANDLES: { pos: HandlePosition; className: string; cursor: string }[] = [
  { pos: 'nw', className: 'le-resize-handle-nw', cursor: 'nwse-resize' },
  { pos: 'ne', className: 'le-resize-handle-ne', cursor: 'nesw-resize' },
  { pos: 'sw', className: 'le-resize-handle-sw', cursor: 'nesw-resize' },
  { pos: 'se', className: 'le-resize-handle-se', cursor: 'nwse-resize' },
]

export function ResizeHandles({ onDragStart }: ResizeHandlesProps) {
  return (
    <>
      {HANDLES.map(({ pos, className, cursor }) => (
        <div
          key={pos}
          className={`le-resize-handle ${className}`}
          style={{ cursor }}
          onMouseDown={onDragStart(pos)}
        />
      ))}
    </>
  )
}
