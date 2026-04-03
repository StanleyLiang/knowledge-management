import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Pencil, MoreHorizontal } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TemplatePicker } from '@/components/pages/TemplatePicker'
import { PageActions } from '@/components/pages/PageActions'

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
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/spaces">Spaces</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{space.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Link href={`/spaces/${spaceId}/pages/${page.id}`} className="flex items-center gap-2 hover:underline">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{page.title}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {page.author ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-xs">
                      {page.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <PageActions pageId={page.id} spaceId={spaceId} />
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
