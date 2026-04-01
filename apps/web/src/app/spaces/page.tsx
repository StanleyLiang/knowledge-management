import Link from 'next/link'
import { Folder } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreateSpaceDialog } from '@/components/spaces/CreateSpaceDialog'

export const dynamic = 'force-dynamic'

export default async function SpacesPage() {
  const spaces = await api.spaces.list()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Spaces</h1>
        <CreateSpaceDialog />
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No spaces yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <Link key={space.id} href={`/spaces/${space.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-blue-500" />
                    {space.name}
                  </CardTitle>
                  {space.description && (
                    <CardDescription>{space.description}</CardDescription>
                  )}
                  <CardDescription>
                    {space._count?.pages ?? 0} page{(space._count?.pages ?? 0) !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
