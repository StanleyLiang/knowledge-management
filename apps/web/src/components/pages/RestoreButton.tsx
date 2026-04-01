'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function RestoreButton({
  pageId,
  versionId,
  spaceId,
}: {
  pageId: string
  versionId: string
  spaceId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRestore() {
    if (!confirm('Restore this version? This will overwrite the current draft.')) return
    setLoading(true)
    try {
      await api.pages.restore(pageId, versionId)
      router.push(`/spaces/${spaceId}/pages/${pageId}/edit`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestore} disabled={loading}>
      <RotateCcw className="h-4 w-4" />
      {loading ? 'Restoring...' : 'Restore to Draft'}
    </Button>
  )
}
