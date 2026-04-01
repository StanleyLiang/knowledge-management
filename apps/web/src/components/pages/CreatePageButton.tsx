'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function CreatePageButton({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const page = await api.pages.create(spaceId)
      router.push(`/spaces/${spaceId}/pages/${page.id}/edit`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      <Plus className="h-4 w-4" />
      {loading ? 'Creating...' : 'New Page'}
    </Button>
  )
}
