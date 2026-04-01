'use client'

import { Viewer } from '@lexical-editor/editor'
import type { PageVersion } from '@/lib/types'

export function VersionViewer({ version }: { version: PageVersion }) {
  return (
    <div className="border rounded-lg bg-white">
      <Viewer title={version.title} initialEditorState={JSON.stringify(version.content)} />
    </div>
  )
}
