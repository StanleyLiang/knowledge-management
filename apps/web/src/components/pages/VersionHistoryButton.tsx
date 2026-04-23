'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { History } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { PageVersionSummary } from '@/lib/types'

type Filter = 'all' | 'published' | 'drafts' | 'mine'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'mine', label: 'Mine' },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

interface VersionHistoryButtonProps {
  pageId: string
  pageTitle: string
  publishedVersionId: string | null
}

export function VersionHistoryButton({
  pageId,
  pageTitle,
  publishedVersionId,
}: VersionHistoryButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<PageVersionSummary[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.pages
      .versions(pageId)
      .then((v) => {
        setVersions(v)
        setSelectedId(publishedVersionId ?? v[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [open, pageId, publishedVersionId])

  const filtered = versions.filter((v) => {
    if (filter === 'published') return v.id === publishedVersionId
    if (filter === 'drafts') return v.id !== publishedVersionId
    return true
  })

  const handleRestore = useCallback(
    (versionId: string) => {
      startTransition(async () => {
        await api.pages.restore(pageId, versionId)
        setOpen(false)
        router.refresh()
      })
    },
    [pageId, router],
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-[11px] py-[5px] text-[12.5px] text-ink-2 hover:text-foreground transition-colors"
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </SheetTrigger>
      <SheetContent className="w-[460px] p-0 flex flex-col bg-background">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3 font-semibold">
            Version history
          </span>
          <SheetTitle className="serif text-[24px] font-normal leading-tight pr-10">
            {pageTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">Version history for {pageTitle}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-3 flex items-center gap-1.5 border-b border-border">
          {FILTERS.map((f) => {
            const active = f.id === filter
            const count =
              f.id === 'all'
                ? versions.length
                : f.id === 'published'
                  ? versions.filter((v) => v.id === publishedVersionId).length
                  : f.id === 'drafts'
                    ? versions.filter((v) => v.id !== publishedVersionId).length
                    : versions.length
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'bg-paper-3 text-ink-2 hover:text-foreground',
                )}
              >
                {f.label}
                <span className={cn('mono', active ? 'opacity-70' : 'text-ink-3')}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-[12.5px] text-ink-3 py-8 text-center">Loading versions…</div>
          ) : filtered.length === 0 ? (
            <div className="text-[12.5px] text-ink-3 py-8 text-center">
              No versions to show. Publish this page to create one.
            </div>
          ) : (
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-px bg-border"
                style={{ left: 13 }}
              />
              <ul className="flex flex-col gap-1">
                {filtered.map((v) => {
                  const isCurrent = v.id === publishedVersionId
                  const isSelected = v.id === selectedId
                  return (
                    <li key={v.id} className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-[14px] h-[14px] w-[14px] rounded-full border-2',
                          isCurrent
                            ? 'bg-terracotta border-terracotta ring-4 ring-terracotta-soft'
                            : 'bg-background border-border',
                        )}
                        style={{ left: 6 }}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedId(v.id)}
                        className={cn(
                          'w-full text-left pl-[34px] pr-3 py-2.5 rounded-[10px] transition-colors',
                          isSelected ? 'bg-terracotta-soft' : 'hover:bg-paper-3',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-foreground">
                            v{v.version}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex rounded-full bg-sage-soft text-sage-ink px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
                              current
                            </span>
                          )}
                        </div>
                        <div className="text-[12.5px] text-ink-2 truncate">{v.title}</div>
                        <div className="text-[11.5px] text-ink-3 mt-1">
                          {v.author ?? 'Unknown'} · {formatTime(v.createdAt)}
                        </div>

                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRestore(v.id)
                                }}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 rounded-lg bg-foreground text-background px-2.5 py-1 text-[11.5px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                              >
                                Restore this version
                              </button>
                            )}
                            <Link
                              href={`/pages/${pageId}/history/${v.id}`}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11.5px] text-ink-2 hover:text-foreground transition-colors"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11.5px] text-ink-3 cursor-not-allowed"
                              title="Compare (coming soon)"
                            >
                              Compare with current
                            </button>
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
