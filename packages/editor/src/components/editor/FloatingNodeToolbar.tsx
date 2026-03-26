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
    <div className="le-node-toolbar">
      {children}
    </div>
  )
}
