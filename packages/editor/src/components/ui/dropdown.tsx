import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

const DropdownContext = createContext<{ close: () => void }>({ close: () => {} })

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function Dropdown({ trigger, children, className, align = 'start' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={ref} className="le-dropdown-wrapper">
        <div onClick={() => setOpen(!open)}>{trigger}</div>
        {open && (
          <div
            className={cn(
              'le-dropdown-content',
              align === 'end' && 'le-dropdown-end',
              className,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
}

export function DropdownItem({ children, onClick, active, className }: DropdownItemProps) {
  const { close } = useContext(DropdownContext)

  return (
    <button
      className={cn('le-dropdown-item', active && 'le-dropdown-item-active', className)}
      onClick={() => {
        onClick?.()
        close()
      }}
    >
      {children}
    </button>
  )
}
