import Link from 'next/link'
import { Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { PageEditor } from '@/components/pages/PageEditor'

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>
}) {
  const { spaceId, pageId } = await params

  let space
  try {
    space = await api.spaces.get(spaceId)
  } catch {
    space = null
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
              <BreadcrumbLink asChild><Link href={`/spaces/${spaceId}`}>{space?.name ?? 'Space'}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editing</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/spaces/${spaceId}/pages/${pageId}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                View
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>View published page</TooltipContent>
        </Tooltip>
      </div>
      <PageEditor pageId={pageId} spaceId={spaceId} />
    </div>
  )
}
