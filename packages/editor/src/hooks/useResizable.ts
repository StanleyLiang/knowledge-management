import { useCallback, useRef, useState, useEffect } from 'react'

interface UseResizableOptions {
  initialWidth: number
  initialHeight: number
  aspectRatio?: number // width / height, auto-calculated if not provided
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  onResize?: (width: number, height: number) => void
}

export function useResizable({
  initialWidth,
  initialHeight,
  aspectRatio: externalAspectRatio,
  minWidth = 50,
  minHeight = 50,
  maxWidth = Infinity,
  onResize,
}: UseResizableOptions) {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight })
  const aspectRatio = externalAspectRatio ?? initialWidth / initialHeight
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })

  // Sync with external changes
  useEffect(() => {
    setSize({ width: initialWidth, height: initialHeight })
  }, [initialWidth, initialHeight])

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      isDragging.current = true
      startPos.current = { x: e.clientX, y: e.clientY }
      startSize.current = { ...size }

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return

        const deltaX = moveEvent.clientX - startPos.current.x
        let newWidth = Math.max(minWidth, startSize.current.width + deltaX)
        newWidth = Math.min(newWidth, maxWidth)
        const newHeight = Math.max(minHeight, newWidth / aspectRatio)

        setSize({ width: newWidth, height: newHeight })
        onResize?.(newWidth, newHeight)
      }

      const onMouseUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [size, aspectRatio, minWidth, minHeight, maxWidth, onResize],
  )

  const setWidth = useCallback(
    (width: number) => {
      const w = Math.max(minWidth, Math.min(width, maxWidth))
      const h = Math.max(minHeight, w / aspectRatio)
      setSize({ width: w, height: h })
      onResize?.(w, h)
    },
    [aspectRatio, minWidth, minHeight, maxWidth, onResize],
  )

  const setHeight = useCallback(
    (height: number) => {
      const h = Math.max(minHeight, height)
      const w = Math.max(minWidth, Math.min(h * aspectRatio, maxWidth))
      setSize({ width: w, height: h })
      onResize?.(w, h)
    },
    [aspectRatio, minWidth, minHeight, maxWidth, onResize],
  )

  return { size, onDragStart, setWidth, setHeight }
}
