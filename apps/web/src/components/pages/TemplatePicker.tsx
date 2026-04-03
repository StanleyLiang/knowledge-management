'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, File, ClipboardList, FileText, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { PageTemplate } from '@/lib/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  file: <File className="h-6 w-6" />,
  'clipboard-list': <ClipboardList className="h-6 w-6" />,
  'file-text': <FileText className="h-6 w-6" />,
  'book-open': <BookOpen className="h-6 w-6" />,
}

export function TemplatePicker({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<PageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    if (open && templates.length === 0) {
      setLoading(true)
      api.templates.list().then((data) => {
        setTemplates(data)
        setLoading(false)
      })
    }
  }, [open, templates.length])

  async function handleSelect(template: PageTemplate) {
    setCreating(template.id)
    try {
      const isBlank = template.name === 'Blank'
      const page = await api.pages.create(spaceId, {
        title: isBlank ? undefined : template.name,
        content: isBlank ? undefined : template.content,
      })
      setOpen(false)
      router.push(`/spaces/${spaceId}/pages/${page.id}/edit`)
    } finally {
      setCreating(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>Start with a template or a blank page.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                disabled={creating !== null}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-center disabled:opacity-50"
              >
                <div className="text-muted-foreground">
                  {ICON_MAP[template.icon ?? 'file'] ?? <File className="h-6 w-6" />}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {creating === template.id ? 'Creating...' : template.name}
                  </div>
                  {template.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">{template.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
