import { type ReactNode } from 'react'

interface FloatingNodeToolbarProps {
  children: ReactNode
}

/**
 * A toolbar that floats above a selected node.
 * The parent must be position:relative to anchor it correctly.
 */
export function FloatingNodeToolbar({ children }: FloatingNodeToolbarProps) {
  return (
    <div
      className="le-node-toolbar"
      onMouseDown={(e) => {
        // Prevent blur on parent, but allow inputs to receive focus
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
        }
      }}
    >
      {children}
    </div>
  )
}
