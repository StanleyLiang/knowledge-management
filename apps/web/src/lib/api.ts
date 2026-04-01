import type { Space, SpaceWithPages, PageSummary, Page, CreateSpaceInput, UpdatePageInput } from './types'

const BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL || 'http://localhost:3001') + '/api'
  : '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  spaces: {
    list: () => request<Space[]>('/spaces'),
    get: (id: string) => request<SpaceWithPages>(`/spaces/${id}`),
    create: (data: CreateSpaceInput) =>
      request<Space>('/spaces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateSpaceInput>) =>
      request<Space>(`/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/spaces/${id}`, { method: 'DELETE' }),
  },
  pages: {
    list: (spaceId: string) => request<PageSummary[]>(`/spaces/${spaceId}/pages`),
    get: (id: string) => request<Page>(`/pages/${id}`),
    create: (spaceId: string, data?: { title?: string }) =>
      request<Page>(`/spaces/${spaceId}/pages`, { method: 'POST', body: JSON.stringify(data ?? {}) }),
    update: (id: string, data: UpdatePageInput) =>
      request<Page>(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }),
  },
}
