'use client'

import { Viewer } from '@lexical-editor/editor'
import { Badge } from '@/components/ui/badge'
import type { Page } from '@/lib/types'

function isValidEditorState(content: Record<string, unknown>): boolean {
  const root = content.root as Record<string, unknown> | undefined
  return !!root && root.type === 'root' && typeof root.version === 'number'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PageViewer({ page }: { page: Page }) {
  const isPublished = page.status === 'PUBLISHED'

  const displayContent = isPublished && page.publishedVersion
    ? page.publishedVersion.content
    : page.content

  const displayTitle = isPublished && page.publishedVersion
    ? page.publishedVersion.title
    : page.title

  const publishedDate = page.publishedVersion?.createdAt
  const hasContent = displayContent && isValidEditorState(displayContent)

  return (
    <div>
      <div className="border rounded-lg bg-white">
        {/* Title */}
        <h1 className="text-4xl font-bold leading-tight px-4 pt-4 pb-2">
          {displayTitle}
        </h1>

        {/* Author + metadata row */}
        <div className="flex items-center gap-3 px-4 pb-4 border-b">
          {page.author && (
            <div className="flex items-center gap-2">
              <img
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(page.author)}&radius=50&backgroundColor=c0aede`}
                alt={page.author}
                className="h-7 w-7 rounded-full"
              />
              <span className="text-sm font-medium">{page.author}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isPublished && page.publishedVersion ? (
              <>
                <Badge>Published</Badge>
                <span className="text-xs text-muted-foreground">v{page.publishedVersion.version}</span>
              </>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>
          {publishedDate && (
            <span className="text-xs text-muted-foreground">
              Published {formatDate(publishedDate)}
            </span>
          )}
        </div>

        {/* Content */}
        {hasContent ? (
          <Viewer initialEditorState={JSON.stringify(displayContent)} />
        ) : (
          <div className="p-8 text-muted-foreground text-center">This page has no content yet.</div>
        )}
      </div>
    </div>
  )
}
