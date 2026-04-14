import { redirect } from 'next/navigation'
import { api } from '@/lib/api'

export default async function MySpacePage() {
  const spaces = await api.spaces.list()
  const personalSpace = spaces.find((s) => s.type === 'PERSONAL')

  if (personalSpace) {
    redirect(`/spaces/${personalSpace.id}`)
  }

  // No personal space exists — create one
  const newSpace = await api.spaces.create({
    name: 'My Space',
    type: 'PERSONAL',
  })

  redirect(`/spaces/${newSpace.id}`)
}
