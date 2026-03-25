import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
  size?: 'default' | 'sm' | 'icon'
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={pressed}
        data-state={pressed ? 'on' : 'off'}
        className={cn(
          'le-toggle',
          pressed && 'le-toggle-active',
          size === 'sm' && 'le-btn-sm',
          size === 'icon' && 'le-btn-icon',
          className,
        )}
        {...props}
      />
    )
  },
)
Toggle.displayName = 'Toggle'
