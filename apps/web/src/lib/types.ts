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
  author: string | null
  spaceId: string
  publishedVersionId: string | null
  createdAt: string
  updatedAt: string
}

export interface PageVersion {
  id: string
  pageId: string
  version: number
  title: string
  content: Record<string, unknown>
  createdAt: string
}

export interface PageVersionSummary {
  id: string
  pageId: string
  version: number
  title: string
  author: string | null
  createdAt: string
}

export interface Page extends PageSummary {
  content: Record<string, unknown> | null
  publishedVersion: PageVersion | null
}

export interface CreateSpaceInput {
  name: string
  description?: string
}

export interface UpdatePageInput {
  title?: string
  content?: Record<string, unknown>
}

export interface PageTemplate {
  id: string
  name: string
  description: string | null
  icon: string | null
  content: Record<string, unknown>
  sortOrder: number
}

export interface SearchResult {
  id: string
  title: string
  status: string
  spaceId: string
  spaceName: string
  createdAt: string
  updatedAt: string
}
