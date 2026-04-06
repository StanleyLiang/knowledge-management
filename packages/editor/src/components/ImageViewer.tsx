import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react'

const ZOOM_STEP = 0.25
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

interface ImageViewerProps {
  src: string
  alt?: string
  onClose: () => void
}

export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const translateStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const fitToScreen = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + ZOOM_STEP, MAX_ZOOM))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - ZOOM_STEP, MIN_ZOOM))
  }, [])

  // Mouse wheel zoom (centered on cursor)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setScale((s) => Math.min(Math.max(s + delta, MIN_ZOOM), MAX_ZOOM))
  }, [])

  // Pan drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    translateStart.current = { ...translate }
  }, [translate])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setTranslate({
      x: translateStart.current.x + (e.clientX - dragStart.current.x),
      y: translateStart.current.y + (e.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch pinch-to-zoom
  const lastTouchDistance = useRef<number | null>(null)

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (lastTouchDistance.current !== null) {
        const delta = (distance - lastTouchDistance.current) * 0.005
        setScale((s) => Math.min(Math.max(s + delta, MIN_ZOOM), MAX_ZOOM))
      }
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1 && isDragging) {
      setTranslate({
        x: translateStart.current.x + (e.touches[0].clientX - dragStart.current.x),
        y: translateStart.current.y + (e.touches[0].clientY - dragStart.current.y),
      })
    }
  }, [isDragging])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      translateStart.current = { ...translate }
    }
    lastTouchDistance.current = null
  }, [translate])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    lastTouchDistance.current = null
  }, [])

  return createPortal(
    <div
      className="le-image-viewer-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Toolbar */}
      <div className="le-image-viewer-toolbar">
        <button className="le-image-viewer-btn" onClick={zoomOut} title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <span className="le-image-viewer-zoom">{Math.round(scale * 100)}%</span>
        <button className="le-image-viewer-btn" onClick={zoomIn} title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button className="le-image-viewer-btn" onClick={fitToScreen} title="Fit to Screen">
          <Maximize size={18} />
        </button>
        <button className="le-image-viewer-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="le-image-viewer-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <img
          src={src}
          alt={alt ?? ''}
          className="le-image-viewer-img"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>,
    document.body,
  )
}
