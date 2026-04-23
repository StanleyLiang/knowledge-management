import type { SVGProps } from 'react'

interface KeeptioMarkProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number
  rounded?: boolean
  onInk?: boolean
}

export function KeeptioMark({
  size = 28,
  rounded = true,
  onInk = false,
  ...rest
}: KeeptioMarkProps) {
  const tileFill = onInk ? 'oklch(0.22 0.020 60)' : 'var(--color-terracotta, oklch(0.66 0.14 40))'
  const stemColor = onInk ? 'var(--color-terracotta, oklch(0.66 0.14 40))' : 'oklch(0.95 0.045 85)'
  const linkUp = onInk ? 'oklch(0.74 0.10 75)' : 'oklch(0.52 0.09 70)'
  const linkDn = onInk ? 'oklch(0.52 0.09 70)' : 'oklch(0.74 0.10 75)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {rounded ? (
        <rect x="0" y="0" width="120" height="120" rx="28" fill={tileFill} />
      ) : (
        <circle cx="60" cy="60" r="60" fill={tileFill} />
      )}
      <path
        d="M 40 26 L 40 94"
        stroke={stemColor}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="translate(60 46) rotate(-28)">
          <rect x="-18" y="-9" width="36" height="18" rx="9" stroke={linkUp} strokeWidth="6" />
        </g>
        <g transform="translate(60 74) rotate(28)">
          <rect x="-18" y="-9" width="36" height="18" rx="9" stroke={linkDn} strokeWidth="6" />
        </g>
        <path d="M 58 58 Q 63 60, 66 64" stroke={linkUp} strokeWidth="6" />
      </g>
      <path
        d="M 40 40 L 40 80"
        stroke={stemColor}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function KeeptioMarkMicro({
  size = 16,
  ...rest
}: Omit<KeeptioMarkProps, 'rounded' | 'onInk'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <rect
        x="0"
        y="0"
        width="120"
        height="120"
        rx="22"
        fill="var(--color-terracotta, oklch(0.66 0.14 40))"
      />
      <path
        d="M 40 22 L 40 98"
        stroke="oklch(0.95 0.045 85)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="none" strokeLinecap="round">
        <g transform="translate(60 46) rotate(-28)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="10"
            stroke="oklch(0.52 0.09 70)"
            strokeWidth="8"
          />
        </g>
        <g transform="translate(60 74) rotate(28)">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="10"
            stroke="oklch(0.74 0.10 75)"
            strokeWidth="8"
          />
        </g>
      </g>
      <path
        d="M 40 36 L 40 84"
        stroke="oklch(0.95 0.045 85)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
