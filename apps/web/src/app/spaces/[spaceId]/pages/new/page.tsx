'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function NewPagePage() {
  const router = useRouter()
  const params = useParams<{ spaceId: string }>()

  useEffect(() => {
    api.pages.create(params.spaceId).then((page) => {
      router.replace(`/spaces/${params.spaceId}/pages/${page.id}/edit`)
    })
  }, [params.spaceId, router])

  return <div className="animate-pulse p-8 text-muted-foreground">Creating page...</div>
}
