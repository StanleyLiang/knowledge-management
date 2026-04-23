'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  Search,
  FileText,
  Layers,
  Plus,
  Sparkles,
  History,
  ArrowRight,
} from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { api } from '@/lib/api'
import { SpaceGlyph } from '@/components/atoms/SpaceGlyph'
import type { SearchResult, Space } from '@/lib/types'

const DEBOUNCE_MS = 180

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', down)
    const onOpenRequest = () => setOpen(true)
    window.addEventListener('kb:open-palette', onOpenRequest)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('kb:open-palette', onOpenRequest)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    api.spaces.list().then(setSpaces).catch(() => setSpaces([]))
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      api.search(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      setQuery('')
      router.push(href)
    },
    [router],
  )

  const runAction = useCallback((action: () => void) => {
    setOpen(false)
    setQuery('')
    action()
  }, [])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[120px] z-50 w-[580px] -translate-x-1/2 rounded-[16px] border border-border bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search pages, jump between spaces, or run actions
          </DialogPrimitive.Description>
          <Command
            shouldFilter={false}
            className="flex flex-col max-h-[60vh] overflow-hidden"
          >
            <div className="px-[18px] py-[14px] border-b border-border flex items-center gap-2.5">
              <Search className="h-4 w-4 text-ink-3 shrink-0" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search pages, spaces, or run an action…"
                className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-ink-3"
              />
              <kbd className="mono text-[10.5px] text-ink-3 bg-paper-3 border border-border rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            <Command.List className="overflow-y-auto py-2">
              <Command.Empty className="text-[12.5px] text-ink-3 py-6 text-center">
                {loading ? 'Searching…' : query ? 'No matches.' : 'Type to search.'}
              </Command.Empty>

              {results.length > 0 && (
                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1"
                >
                  {results.slice(0, 6).map((r) => (
                    <Command.Item
                      key={r.id}
                      value={`page-${r.id}-${r.title}`}
                      onSelect={() => go(`/pages/${r.id}`)}
                      className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-foreground data-[selected=true]:bg-paper-3 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-ink-3 shrink-0" />
                      <span className="flex-1 truncate">{r.title}</span>
                      <span className="text-[11.5px] text-ink-3 shrink-0">{r.spaceName}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {spaces.length > 0 && (
                <Command.Group
                  heading="Jump to"
                  className="[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1"
                >
                  {spaces.map((s) => (
                    <Command.Item
                      key={s.id}
                      value={`space-${s.id}-${s.name}`}
                      onSelect={() => go(`/spaces/${s.id}`)}
                      className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-foreground data-[selected=true]:bg-paper-3 cursor-pointer"
                    >
                      <SpaceGlyph name={s.name} type={s.type} size="sm" />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="mono text-[11px] text-ink-3 shrink-0 uppercase tracking-wider">
                        {s.type.toLowerCase()}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group
                heading="Actions"
                className="[&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-ink-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1"
              >
                <Command.Item
                  value="action-new-page"
                  onSelect={() => runAction(() => go('/spaces'))}
                  className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-foreground data-[selected=true]:bg-paper-3 cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-ink-3 shrink-0" />
                  <span className="flex-1">New page</span>
                  <kbd className="mono text-[10.5px] text-ink-3 bg-paper-3 border border-border rounded px-1.5 py-0.5">
                    ⌘N
                  </kbd>
                </Command.Item>
                <Command.Item
                  value="action-syntheses"
                  onSelect={() => runAction(() => go('/syntheses'))}
                  className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-foreground data-[selected=true]:bg-paper-3 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-plum shrink-0" />
                  <span className="flex-1">Open Syntheses</span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-3" />
                </Command.Item>
                <Command.Item
                  value="action-spaces"
                  onSelect={() => runAction(() => go('/spaces'))}
                  className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-foreground data-[selected=true]:bg-paper-3 cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-ink-3 shrink-0" />
                  <span className="flex-1">All spaces</span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-3" />
                </Command.Item>
                <Command.Item
                  value="action-history"
                  onSelect={() =>
                    runAction(() => window.dispatchEvent(new CustomEvent('kb:open-history')))
                  }
                  className="mx-2 px-2.5 py-2 rounded-[8px] flex items-center gap-2.5 text-[13px] text-ink-3 data-[selected=true]:bg-paper-3 cursor-pointer"
                  disabled
                >
                  <History className="h-4 w-4 text-ink-3 shrink-0" />
                  <span className="flex-1">Open page history</span>
                  <span className="text-[11px] text-ink-3">on a page</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
