declare module 'react-simple-maps' {
  import { ComponentType, ReactNode } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: React.CSSProperties
    children?: ReactNode
    [key: string]: unknown
  }

  export interface GeographiesProps {
    geography: string
    children: (data: { geographies: Array<{ rsmKey: string; properties: Record<string, unknown> }> }) => ReactNode
    [key: string]: unknown
  }

  export interface GeographyProps {
    geography: Record<string, unknown>
    key?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    style?: Record<string, unknown>
    [key: string]: unknown
  }

  export interface MarkerProps {
    coordinates: number[]
    children?: ReactNode
    [key: string]: unknown
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const Marker: ComponentType<MarkerProps>
}
