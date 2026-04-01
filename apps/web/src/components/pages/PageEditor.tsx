'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@lexical-editor/editor'
import type { SerializedEditorState } from 'lexical'
import { api } from '@/lib/api'
import type { Page } from '@/lib/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function PageEditor({ pageId }: { pageId: string }) {
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<SerializedEditorState | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const pendingRef = useRef<{ title?: string; content?: Record<string, unknown> }>({})

  useEffect(() => {
    api.pages.get(pageId).then((p) => {
      setPage(p)
      setTitle(p.title)
      setLoading(false)
    })
  }, [pageId])

  const save = useCallback(async () => {
    const data = { ...pendingRef.current }
    pendingRef.current = {}
    if (!data.title && !data.content) return
    setStatus('saving')
    try {
      await api.pages.update(pageId, data)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [pageId])

  const scheduleSave = useCallback(
    (updates: { title?: string; content?: Record<string, unknown> }) => {
      pendingRef.current = { ...pendingRef.current, ...updates }
      setStatus('idle')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(save, 2000)
    },
    [save],
  )

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    scheduleSave({ title: newTitle })
  }

  function handleContentChange(editorState: SerializedEditorState) {
    setContent(editorState)
    scheduleSave({ content: editorState as unknown as Record<string, unknown> })
  }

  if (loading || !page) {
    return <div className="animate-pulse p-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-2 px-1">
        <span className="text-xs text-muted-foreground">
          {status === 'saving' && 'Saving...'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && 'Error saving'}
          {status === 'idle' && content && 'Unsaved changes'}
        </span>
      </div>
      <div className="border rounded-lg bg-white">
        <Editor
          title={title}
          onTitleChange={handleTitleChange}
          titlePlaceholder="Untitled"
          initialEditorState={page.content && (page.content.root as Record<string, unknown>)?.version ? JSON.stringify(page.content) : undefined}
          onChange={handleContentChange}
          placeholder="Start writing..."
        />
      </div>
    </div>
  )
}
