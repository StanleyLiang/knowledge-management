import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { Topbar } from '@/components/layout/Topbar'
import { PageEditor } from '@/components/pages/PageEditor'

export default async function EditPagePage({
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
      <Topbar space={space} page={page} mode="edit" />
      <div className="px-6 pt-6 pb-8">
        <PageEditor pageId={pageId} />
      </div>
    </div>
  )
}
