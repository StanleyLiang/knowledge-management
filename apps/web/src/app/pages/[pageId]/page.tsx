import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { Topbar } from '@/components/layout/Topbar'
import { PageViewer } from '@/components/pages/PageViewer'
import { RightRail } from '@/components/layout/RightRail'

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

  const railContent = page.publishedVersion?.content ?? page.content ?? null

  return (
    <div className="-mx-6 -mt-8 flex flex-col h-[calc(100vh-49px)]">
      <Topbar space={space} page={page} mode="read" />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto">
          <PageViewer page={page} />
        </div>
        <RightRail content={railContent} />
      </div>
    </div>
  )
}
