// Embedding provider. Supports OpenAI-compatible endpoints (OpenAI, Ollama
// via `ollama serve --openai`, or any compatible gateway). Falls back to a
// deterministic hash-based stub when no provider is configured so the
// feature still runs end-to-end in local dev without API keys.

import crypto from 'node:crypto'

const MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
const BASE_URL = process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1'
const API_KEY = process.env.EMBEDDING_API_KEY

export interface EmbeddingResult {
  model: string
  vector: number[]
}

export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

export async function embed(text: string): Promise<EmbeddingResult> {
  if (!API_KEY) return { model: `stub:${MODEL}`, vector: stubEmbedding(text) }

  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, input: text.slice(0, 8000) }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`embedding request failed: ${res.status} ${msg}`)
  }
  const data = (await res.json()) as { data: { embedding: number[] }[] }
  return { model: MODEL, vector: data.data[0].embedding }
}

// Deterministic 128-dim stub: hashed-trigram bag-of-words. Only used when
// no API key is configured. Produces stable, content-dependent vectors so
// that clustering still behaves meaningfully during local testing.
const STUB_DIM = 128

function stubEmbedding(text: string): number[] {
  const vec = new Array<number>(STUB_DIM).fill(0)
  const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  for (let i = 0; i < tokens.length; i++) {
    const gram = tokens.slice(i, i + 3).join(' ')
    if (!gram) continue
    const h = crypto.createHash('md5').update(gram).digest()
    const idx = h.readUInt32BE(0) % STUB_DIM
    const sign = (h[4] & 1) === 0 ? 1 : -1
    vec[idx] += sign
  }
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}
