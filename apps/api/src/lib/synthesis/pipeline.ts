// End-to-end orchestration: embed pages (incremental), cluster, and
// generate synthesis drafts per cluster. Each stage is separate so
// routes can invoke just the piece they need.

import crypto from 'node:crypto'
import { prisma } from '../prisma.js'
import { extractPlainText } from './text.js'
import { embed, hashContent } from './embedding.js'
import { dbscan } from './cluster.js'
import { synthesize, type SynthesisInput } from './llm.js'

const DEFAULT_EPS = 0.35
const DEFAULT_MIN_POINTS = 3

export interface EmbedReport {
  total: number
  embedded: number
  skipped: number
}

export async function embedSpace(spaceId: string): Promise<EmbedReport> {
  const pages = await prisma.page.findMany({
    where: { spaceId },
    select: { id: true, title: true, content: true, embedding: true },
  })
  let embedded = 0
  let skipped = 0
  for (const page of pages) {
    const text = `${page.title}\n\n${extractPlainText(page.content)}`.trim()
    if (!text) {
      skipped += 1
      continue
    }
    const hash = hashContent(text)
    if (page.embedding && page.embedding.contentHash === hash) {
      skipped += 1
      continue
    }
    const { model, vector } = await embed(text)
    await prisma.pageEmbedding.upsert({
      where: { pageId: page.id },
      create: { pageId: page.id, model, contentHash: hash, vector },
      update: { model, contentHash: hash, vector },
    })
    embedded += 1
  }
  return { total: pages.length, embedded, skipped }
}

export interface GenerateOptions {
  eps?: number
  minPoints?: number
}

export interface GenerateReport {
  pagesConsidered: number
  clusters: number
  syntheses: number
  skippedExisting: number
}

export async function generateSyntheses(
  spaceId: string,
  opts: GenerateOptions = {},
): Promise<GenerateReport> {
  const eps = opts.eps ?? DEFAULT_EPS
  const minPoints = opts.minPoints ?? DEFAULT_MIN_POINTS

  const embeddings = await prisma.pageEmbedding.findMany({
    where: { page: { spaceId } },
    select: {
      pageId: true,
      vector: true,
      page: { select: { id: true, title: true, content: true } },
    },
  })
  if (embeddings.length < minPoints) {
    return { pagesConsidered: embeddings.length, clusters: 0, syntheses: 0, skippedExisting: 0 }
  }

  const { clusters } = dbscan(
    embeddings.map((e) => ({ id: e.pageId, vector: e.vector })),
    { eps, minPoints },
  )

  const existing = await prisma.synthesis.findMany({
    where: { spaceId },
    select: { clusterKey: true },
  })
  const existingKeys = new Set(existing.map((s) => s.clusterKey))

  const byId = new Map(embeddings.map((e) => [e.pageId, e.page]))
  let created = 0
  let skippedExisting = 0
  for (const pageIds of clusters) {
    const key = clusterKey(pageIds)
    if (existingKeys.has(key)) {
      skippedExisting += 1
      continue
    }
    const notes: SynthesisInput[] = pageIds
      .map((id) => {
        const p = byId.get(id)
        if (!p) return null
        return { id: p.id, title: p.title, text: extractPlainText(p.content) }
      })
      .filter((n): n is SynthesisInput => n !== null)
    if (notes.length < minPoints) continue

    const draft = await synthesize(notes)
    await prisma.synthesis.create({
      data: {
        spaceId,
        title: draft.title,
        summary: draft.summary,
        contradictions: draft.contradictions,
        openQuestions: draft.openQuestions,
        clusterKey: key,
        sources: {
          create: notes.map((n) => ({
            pageId: n.id,
            snippet: n.text.slice(0, 240),
          })),
        },
      },
    })
    created += 1
  }

  return {
    pagesConsidered: embeddings.length,
    clusters: clusters.length,
    syntheses: created,
    skippedExisting,
  }
}

function clusterKey(pageIds: string[]): string {
  const sorted = [...pageIds].sort()
  return crypto.createHash('sha256').update(sorted.join('|')).digest('hex').slice(0, 32)
}
