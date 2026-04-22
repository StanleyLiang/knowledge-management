import type { Space, SpaceWithPages, PageSummary, Page, PageVersion, PageVersionSummary, PageTemplate, CreateSpaceInput, UpdatePageInput, SearchResult, Synthesis, SynthesisStatus, EmbedReport, GenerateReport, UpdateSynthesisInput } from './types'

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
    create: (spaceId: string, data?: { title?: string; content?: Record<string, unknown>; parentId?: string }) =>
      request<Page>(`/spaces/${spaceId}/pages`, { method: 'POST', body: JSON.stringify(data ?? {}) }),
    update: (id: string, data: UpdatePageInput) =>
      request<Page>(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }),
    publish: (id: string) =>
      request<Page>(`/pages/${id}/publish`, { method: 'POST' }),
    unpublish: (id: string) =>
      request<Page>(`/pages/${id}/unpublish`, { method: 'POST' }),
    versions: (id: string) =>
      request<PageVersionSummary[]>(`/pages/${id}/versions`),
    getVersion: (id: string, versionId: string) =>
      request<PageVersion>(`/pages/${id}/versions/${versionId}`),
    restore: (id: string, versionId: string) =>
      request<Page>(`/pages/${id}/restore/${versionId}`, { method: 'POST' }),
  },
  search: (query: string) =>
    request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),
  templates: {
    list: () => request<PageTemplate[]>('/templates'),
  },
  syntheses: {
    list: (spaceId: string, status?: SynthesisStatus) => {
      const qs = new URLSearchParams({ spaceId })
      if (status) qs.set('status', status)
      return request<Synthesis[]>(`/syntheses?${qs.toString()}`)
    },
    get: (id: string) => request<Synthesis>(`/syntheses/${id}`),
    update: (id: string, data: UpdateSynthesisInput) =>
      request<Synthesis>(`/syntheses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/syntheses/${id}`, { method: 'DELETE' }),
    embed: (spaceId: string) =>
      request<EmbedReport>(`/spaces/${spaceId}/syntheses/embed`, { method: 'POST' }),
    generate: (spaceId: string, opts?: { eps?: number; minPoints?: number }) =>
      request<GenerateReport>(`/spaces/${spaceId}/syntheses/generate`, {
        method: 'POST',
        body: JSON.stringify(opts ?? {}),
      }),
  },
}
