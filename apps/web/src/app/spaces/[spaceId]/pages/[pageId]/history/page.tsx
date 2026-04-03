import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>
}) {
  const { spaceId, pageId } = await params

  let page
  let versions
  try {
    ;[page, versions] = await Promise.all([
      api.pages.get(pageId),
      api.pages.versions(pageId),
    ])
  } catch {
    notFound()
  }

  return (
    <div>
      <Link
        href={`/spaces/${spaceId}/pages/${pageId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Page
      </Link>

      <h1 className="text-2xl font-bold mb-1">Version History</h1>
      <p className="text-muted-foreground mb-6">{page.title}</p>

      {versions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No versions yet. Publish the page to create a version.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y bg-white">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/spaces/${spaceId}/pages/${pageId}/history/${v.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Version {v.version}</span>
                  {page.publishedVersionId === v.id && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{v.title}</p>
              </div>
              <div className="text-right shrink-0">
                {v.author && <p className="text-sm text-muted-foreground">{v.author}</p>}
                <p className="text-sm text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
