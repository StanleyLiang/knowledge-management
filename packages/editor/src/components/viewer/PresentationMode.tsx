import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Pointer,
  Columns2,
  ScrollText,
} from 'lucide-react'
import type { SerializedEditorState, EditorThemeClasses } from 'lexical'
import { defaultTheme } from '../../themes/defaultTheme'
import { DividerNode } from '../../nodes/DividerNode'
import { BookmarkNode } from '../../nodes/BookmarkNode'
import { ImageNode } from '../../nodes/ImageNode'
import { VideoNode } from '../../nodes/VideoNode'
import { AttachmentNode } from '../../nodes/AttachmentNode'
import { CodeSnippetNode } from '../../nodes/CodeSnippetNode'
import { MentionNode } from '../../nodes/MentionNode'
import { MermaidNode } from '../../nodes/MermaidNode'
import { LandmarkNode } from '../../nodes/LandmarkNode'
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
} from '../../nodes/CollapsibleNodes'
import { extractSlides, buildSlideState } from '../../utils/slideExtractor'

const PRESENTATION_NODES = [
  HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode,
  DividerNode, BookmarkNode, ImageNode, VideoNode, AttachmentNode, CodeSnippetNode,
  CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode,
  TableNode, TableCellNode, TableRowNode, MentionNode, MermaidNode, LandmarkNode,
]

type PresentationView = 'slide' | 'scroll'

interface PresentationModeProps {
  initialEditorState: SerializedEditorState | string
  onClose: () => void
  theme?: Partial<EditorThemeClasses>
}

function SlideRenderer({
  editorState,
  theme,
}: {
  editorState: SerializedEditorState
  theme?: Partial<EditorThemeClasses>
}) {
  const config = useMemo(() => ({
    namespace: 'PresentationSlide',
    theme: { ...defaultTheme, ...theme },
    nodes: PRESENTATION_NODES,
    editable: false,
    onError: (error: Error) => console.error('[Presentation]', error),
    editorState: JSON.stringify(editorState),
  }), [editorState, theme])

  return (
    <LexicalComposer initialConfig={config}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="le-editor-content" />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <TablePlugin />
    </LexicalComposer>
  )
}

export function PresentationMode({ initialEditorState, onClose, theme }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [view, setView] = useState<PresentationView>('slide')
  const [laserOn, setLaserOn] = useState(false)
  const [laserPos, setLaserPos] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const slides = useMemo(
    () => extractSlides(initialEditorState),
    [initialEditorState],
  )

  const fullState = useMemo<SerializedEditorState>(
    () => typeof initialEditorState === 'string'
      ? JSON.parse(initialEditorState)
      : initialEditorState,
    [initialEditorState],
  )

  const next = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [next, prev, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Laser pointer tracking
  useEffect(() => {
    if (!laserOn) return
    const handleMove = (e: MouseEvent) => {
      setLaserPos({ x: e.clientX, y: e.clientY })
    }
    document.addEventListener('mousemove', handleMove)
    return () => document.removeEventListener('mousemove', handleMove)
  }, [laserOn])

  if (slides.length === 0) return null

  return (
    <div
      ref={overlayRef}
      className={`le-presentation-overlay ${laserOn ? 'le-presentation-laser-active' : ''}`}
    >
      {/* Controls bar */}
      <div className="le-presentation-controls">
        {view === 'slide' && (
          <span className="le-presentation-counter">
            {currentSlide + 1} / {slides.length}
          </span>
        )}

        <button
          onClick={() => setView(view === 'slide' ? 'scroll' : 'slide')}
          className="le-presentation-control-btn"
          title={view === 'slide' ? 'Switch to Scroll mode' : 'Switch to Slide mode'}
        >
          {view === 'slide' ? <ScrollText size={18} /> : <Columns2 size={18} />}
        </button>

        <button
          onClick={() => setLaserOn((v) => !v)}
          className={`le-presentation-control-btn ${laserOn ? 'le-presentation-control-btn-active' : ''}`}
          title="Laser Pointer"
        >
          <Pointer size={18} />
        </button>

        <button onClick={onClose} className="le-presentation-control-btn" title="Close">
          <X size={20} />
        </button>
      </div>

      {/* Slide mode */}
      {view === 'slide' && (
        <>
          <div className="le-presentation-slide">
            <SlideRenderer
              key={currentSlide}
              editorState={buildSlideState(slides[currentSlide].nodes)}
              theme={theme}
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
        </>
      )}

      {/* Scroll mode */}
      {view === 'scroll' && (
        <div className="le-presentation-scroll">
          <div className="le-presentation-scroll-content">
            <SlideRenderer editorState={fullState} theme={theme} />
          </div>
        </div>
      )}

      {/* Laser pointer dot */}
      {laserOn && (
        <div
          className="le-presentation-laser-dot"
          style={{ left: laserPos.x, top: laserPos.y }}
        />
      )}
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
