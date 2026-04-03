'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
    setLoading(true)
    try {
      await api.pages.restore(pageId, versionId)
      router.push(`/spaces/${spaceId}/pages/${pageId}/edit`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <RotateCcw className="h-4 w-4" />
          {loading ? 'Restoring...' : 'Restore to Draft'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this version?</AlertDialogTitle>
          <AlertDialogDescription>
            This will overwrite the current draft with the content from this version. You can still access other versions from the history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
