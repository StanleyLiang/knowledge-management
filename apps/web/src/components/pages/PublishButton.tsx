'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Building2, Users, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Visibility = 'team' | 'org' | 'public'

const VISIBILITY_OPTIONS: {
  id: Visibility
  icon: typeof Users
  label: string
  sub: string
}[] = [
  { id: 'team', icon: Users, label: 'My team', sub: 'Only people in this space' },
  { id: 'org', icon: Building2, label: 'Organization', sub: 'Anyone signed in' },
  { id: 'public', icon: Globe, label: 'Public link', sub: 'Anyone with the URL' },
]

interface PublishButtonProps {
  pageId: string
  isPublished: boolean
  nextVersion: number
  versionLabel: string | null
}

export function PublishButton({
  pageId,
  isPublished,
  nextVersion,
  versionLabel,
}: PublishButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useState<Visibility>('team')
  const [notify, setNotify] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      if (isPublished) {
        await api.pages.unpublish(pageId)
      } else {
        await api.pages.publish(pageId)
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isPublished ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-sage-soft px-[11px] py-[5px] text-[12.5px] font-medium text-sage-ink hover:opacity-90 transition-opacity"
          >
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-sage" />
            Live
            {versionLabel && <span className="mono text-[11px] opacity-70">· {versionLabel}</span>}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-[11px] py-[5px] text-[12.5px] font-medium text-background hover:opacity-90 transition-opacity"
          >
            <Globe className="h-3.5 w-3.5" />
            Publish
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[460px] rounded-[18px] p-6 bg-background border border-border shadow-lg gap-0">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'h-[42px] w-[42px] rounded-xl flex items-center justify-center shrink-0',
              isPublished ? 'bg-terracotta-soft text-terracotta' : 'bg-sage-soft text-sage-ink',
            )}
          >
            {isPublished ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="serif text-[22px] font-normal leading-tight pr-6">
              {isPublished ? 'Unpublish this page?' : 'Publish this page'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-ink-2 mt-1.5">
              {isPublished
                ? 'The live version will be hidden. Readers who follow the link will see a 404 until you publish again.'
                : `Create version v${nextVersion} from the current draft and make it the live page for readers.`}
            </DialogDescription>
          </div>
        </div>

        {!isPublished && (
          <>
            <div className="mt-5 bg-paper-2 border border-border rounded-[12px] p-[14px]">
              <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-3 font-semibold mb-2 px-1">
                Visibility
              </div>
              <div className="flex flex-col gap-1">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const selected = opt.id === visibility
                  const Icon = opt.icon
                  return (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] cursor-pointer transition-colors',
                        selected
                          ? 'bg-background border border-terracotta'
                          : 'border border-transparent hover:bg-paper-3',
                      )}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.id}
                        checked={selected}
                        onChange={() => setVisibility(opt.id)}
                        className="accent-terracotta h-3.5 w-3.5"
                      />
                      <Icon className="h-4 w-4 text-ink-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-foreground font-medium leading-tight">
                          {opt.label}
                        </div>
                        <div className="text-[11.5px] text-ink-3 leading-tight mt-0.5">
                          {opt.sub}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="accent-terracotta h-3.5 w-3.5"
              />
              Notify 3 contributors on publish
            </label>
          </>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-[7px] text-[12.5px] text-ink-2 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium disabled:opacity-50 transition-opacity',
              isPublished
                ? 'bg-terracotta text-background hover:opacity-90'
                : 'bg-foreground text-background hover:opacity-90',
            )}
          >
            {isPublished ? (
              'Unpublish page'
            ) : (
              <>
                Publish
                <span className="mono opacity-70">· v{nextVersion}</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
