import { cn } from '@/lib/utils'
import type { SpaceType } from '@/lib/types'

const HUE_BY_TYPE: Record<SpaceType | 'DEFAULT', number> = {
  PERSONAL: 40,
  TEAM: 150,
  OFFICIAL: 60,
  DEFAULT: 330,
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4 text-[9px]',
  md: 'h-6 w-6 text-[11px]',
  lg: 'h-7 w-7 text-[12px]',
}

interface SpaceGlyphProps {
  name: string
  type?: SpaceType
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

export function SpaceGlyph({ name, type, size = 'md', className }: SpaceGlyphProps) {
  const hue = type ? HUE_BY_TYPE[type] : HUE_BY_TYPE.DEFAULT
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const gradient = `radial-gradient(circle at 30% 30%, oklch(0.88 0.06 ${hue}), oklch(0.58 0.14 ${hue}))`

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white shadow-xs',
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundImage: gradient }}
    >
      {initial}
    </span>
  )
}
