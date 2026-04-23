import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { Topbar } from '@/components/layout/Topbar'
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
    <div className="-mx-6 -mt-8">
      <Topbar space={space} page={page} mode="read" />
      <PageViewer page={page} />
    </div>
  )
}
