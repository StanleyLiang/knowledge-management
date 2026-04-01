import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { PageViewer } from '@/components/pages/PageViewer'

export const dynamic = 'force-dynamic'

export default async function ViewPagePage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>
}) {
  const { spaceId, pageId } = await params
  let page
  try {
    page = await api.pages.get(pageId)
  } catch {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/spaces/${spaceId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pages
        </Link>
        <Link href={`/spaces/${spaceId}/pages/${pageId}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>
      <PageViewer page={page} />
    </div>
  )
}
