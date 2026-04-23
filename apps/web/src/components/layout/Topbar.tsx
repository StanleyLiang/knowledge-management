import Link from 'next/link'
import {
  Share2,
  Eye,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpaceGlyph } from '@/components/atoms/SpaceGlyph'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { VersionHistoryButton } from '@/components/pages/VersionHistoryButton'
import { PublishButton } from '@/components/pages/PublishButton'
import type { Page, Space } from '@/lib/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface TopbarProps {
  space: Pick<Space, 'id' | 'name' | 'type'>
  page: Pick<Page, 'id' | 'title' | 'status' | 'author' | 'publishedVersion' | 'publishedVersionId'>
  mode: 'read' | 'edit'
}

export function Topbar({ space, page, mode }: TopbarProps) {
  const isPublished = page.status === 'PUBLISHED'
  const versionLabel = page.publishedVersion ? `v${page.publishedVersion.version}` : null

  return (
    <header className="h-[52px] px-5 border-b border-border bg-background flex items-center gap-[14px]">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 min-w-0 flex-shrink overflow-hidden text-[13px] text-ink-3"
      >
        <Link
          href={`/spaces/${space.id}`}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <SpaceGlyph name={space.name} type={space.type} size="sm" />
          <span>{space.name}</span>
        </Link>
        <span aria-hidden="true" className="text-ink-3/60">/</span>
        <span
          className="font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap min-w-0"
          title={page.title}
        >
          {page.title}
        </span>
      </nav>

      <div className="flex-1" />

      <div className="inline-flex items-center rounded-lg bg-paper-3 p-[2px] text-[12.5px]">
        <Link
          href={`/pages/${page.id}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-colors',
            mode === 'read'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-ink-2 hover:text-foreground',
          )}
          aria-current={mode === 'read' ? 'page' : undefined}
        >
          <Eye className="h-3.5 w-3.5" />
          Read
        </Link>
        <Link
          href={`/pages/${page.id}/edit`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-colors',
            mode === 'edit'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-ink-2 hover:text-foreground',
          )}
          aria-current={mode === 'edit' ? 'page' : undefined}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      {page.author && (
        <div className="flex items-center">
          <Avatar className="h-6 w-6 ring-2 ring-background">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(page.author)}&radius=50&backgroundColor=e8c4a0`}
              alt={page.author}
            />
            <AvatarFallback className="text-[10px]">{getInitials(page.author)}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <VersionHistoryButton
        pageId={page.id}
        pageTitle={page.title}
        publishedVersionId={page.publishedVersionId}
      />

      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-[11px] py-[5px] text-[12.5px] text-ink-2 hover:text-foreground transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      <PublishButton
        pageId={page.id}
        isPublished={isPublished}
        nextVersion={(page.publishedVersion?.version ?? 0) + 1}
        versionLabel={versionLabel}
      />
    </header>
  )
}
