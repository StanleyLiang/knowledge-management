import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'le-btn',
          variant === 'ghost' && 'le-btn-ghost',
          variant === 'outline' && 'le-btn-outline',
          size === 'sm' && 'le-btn-sm',
          size === 'icon' && 'le-btn-icon',
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
