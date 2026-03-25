import { useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="le-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={cn('le-tooltip', className)}>
          {content}
        </div>
      )}
    </div>
  )
}
