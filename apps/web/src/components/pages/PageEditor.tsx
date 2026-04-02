'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@lexical-editor/editor'
import type { SerializedEditorState } from 'lexical'
import type { MediaUploadResult, MediaType, MediaStatus } from '@lexical-editor/editor'
import { Globe, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Page } from '@/lib/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function PageEditor({ pageId }: { pageId: string }) {
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<SerializedEditorState | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [publishing, setPublishing] = useState(false)
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

  const handleUpload = useCallback(
    async (
      file: File,
      type: MediaType,
      onStatusChange: (status: MediaStatus) => void,
    ): Promise<MediaUploadResult> => {
      if (type === 'video') {
        onStatusChange('uploading')
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }

        const { jobId, hlsUrl } = await res.json()
        return { url: hlsUrl, format: 'hls', jobId }
      }

      if (type === 'image') {
        onStatusChange('uploading')
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }

        const { src } = await res.json()
        return { url: src }
      }

      // attachment: convert to data URL fallback
      return new Promise<MediaUploadResult>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve({ url: reader.result as string })
        }
        reader.readAsDataURL(file)
      })
    },
    [],
  )

  async function handlePublish() {
    // Flush any pending save first
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      await save()
    }
    setPublishing(true)
    try {
      const updated = await api.pages.publish(pageId)
      setPage(updated)
    } finally {
      setPublishing(false)
    }
  }

  async function handleUnpublish() {
    setPublishing(true)
    try {
      const updated = await api.pages.unpublish(pageId)
      setPage({ ...updated, publishedVersion: null })
    } finally {
      setPublishing(false)
    }
  }

  if (loading || !page) {
    return <div className="animate-pulse p-8 text-muted-foreground">Loading...</div>
  }

  const isPublished = page.status === 'PUBLISHED'

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          {isPublished && page.publishedVersion && (
            <span className="text-xs text-muted-foreground">
              v{page.publishedVersion.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {status === 'saving' && 'Saving...'}
            {status === 'saved' && 'Saved'}
            {status === 'error' && 'Error saving'}
            {status === 'idle' && content && 'Unsaved changes'}
          </span>
          {isPublished ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={publishing}>
              Unpublish
            </Button>
          ) : null}
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {publishing ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
      <div className="border rounded-lg bg-white">
        <Editor
          title={title}
          onTitleChange={handleTitleChange}
          titlePlaceholder="Untitled"
          initialEditorState={page.content && (page.content.root as Record<string, unknown>)?.version ? JSON.stringify(page.content) : undefined}
          onChange={handleContentChange}
          placeholder="Start writing..."
          plugins={{
            upload: { onUpload: handleUpload },
            videoConvert: {
              natsWsUrl: 'ws://localhost:9222',
              statusSubjectPrefix: 'video.convert.status',
              pollInterval: 3000,
            },
          }}
        />
      </div>
    </div>
  )
}
