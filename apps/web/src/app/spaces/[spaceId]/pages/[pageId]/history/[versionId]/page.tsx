import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VersionViewer } from '@/components/pages/VersionViewer'
import { RestoreButton } from '@/components/pages/RestoreButton'

export const dynamic = 'force-dynamic'

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string; versionId: string }>
}) {
  const { spaceId, pageId, versionId } = await params

  let version
  let page
  try {
    ;[version, page] = await Promise.all([
      api.pages.getVersion(pageId, versionId),
      api.pages.get(pageId),
    ])
  } catch {
    notFound()
  }

  const isCurrent = page.publishedVersionId === version.id

  return (
    <div>
      <Link
        href={`/spaces/${spaceId}/pages/${pageId}/history`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Version {version.version}</h1>
          {isCurrent && <Badge>Current</Badge>}
          <span className="text-sm text-muted-foreground">
            {new Date(version.createdAt).toLocaleString()}
          </span>
        </div>
        {!isCurrent && (
          <RestoreButton pageId={pageId} versionId={versionId} spaceId={spaceId} />
        )}
      </div>

      <VersionViewer version={version} />
    </div>
  )
}
