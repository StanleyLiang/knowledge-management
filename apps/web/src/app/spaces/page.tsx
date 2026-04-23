import Link from 'next/link'
import { FileText, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { SpaceGlyph } from '@/components/atoms/SpaceGlyph'
import { CreateSpaceDialog } from '@/components/spaces/CreateSpaceDialog'

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

export default async function SpacesPage() {
  const spaces = await api.spaces.list()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="serif text-[36px] font-normal tracking-[-0.01em] leading-none text-foreground">
            Spaces
          </h1>
          <p className="text-[13px] text-ink-3 mt-2">
            {spaces.length} {spaces.length === 1 ? 'space' : 'spaces'} in your knowledge base
          </p>
        </div>
        <CreateSpaceDialog />
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-16 bg-paper-2 border border-border rounded-[14px]">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <SpaceGlyph name="Welcome" size="lg" />
          </div>
          <p className="text-[13px] text-ink-2">No spaces yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => {
            const count = space._count?.pages ?? 0
            return (
              <Link
                key={space.id}
                href={`/spaces/${space.id}`}
                className="group block bg-paper-2 border border-border rounded-[14px] p-5 hover:bg-paper-3 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3 mb-4">
                  <SpaceGlyph name={space.name} type={space.type} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[17px] text-foreground truncate">
                      {space.name}
                    </div>
                    <div className="mono text-[10.5px] uppercase tracking-wider text-ink-3 mt-0.5">
                      {space.type.toLowerCase()}
                    </div>
                  </div>
                </div>

                {space.description && (
                  <p className="text-[13px] text-ink-2 mb-4 line-clamp-2">{space.description}</p>
                )}

                <div className="flex items-center gap-3 text-[12px] text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {count} {count === 1 ? 'page' : 'pages'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    updated {prettyTime(space.updatedAt)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
