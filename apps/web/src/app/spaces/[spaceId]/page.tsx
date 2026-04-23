import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TemplatePicker } from '@/components/pages/TemplatePicker'
import { PageActions } from '@/components/pages/PageActions'
import { SpaceGlyph } from '@/components/atoms/SpaceGlyph'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function prettyTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function resolveSpaceId(slug: string) {
  if (slug !== 'mySpace') return slug
  const spaces = await api.spaces.list()
  const personal = spaces.find((s) => s.type === 'PERSONAL')
  if (personal) return personal.id
  const newSpace = await api.spaces.create({ name: 'My Space', type: 'PERSONAL' })
  return newSpace.id
}

export default async function SpaceDetailPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId: slug } = await params
  const spaceId = await resolveSpaceId(slug)
  let space
  try {
    space = await api.spaces.get(spaceId)
  } catch {
    notFound()
  }

  return (
    <div>
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/spaces" className="text-ink-3 hover:text-foreground">Spaces</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground">{space.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between mb-8 gap-6">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <SpaceGlyph name={space.name} type={space.type} size="lg" className="mt-1.5" />
          <div className="min-w-0">
            <h1 className="serif text-[40px] font-normal tracking-[-0.01em] leading-none text-foreground">
              {space.name}
            </h1>
            {space.description && (
              <p className="text-ink-2 mt-2.5 text-[14px] leading-relaxed">{space.description}</p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <TemplatePicker spaceId={spaceId} />
        </div>
      </div>

      {space.pages.length === 0 ? (
        <div className="text-center py-16 bg-paper-2 border border-border rounded-[14px]">
          <FileText className="h-8 w-8 mx-auto mb-3 text-ink-3" />
          <p className="text-[13px] text-ink-2">No pages yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-[14px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-paper-2 hover:bg-paper-2">
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-ink-3 font-semibold">Title</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-ink-3 font-semibold">Author</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-ink-3 font-semibold">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.08em] text-ink-3 font-semibold">Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {space.pages.map((page) => {
                const isPublished = page.status === 'PUBLISHED'
                return (
                  <TableRow key={page.id} className="h-12 hover:bg-paper-3">
                    <TableCell className="py-0">
                      <Link href={`/pages/${page.id}`} className="flex items-center gap-2.5 text-[13.5px] text-foreground hover:text-foreground">
                        <FileText className="h-4 w-4 text-ink-3 shrink-0" />
                        <span className="font-medium truncate">{page.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-0 text-[13px] text-ink-2">
                      {page.author ?? '—'}
                    </TableCell>
                    <TableCell className="py-0">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium',
                          isPublished ? 'bg-sage-soft text-sage-ink' : 'bg-paper-3 text-ink-2',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full',
                            isPublished ? 'bg-sage' : 'bg-ink-3',
                          )}
                        />
                        {page.status.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="py-0 text-[13px] text-ink-3">
                      {prettyTime(page.updatedAt)}
                    </TableCell>
                    <TableCell className="py-0">
                      <PageActions pageId={page.id} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
