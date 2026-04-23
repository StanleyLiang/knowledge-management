import { api } from '@/lib/api'
import { SynthesesPanel } from '@/components/syntheses/SynthesesPanel'

export const dynamic = 'force-dynamic'

export default async function SynthesesPage() {
  const spaces = await api.spaces.list()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Syntheses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Automatically generated summaries of clusters of related notes.
        </p>
      </div>
      {spaces.length === 0 ? (
        <p className="text-muted-foreground text-sm">Create a space first to generate syntheses.</p>
      ) : (
        <SynthesesPanel spaces={spaces} />
      )}
    </div>
  )
}
