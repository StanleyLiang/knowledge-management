'use client'

import { Viewer } from '@lexical-editor/editor'
import type { Page } from '@/lib/types'

function isValidEditorState(content: Record<string, unknown>): boolean {
  const root = content.root as Record<string, unknown> | undefined
  return !!root && root.type === 'root' && typeof root.version === 'number'
}

export function PageViewer({ page }: { page: Page }) {
  if (!page.content || !isValidEditorState(page.content)) {
    return <div className="p-8 text-muted-foreground text-center">This page has no content yet.</div>
  }

  return (
    <div className="border rounded-lg bg-white">
      <Viewer title={page.title} initialEditorState={JSON.stringify(page.content)} />
    </div>
  )
}
