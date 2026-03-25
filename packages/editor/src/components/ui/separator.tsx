import { cn } from '../../utils/cn'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Separator({ orientation = 'vertical', className }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === 'vertical' ? 'le-separator-v' : 'le-separator-h',
        className,
      )}
    />
  )
}
