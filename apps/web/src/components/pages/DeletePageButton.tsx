'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export function DeletePageButton({ pageId }: { pageId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Delete this page?')) return
    setLoading(true)
    try {
      await api.pages.delete(pageId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={loading} title="Delete page">
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
