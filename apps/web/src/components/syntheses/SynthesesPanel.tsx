'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, RefreshCw, Check, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Space, Synthesis, SynthesisStatus, GenerateReport } from '@/lib/types'

const STATUS_VARIANT: Record<SynthesisStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  ACCEPTED: 'default',
  EDITED: 'default',
  REJECTED: 'destructive',
}

export function SynthesesPanel({ spaces }: { spaces: Space[] }) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaces[0]?.id ?? '')
  const [syntheses, setSyntheses] = useState<Synthesis[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [lastReport, setLastReport] = useState<GenerateReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (spaceId: string) => {
    if (!spaceId) return
    setLoading(true)
    setError(null)
    try {
      const list = await api.syntheses.list(spaceId)
      setSyntheses(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh(selectedSpaceId)
  }, [selectedSpaceId, refresh])

  const handleGenerate = async () => {
    if (!selectedSpaceId) return
    setGenerating(true)
    setError(null)
    try {
      const report = await api.syntheses.generate(selectedSpaceId)
      setLastReport(report)
      await refresh(selectedSpaceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  const updateStatus = async (id: string, status: SynthesisStatus) => {
    try {
      const updated = await api.syntheses.update(id, { status })
      setSyntheses((prev) => prev.map((s) => (s.id === id ? { ...s, status: updated.status } : s)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="space-select" className="text-sm text-muted-foreground">
            Space
          </label>
          <select
            id="space-select"
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm bg-white"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh(selectedSpaceId)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleGenerate} disabled={generating || !selectedSpaceId}>
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>

      {lastReport && (
        <div className="text-xs text-muted-foreground">
          Considered {lastReport.pagesConsidered} pages · {lastReport.clusters} clusters ·{' '}
          {lastReport.syntheses} new syntheses
          {lastReport.skippedExisting > 0 ? ` · ${lastReport.skippedExisting} existing` : ''}
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading && syntheses.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : syntheses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-white">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No syntheses yet.</p>
          <p className="text-xs mt-1">Click Generate to cluster notes and synthesize them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {syntheses.map((s) => (
            <SynthesisCard key={s.id} synthesis={s} onStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  )
}

function SynthesisCard({
  synthesis,
  onStatus,
}: {
  synthesis: Synthesis
  onStatus: (id: string, status: SynthesisStatus) => void
}) {
  return (
    <Card className={synthesis.status === 'REJECTED' ? 'opacity-60' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{synthesis.title}</CardTitle>
          <Badge variant={STATUS_VARIANT[synthesis.status]} className="text-xs shrink-0">
            {synthesis.status.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Section label="Summary" body={synthesis.summary} />
        <Section label="Contradictions" body={synthesis.contradictions} />
        <Section label="Open questions" body={synthesis.openQuestions} />

        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Sources ({synthesis.sources.length})
          </div>
          <ul className="space-y-1">
            {synthesis.sources.map((src) => (
              <li key={src.pageId}>
                <Link
                  href={`/pages/${src.pageId}`}
                  className="flex items-center gap-2 hover:underline text-sm"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{src.page.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatus(synthesis.id, 'ACCEPTED')}
            disabled={synthesis.status === 'ACCEPTED'}
          >
            <Check className="h-4 w-4" /> Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatus(synthesis.id, 'REJECTED')}
            disabled={synthesis.status === 'REJECTED'}
          >
            <X className="h-4 w-4" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </div>
      <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  )
}
