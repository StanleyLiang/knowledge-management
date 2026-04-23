'use client'

import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TocEntry {
  id: string
  text: string
  depth: number
}

interface LandmarkEntry {
  id: string
  name: string
}

interface LexicalNode {
  type?: string
  tag?: string
  text?: string
  name?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

function extractText(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

function slugify(text: string, fallback: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function walk(
  content: Record<string, unknown> | null | undefined,
  visit: (node: LexicalNode) => void,
) {
  if (!content) return
  const root = (content as { root?: LexicalNode }).root
  if (!root) return
  const stack: LexicalNode[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    visit(node)
    if (Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i])
      }
    }
  }
}

function buildToc(content: Record<string, unknown> | null | undefined): TocEntry[] {
  const entries: TocEntry[] = []
  walk(content, (node) => {
    if (node.type === 'heading' && typeof node.tag === 'string') {
      const text = extractText(node).trim()
      if (!text) return
      const depth = Number(node.tag.replace(/\D/g, '')) || 2
      const id = slugify(text, `h-${entries.length}`)
      entries.push({ id, text, depth })
    }
  })
  return entries
}

function buildLandmarks(content: Record<string, unknown> | null | undefined): LandmarkEntry[] {
  const landmarks: LandmarkEntry[] = []
  walk(content, (node) => {
    if (node.type === 'landmark') {
      const name = (typeof node.name === 'string' && node.name) || extractText(node).trim()
      if (!name) return
      landmarks.push({ id: `lm-${landmarks.length}`, name })
    }
  })
  return landmarks
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-3 font-semibold">
      {children}
    </div>
  )
}

export function RightRail({ content }: { content: Record<string, unknown> | null | undefined }) {
  const toc = useMemo(() => buildToc(content), [content])
  const landmarks = useMemo(() => buildLandmarks(content), [content])

  return (
    <aside className="w-[280px] shrink-0 border-l border-border bg-[oklch(0.975_0.014_78)] px-[18px] py-6 overflow-y-auto flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <SectionLabel>On this page</SectionLabel>
        {toc.length === 0 ? (
          <p className="text-[12px] text-ink-3">No headings yet.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {toc.map((entry) => (
              <li key={`${entry.id}-${entry.text}`}>
                <a
                  href={`#${entry.id}`}
                  className={cn(
                    'block text-[13px] py-1 leading-snug text-ink-3 hover:text-foreground',
                  )}
                  style={{ paddingLeft: (entry.depth - 2) * 12 + 2 }}
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionLabel>Activity</SectionLabel>
        <p className="text-[12px] text-ink-3">
          No mentions, comments, or publishes to show yet.
        </p>
      </section>

      {landmarks.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel>Landmarks</SectionLabel>
          <ul className="flex flex-col gap-1">
            {landmarks.map((lm, idx) => (
              <li
                key={lm.id}
                className="flex items-center gap-2 text-[12.5px] text-ink-2"
              >
                <span className="mono text-[11px] text-ink-3 w-5 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0" />
                <span className="truncate">{lm.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
