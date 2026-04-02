import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { TemplatePicker } from '@/components/pages/TemplatePicker'
import { DeletePageButton } from '@/components/pages/DeletePageButton'

export const dynamic = 'force-dynamic'

export default async function SpaceDetailPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params
  let space
  try {
    space = await api.spaces.get(spaceId)
  } catch {
    notFound()
  }

  return (
    <div>
      <Link href="/spaces" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Spaces
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{space.name}</h1>
          {space.description && <p className="text-muted-foreground mt-1">{space.description}</p>}
        </div>
        <TemplatePicker spaceId={spaceId} />
      </div>

      {space.pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pages yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y bg-white">
          {space.pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <Link href={`/spaces/${spaceId}/pages/${page.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{page.title}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {page.status.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                  Updated {new Date(page.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <DeletePageButton pageId={page.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
