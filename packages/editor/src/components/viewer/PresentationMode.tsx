import { useState, useCallback, useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from 'lucide-react'

interface Slide {
  title: string
  contentHtml: string
}

interface PresentationModeProps {
  slides: Slide[]
  onClose: () => void
}

export function PresentationMode({ slides, onClose }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const next = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [next, prev, onClose])

  if (slides.length === 0) return null

  const slide = slides[currentSlide]

  return (
    <div className="le-presentation-overlay">
      <div className="le-presentation-controls">
        <span className="le-presentation-counter">
          {currentSlide + 1} / {slides.length}
        </span>
        <button onClick={onClose} className="le-presentation-close">
          <X size={20} />
        </button>
      </div>

      <div className="le-presentation-slide">
        <h1 className="le-presentation-title">{slide.title}</h1>
        <div
          className="le-presentation-content"
          dangerouslySetInnerHTML={{ __html: slide.contentHtml }}
        />
      </div>

      <div className="le-presentation-nav">
        <button
          onClick={prev}
          disabled={currentSlide === 0}
          className="le-presentation-nav-btn"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={next}
          disabled={currentSlide === slides.length - 1}
          className="le-presentation-nav-btn"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  )
}

export function PresentationButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="le-presentation-trigger">
      <Maximize2 size={16} />
      <span>Presentation</span>
    </button>
  )
}
