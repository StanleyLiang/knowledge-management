'use client'

import { Viewer } from '@lexical-editor/editor'
import { Badge } from '@/components/ui/badge'
import type { Page } from '@/lib/types'

function isValidEditorState(content: Record<string, unknown>): boolean {
  const root = content.root as Record<string, unknown> | undefined
  return !!root && root.type === 'root' && typeof root.version === 'number'
}

export function PageViewer({ page }: { page: Page }) {
  const isPublished = page.status === 'PUBLISHED'

  // Show published version content when available, otherwise draft
  const displayContent = isPublished && page.publishedVersion
    ? page.publishedVersion.content
    : page.content

  const displayTitle = isPublished && page.publishedVersion
    ? page.publishedVersion.title
    : page.title

  if (!displayContent || !isValidEditorState(displayContent)) {
    return <div className="p-8 text-muted-foreground text-center">This page has no content yet.</div>
  }

  return (
    <div>
      {isPublished && page.publishedVersion && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <Badge>Published</Badge>
          <span className="text-xs text-muted-foreground">v{page.publishedVersion.version}</span>
        </div>
      )}
      <div className="border rounded-lg bg-white">
        <Viewer title={displayTitle} initialEditorState={JSON.stringify(displayContent)} />
      </div>
    </div>
  )
}
