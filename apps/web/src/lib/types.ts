export interface Space {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: { pages: number }
}

export interface SpaceWithPages extends Space {
  pages: PageSummary[]
}

export interface PageSummary {
  id: string
  title: string
  status: string
  spaceId: string
  createdAt: string
  updatedAt: string
}

export interface Page extends PageSummary {
  content: Record<string, unknown> | null
}

export interface CreateSpaceInput {
  name: string
  description?: string
}

export interface UpdatePageInput {
  title?: string
  content?: Record<string, unknown>
}
