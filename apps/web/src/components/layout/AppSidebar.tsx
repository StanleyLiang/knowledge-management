'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, Users, Building2, FileText, ChevronRight, Plus, ChevronsUpDown, Check } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Space, SpaceType, SpaceWithPages, PageSummary } from '@/lib/types'

// ── Space icon by type ──

const SPACE_ICONS: Record<SpaceType, typeof User> = {
  PERSONAL: User,
  TEAM: Users,
  OFFICIAL: Building2,
}

function SpaceIcon({ type, className }: { type?: SpaceType; className?: string }) {
  const Icon = SPACE_ICONS[type ?? 'TEAM']
  return <Icon className={className} />
}

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

// ── Component ──

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [spaceList, setSpaceList] = useState<Space[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [currentSpace, setCurrentSpace] = useState<SpaceWithPages | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
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

    if (currentSpaceId && spaceList.some((s) => s.id === currentSpaceId)) {
      setSelectedSpaceId(currentSpaceId)
      return
    }

    // If viewing a page, find which space it belongs to
    if (currentPageId && currentSpace) {
      const found = currentSpace.pages.find((p) => p.id === currentPageId)
      if (found) return // already on the right space
    }

    // Try to find page in all spaces
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

  // Fetch selected space's pages
  useEffect(() => {
    if (!selectedSpaceId) return
    api.spaces.get(selectedSpaceId).then(setCurrentSpace)
  }, [selectedSpaceId])

  // Refresh current space on pathname change
  useEffect(() => {
    if (loading || !selectedSpaceId) return
    api.spaces.get(selectedSpaceId).then(setCurrentSpace)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh space list on pathname change (new spaces may have been created)
  useEffect(() => {
    if (loading) return
    api.spaces.list().then(setSpaceList)
  }, [pathname, loading])

  // Auto-expand ancestor pages of current page
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

  // Build tree for current space
  const pageTree = useMemo(() => {
    if (!currentSpace) return []
    return buildPageTree(currentSpace.pages)
  }, [currentSpace])

  // Flatten for virtualizer
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

  const selectedSpace = spaceList.find((s) => s.id === selectedSpaceId)

  if (loading) {
    return (
      <div className="w-60 border-r bg-white p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-28 ml-4" />
        <Skeleton className="h-4 w-24 ml-4" />
        <Skeleton className="h-5 w-32" />
      </div>
    )
  }

  return (
    <div className="w-60 border-r bg-white flex flex-col shrink-0">
      {/* Space switcher dropdown */}
      <div className="px-3 py-3 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 outline-none">
            <SpaceIcon type={selectedSpace?.type} className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="truncate flex-1 text-left font-medium">
              {selectedSpace?.name ?? 'Select space'}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {spaceList.map((space) => (
              <DropdownMenuItem
                key={space.id}
                onClick={() => {
                  setSelectedSpaceId(space.id)
                  router.push(`/spaces/${space.id}`)
                }}
                className="flex items-center gap-2"
              >
                <SpaceIcon type={space.type} className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate flex-1">{space.name}</span>
                {space.id === selectedSpaceId && (
                  <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Virtualized page tree */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {flatRows.length === 0 ? (
          <div className="px-4 py-3 text-xs text-muted-foreground">No pages</div>
        ) : (
          <div
            className="relative w-full p-2"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = flatRows[virtualItem.index]
              const isExpanded = expandedIds.has(row.id)

              return (
                <div
                  key={virtualItem.key}
                  className="absolute left-0 right-0 group"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex items-center" style={{ paddingLeft: row.depth * 16 }}>
                    {row.hasChildren ? (
                      <button
                        onClick={() => toggleExpand(row.id)}
                        className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100"
                      >
                        <ChevronRight
                          className={cn(
                            'h-3 w-3 text-muted-foreground transition-transform shrink-0',
                            isExpanded && 'rotate-90',
                          )}
                        />
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Link
                          href={`/pages/${row.id}`}
                          className={cn(
                            'truncate flex-1 text-left',
                            row.id === currentPageId && 'font-medium',
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.title}
                        </Link>
                      </button>
                    ) : (
                      <Link
                        href={`/pages/${row.id}`}
                        className={cn(
                          'flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 truncate',
                          row.id === currentPageId && 'bg-gray-100 font-medium',
                        )}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{row.title}</span>
                      </Link>
                    )}
                    <button
                      onClick={(e) => handleAddSubPage(e, row.spaceId, row.id)}
                      disabled={creatingFor === row.id}
                      className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded hover:bg-gray-200 shrink-0 mr-1"
                      title="Add sub-page"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
