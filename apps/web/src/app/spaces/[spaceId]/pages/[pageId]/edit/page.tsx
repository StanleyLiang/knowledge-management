import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageEditor } from '@/components/pages/PageEditor'

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>
}) {
  const { spaceId, pageId } = await params

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
        <Link href={`/spaces/${spaceId}/pages/${pageId}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
      </div>
      <PageEditor pageId={pageId} spaceId={spaceId} />
    </div>
  )
}
