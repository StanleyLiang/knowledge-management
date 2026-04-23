'use client'

import { Viewer } from '@lexical-editor/editor'
import { Clock, History } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Page } from '@/lib/types'

function isValidEditorState(content: Record<string, unknown>): boolean {
  const root = content.root as Record<string, unknown> | undefined
  return !!root && root.type === 'root' && typeof root.version === 'number'
}

function prettyTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase()
}

interface StatusPillProps {
  status: 'published' | 'draft'
}

function StatusPill({ status }: StatusPillProps) {
  const isPublished = status === 'published'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium',
        isPublished ? 'bg-sage-soft text-sage-ink' : 'bg-paper-3 text-ink-2',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          isPublished ? 'bg-sage' : 'bg-ink-3',
        )}
      />
      {isPublished ? 'published' : 'draft'}
    </span>
  )
}

export function PageViewer({ page }: { page: Page }) {
  const isPublished = page.status === 'PUBLISHED'

  const displayContent = isPublished && page.publishedVersion
    ? page.publishedVersion.content
    : page.content

  const displayTitle = isPublished && page.publishedVersion
    ? page.publishedVersion.title
    : page.title

  const hasContent = displayContent && isValidEditorState(displayContent)
  const versionLabel = page.publishedVersion ? `v${page.publishedVersion.version}` : null

  return (
    <article className="max-w-[760px] mx-auto px-6 md:px-16 pt-10 md:pt-14 pb-24">
      <header className="pb-6 border-b border-border">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 flex-1 min-w-0">
            <StatusPill status={isPublished ? 'published' : 'draft'} />
          </div>
          <span className="mono text-[12px] uppercase tracking-wider text-ink-3 shrink-0">
            {shortId(page.id)}
          </span>
        </div>

        <h1 className="serif text-[40px] md:text-[54px] leading-[1.05] tracking-[-0.02em] font-normal text-foreground mb-5">
          {displayTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink-2">
          {page.author && (
            <span className="flex items-center gap-2">
              <Avatar className="h-[22px] w-[22px]">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(page.author)}&radius=50&backgroundColor=e8c4a0`}
                  alt={page.author}
                />
                <AvatarFallback className="text-[9px]">{getInitials(page.author)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{page.author}</span>
            </span>
          )}
          {page.author && <span className="text-ink-3">·</span>}

          <span className="flex items-center gap-1.5 text-ink-3">
            <Clock className="h-3.5 w-3.5" />
            updated {prettyTime(page.updatedAt)}
          </span>

          {versionLabel && (
            <>
              <span className="text-ink-3">·</span>
              <span className="flex items-center gap-1.5 text-ink-3">
                <History className="h-3.5 w-3.5" />
                {versionLabel}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="pt-8">
        {hasContent ? (
          <Viewer initialEditorState={JSON.stringify(displayContent)} />
        ) : (
          <div className="py-12 text-center text-ink-3">This page has no content yet.</div>
        )}
      </div>
    </article>
  )
}
