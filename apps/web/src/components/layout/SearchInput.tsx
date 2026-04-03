'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { api } from '@/lib/api'
import type { SearchResult } from '@/lib/types'

export function SearchInput() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const data = await api.search(q)
      setResults(data)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), 300)
  }

  function handleSelect(result: SearchResult) {
    setOpen(false)
    setQuery('')
    router.push(`/spaces/${result.spaceId}/pages/${result.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search pages..."
            className="h-8 w-64 pl-8"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-80 p-0 max-h-80 overflow-y-auto"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
        ) : results.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
        ) : (
          results.map((result) => (
            <button
              key={result.id}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground border-b last:border-b-0 transition-colors"
              onClick={() => handleSelect(result)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{result.title}</span>
                <Badge variant={result.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {result.status.toLowerCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{result.spaceName}</div>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  )
}
