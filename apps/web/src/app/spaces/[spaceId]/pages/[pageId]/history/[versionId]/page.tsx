import Link from 'next/link'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
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
  let space
  try {
    ;[version, page, space] = await Promise.all([
      api.pages.getVersion(pageId, versionId),
      api.pages.get(pageId),
      api.spaces.get(spaceId),
    ])
  } catch {
    notFound()
  }

  const isCurrent = page.publishedVersionId === version.id

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/spaces">Spaces</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/spaces/${spaceId}`}>{space.name}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/spaces/${spaceId}/pages/${pageId}`}>{page.title}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/spaces/${spaceId}/pages/${pageId}/history`}>History</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>v{version.version}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
