'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Folder, FileText, ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { SpaceWithPages } from '@/lib/types'

export function AppSidebar() {
  const pathname = usePathname()
  const [spaces, setSpaces] = useState<SpaceWithPages[]>([])
  const [loading, setLoading] = useState(true)

  // Extract current spaceId from URL
  const spaceMatch = pathname.match(/\/spaces\/([^/]+)/)
  const currentSpaceId = spaceMatch?.[1]
  const pageMatch = pathname.match(/\/pages\/([^/]+)/)
  const currentPageId = pageMatch?.[1]

  useEffect(() => {
    api.spaces.list().then(async (spaceList) => {
      // Fetch pages for each space
      const spacesWithPages = await Promise.all(
        spaceList.map(async (space) => {
          try {
            return await api.spaces.get(space.id)
          } catch {
            return { ...space, pages: [] } as SpaceWithPages
          }
        }),
      )
      setSpaces(spacesWithPages)
      setLoading(false)
    })
  }, [])

  // Refresh sidebar when pathname changes (e.g. after creating a page)
  useEffect(() => {
    if (loading) return
    api.spaces.list().then(async (spaceList) => {
      const spacesWithPages = await Promise.all(
        spaceList.map(async (space) => {
          try {
            return await api.spaces.get(space.id)
          } catch {
            return { ...space, pages: [] } as SpaceWithPages
          }
        }),
      )
      setSpaces(spacesWithPages)
    })
  }, [pathname, loading])

  if (loading) {
    return (
      <div className="w-60 border-r bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-60 border-r bg-white flex flex-col shrink-0">
      <div className="px-3 py-3 border-b">
        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Spaces
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {spaces.map((space) => (
            <Collapsible key={space.id} defaultOpen={space.id === currentSpaceId}>
              <CollapsibleTrigger className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 group">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                <Link
                  href={`/spaces/${space.id}`}
                  className={cn(
                    'truncate flex-1 text-left',
                    space.id === currentSpaceId && !currentPageId && 'font-semibold',
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {space.name}
                </Link>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 pl-2 border-l border-gray-200">
                  {space.pages.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No pages</div>
                  ) : (
                    space.pages.map((page) => (
                      <Link
                        key={page.id}
                        href={`/spaces/${space.id}/pages/${page.id}`}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 truncate',
                          page.id === currentPageId && 'bg-gray-100 font-medium',
                        )}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{page.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
