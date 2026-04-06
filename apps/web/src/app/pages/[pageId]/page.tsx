import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, History } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { PageViewer } from '@/components/pages/PageViewer'

export const dynamic = 'force-dynamic'

export default async function ViewPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = await params
  let page
  let space
  try {
    page = await api.pages.get(pageId)
    space = await api.spaces.get(page.spaceId)
  } catch {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/spaces">Spaces</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/spaces/${page.spaceId}`}>{space.name}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/pages/${pageId}/history`}>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View version history</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/pages/${pageId}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Edit this page</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <PageViewer page={page} />
    </div>
  )
}
