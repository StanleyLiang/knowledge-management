import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>
}) {
  const { spaceId, pageId } = await params

  let page
  let versions
  let space
  try {
    ;[page, versions, space] = await Promise.all([
      api.pages.get(pageId),
      api.pages.versions(pageId),
      api.spaces.get(spaceId),
    ])
  } catch {
    notFound()
  }

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
            <BreadcrumbPage>History</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold mb-1">Version History</h1>
      <p className="text-muted-foreground mb-6">{page.title}</p>

      {versions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No versions yet. Publish the page to create a version.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link href={`/spaces/${spaceId}/pages/${pageId}/history/${v.id}`} className="flex items-center gap-2 hover:underline">
                      <span className="font-medium">v{v.version}</span>
                      {page.publishedVersionId === v.id && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{v.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{v.author ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(v.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
