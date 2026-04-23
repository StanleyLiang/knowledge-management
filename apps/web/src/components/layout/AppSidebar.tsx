'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronRight,
  Plus,
  ChevronsUpDown,
  Check,
  Search,
  Inbox,
  Sparkles,
  Clock,
  Globe,
  Settings,
} from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { SpaceGlyph } from '@/components/atoms/SpaceGlyph'
import { KeeptioMark } from '@/components/brand/KeeptioMark'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Space, SpaceWithPages, PageSummary } from '@/lib/types'

// ── Tree building ──

interface PageTreeNode extends PageSummary {
  children: PageTreeNode[]
}

function buildPageTree(pages: PageSummary[]): PageTreeNode[] {
  const map = new Map<string, PageTreeNode>()
  const roots: PageTreeNode[] = []

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] })
  }

  for (const page of pages) {
    const node = map.get(page.id)!
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ── Flat row for virtualizer ──

interface FlatRow {
  id: string
  title: string
  status: string
  depth: number
  hasChildren: boolean
  spaceId: string
}

function flattenPages(
  tree: PageTreeNode[],
  spaceId: string,
  expandedIds: Set<string>,
): FlatRow[] {
  const rows: FlatRow[] = []
  flattenNodes(tree, spaceId, 0, expandedIds, rows)
  return rows
}

function flattenNodes(
  nodes: PageTreeNode[],
  spaceId: string,
  depth: number,
  expandedIds: Set<string>,
  rows: FlatRow[],
) {
  for (const node of nodes) {
    rows.push({
      id: node.id,
      title: node.title,
      status: node.status,
      depth,
      hasChildren: node.children.length > 0,
      spaceId,
    })

    if (node.children.length > 0 && expandedIds.has(node.id)) {
      flattenNodes(node.children, spaceId, depth + 1, expandedIds, rows)
    }
  }
}

// ── Helpers ──

function collectAncestorIds(
  pages: PageSummary[],
  targetId: string | undefined,
): Set<string> {
  if (!targetId) return new Set()
  const parentMap = new Map<string, string>()
  for (const p of pages) {
    if (p.parentId) parentMap.set(p.id, p.parentId)
  }
  const ancestors = new Set<string>()
  let current = targetId
  while (parentMap.has(current)) {
    current = parentMap.get(current)!
    ancestors.add(current)
  }
  return ancestors
}

const ROW_HEIGHT = 32
const EXPANDED_KEY = 'kb:sidebar:expanded'

// ── Component ──

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [spaceList, setSpaceList] = useState<Space[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [currentSpace, setCurrentSpace] = useState<SpaceWithPages | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = window.localStorage.getItem(EXPANDED_KEY)
      if (!raw) return new Set()
      const arr = JSON.parse(raw)
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  })
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const spaceMatch = pathname.match(/\/spaces\/([^/]+)/)
  const currentSpaceId = spaceMatch?.[1]
  const pageMatch = pathname.match(/\/pages\/([^/]+)/)
  const currentPageId = pageMatch?.[1]

  // Fetch space list (lightweight, no pages)
  useEffect(() => {
    api.spaces.list().then((spaces) => {
      setSpaceList(spaces)
      if (spaces.length > 0 && !selectedSpaceId) {
        setSelectedSpaceId(spaces[0].id)
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select space from URL
  useEffect(() => {
    if (spaceList.length === 0) return

    if (currentSpaceId === 'mySpace') {
      const personal = spaceList.find((s) => s.type === 'PERSONAL')
      if (personal) setSelectedSpaceId(personal.id)
      return
    }

    if (currentSpaceId && spaceList.some((s) => s.id === currentSpaceId)) {
      setSelectedSpaceId(currentSpaceId)
      return
    }

    if (currentPageId && currentSpace) {
      const found = currentSpace.pages.find((p) => p.id === currentPageId)
      if (found) return
    }

    if (currentPageId) {
      Promise.all(spaceList.map((s) => api.spaces.get(s.id))).then((allSpaces) => {
        for (const space of allSpaces) {
          if (space.pages.some((p) => p.id === currentPageId)) {
            setSelectedSpaceId(space.id)
            setCurrentSpace(space)
            return
          }
        }
      })
    }
  }, [currentSpaceId, currentPageId, spaceList]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedSpaceId) return
    api.spaces.get(selectedSpaceId).then(setCurrentSpace)
  }, [selectedSpaceId])

  useEffect(() => {
    if (loading || !selectedSpaceId) return
    api.spaces.get(selectedSpaceId).then(setCurrentSpace)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loading) return
    api.spaces.list().then(setSpaceList)
  }, [pathname, loading])

  useEffect(() => {
    if (!currentSpace || !currentPageId) return
    const page = currentSpace.pages.find((p) => p.id === currentPageId)
    if (!page) return
    const ancestors = collectAncestorIds(currentSpace.pages, currentPageId)
    if (ancestors.size > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        for (const id of ancestors) next.add(id)
        return next
      })
    }
  }, [currentSpace, currentPageId])

  // Persist expandedIds to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expandedIds]))
    } catch {
      /* ignore */
    }
  }, [expandedIds])

  const pageTree = useMemo(() => {
    if (!currentSpace) return []
    return buildPageTree(currentSpace.pages)
  }, [currentSpace])

  const flatRows = useMemo(
    () => (currentSpace ? flattenPages(pageTree, currentSpace.id, expandedIds) : []),
    [pageTree, currentSpace, expandedIds],
  )

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleAddSubPage = useCallback(
    async (e: React.MouseEvent, spaceId: string, parentId: string) => {
      e.preventDefault()
      e.stopPropagation()
      if (creatingFor) return
      setCreatingFor(parentId)
      try {
        const page = await api.pages.create(spaceId, { parentId })
        router.push(`/pages/${page.id}/edit`)
      } finally {
        setCreatingFor(null)
      }
    },
    [creatingFor, router],
  )

  const handleAddRootPage = useCallback(async () => {
    if (!selectedSpaceId || creatingFor) return
    setCreatingFor(selectedSpaceId)
    try {
      const page = await api.pages.create(selectedSpaceId)
      router.push(`/pages/${page.id}/edit`)
    } finally {
      setCreatingFor(null)
    }
  }, [selectedSpaceId, creatingFor, router])

  const selectedSpace = spaceList.find((s) => s.id === selectedSpaceId)

  if (loading) {
    return (
      <aside className="w-[268px] flex-shrink-0 flex flex-col border-r border-border bg-gradient-to-b from-[oklch(0.975_0.014_78)] to-[oklch(0.955_0.018_78)] p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-28 ml-4" />
        <Skeleton className="h-4 w-24 ml-4" />
        <Skeleton className="h-5 w-32" />
      </aside>
    )
  }

  return (
    <aside className="w-[268px] flex-shrink-0 flex flex-col border-r border-border bg-gradient-to-b from-[oklch(0.975_0.014_78)] to-[oklch(0.955_0.018_78)]">
      {/* Brand block */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2.5">
        <KeeptioMark
          size={26}
          className="rounded-lg shadow-[0_1px_1px_oklch(0.3_0.05_40/0.18)]"
        />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="serif text-[17px] text-foreground">Keeptio</span>
          <span className="text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Kept within reach
          </span>
        </span>
      </div>

      {/* Space switcher */}
      <div className="px-3 pt-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 w-full bg-background border border-border rounded-[10px] shadow-xs p-2 outline-none hover:bg-paper-2 transition-colors">
            <SpaceGlyph
              name={selectedSpace?.name ?? 'Space'}
              type={selectedSpace?.type}
              size="md"
            />
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-[13px] font-medium text-foreground truncate">
                {selectedSpace?.name ?? 'Select space'}
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-ink-3">
                {selectedSpace?.type?.toLowerCase() ?? 'space'}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-ink-3 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            {spaceList.map((space) => (
              <DropdownMenuItem
                key={space.id}
                onClick={() => {
                  setSelectedSpaceId(space.id)
                  router.push(
                    space.type === 'PERSONAL' ? '/spaces/mySpace' : `/spaces/${space.id}`,
                  )
                }}
                className="flex items-center gap-2 py-1.5"
              >
                <SpaceGlyph name={space.name} type={space.type} size="md" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium truncate">{space.name}</span>
                  <span className="block text-[10.5px] uppercase tracking-wider text-ink-3">
                    {space.type.toLowerCase()}
                  </span>
                </span>
                {space.id === selectedSpaceId && (
                  <Check className="h-3.5 w-3.5 text-terracotta shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick-find */}
      <div className="px-3 pt-2">
        <button
          type="button"
          className="flex items-center gap-2 w-full px-3 py-[7px] rounded-lg bg-muted text-ink-3 text-sm hover:bg-paper-3 transition-colors"
          onClick={() => {
            // Command palette (§4.9) — stub for now
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('kb:open-palette'))
            }
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Quick find…</span>
          <kbd className="mono text-[10.5px] text-ink-3 border border-border rounded px-1 py-0.5 bg-background">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav group */}
      <nav className="px-3 pt-3 pb-1 flex flex-col gap-0.5">
        <NavRow href="/inbox" icon={<Inbox className="h-3.5 w-3.5" />} label="Inbox" disabled />
        <NavRow
          href="/syntheses"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Syntheses"
          badge="new"
          active={pathname.startsWith('/syntheses')}
        />
        <NavRow href="/recent" icon={<Clock className="h-3.5 w-3.5" />} label="Recent" disabled />
        <NavRow
          href="/published"
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Published"
          disabled
        />
      </nav>

      {/* Pages section header */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.1em] text-ink-3 font-semibold">
          Pages
        </span>
        <button
          type="button"
          onClick={handleAddRootPage}
          disabled={creatingFor === selectedSpaceId}
          className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-paper-3 text-ink-3 hover:text-foreground disabled:opacity-50 transition-colors"
          title="New page"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Virtualized page tree */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {flatRows.length === 0 ? (
          <div className="px-4 py-3 text-xs text-ink-3">No pages</div>
        ) : (
          <div
            className="relative w-full px-2 py-1"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = flatRows[virtualItem.index]
              const isExpanded = expandedIds.has(row.id)
              const isActive = row.id === currentPageId
              const isDraft = row.status !== 'PUBLISHED'

              return (
                <div
                  key={virtualItem.key}
                  className="absolute left-0 right-0 group"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1 mx-1 rounded-[7px] transition-colors',
                      isActive
                        ? 'bg-terracotta-soft text-foreground font-semibold'
                        : 'hover:bg-paper-3',
                    )}
                    style={{ paddingLeft: row.depth * 16 + 4 }}
                  >
                    {row.hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(row.id)}
                        className="inline-flex items-center justify-center h-5 w-5 shrink-0 text-ink-3 hover:text-foreground"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronRight
                          className={cn(
                            'h-3 w-3 transition-transform duration-[140ms]',
                            isExpanded && 'rotate-90',
                          )}
                        />
                      </button>
                    ) : (
                      <span className="inline-block h-5 w-5 shrink-0" />
                    )}
                    <Link
                      href={`/pages/${row.id}`}
                      className={cn(
                        'flex items-center gap-1.5 flex-1 min-w-0 px-1.5 py-1 text-sm truncate',
                        !isActive && 'text-ink-2',
                      )}
                    >
                      <span className="truncate">{row.title}</span>
                      {isDraft && (
                        <span
                          aria-hidden="true"
                          className="inline-block h-[5px] w-[5px] rounded-full bg-ink-3 shrink-0"
                          title="Draft"
                        />
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => handleAddSubPage(e, row.spaceId, row.id)}
                      disabled={creatingFor === row.id}
                      className="hidden group-hover:inline-flex items-center justify-center h-5 w-5 rounded hover:bg-paper-4 text-ink-3 shrink-0 mr-1"
                      title="Add sub-page"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer — user strip */}
      <div className="border-t border-border bg-[oklch(0.96_0.016_78)] px-3 py-[10px] flex items-center gap-2.5">
        <div className="relative">
          <Avatar className="h-7 w-7">
            <AvatarImage
              src="https://api.dicebear.com/9.x/initials/svg?seed=You&radius=50&backgroundColor=e8c4a0"
              alt="You"
            />
            <AvatarFallback className="text-[10px]">Y</AvatarFallback>
          </Avatar>
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-sage ring-2 ring-[oklch(0.96_0.016_78)]"
          />
        </div>
        <span className="flex-1 min-w-0 flex flex-col leading-tight">
          <span className="text-[12.5px] font-medium text-foreground truncate">You</span>
          <span className="text-[10.5px] text-ink-3">Online</span>
        </span>
        <button
          type="button"
          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-3 hover:text-foreground hover:bg-paper-3"
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}

interface NavRowProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string
  active?: boolean
  disabled?: boolean
}

function NavRow({ href, icon, label, badge, active, disabled }: NavRowProps) {
  const inner = (
    <span
      className={cn(
        'flex items-center gap-[9px] px-2 py-[5px] rounded-[7px] text-sm transition-colors',
        active
          ? 'bg-terracotta-soft text-foreground font-medium'
          : 'text-ink-2 hover:bg-paper-3',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="text-ink-3">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="inline-flex items-center rounded-full bg-plum-soft text-plum-ink px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
          {badge}
        </span>
      )}
    </span>
  )

  if (disabled) {
    return (
      <span role="link" aria-disabled="true">
        {inner}
      </span>
    )
  }
  return <Link href={href}>{inner}</Link>
}
