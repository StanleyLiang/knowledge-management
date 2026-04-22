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

// Deterministic hashed bag-of-words stub. Only used when no API key is
// configured. Counts unigrams (non-stopword) into hashed buckets, so two
// documents about the same topic share vector mass in overlapping buckets
// and produce a low cosine distance — enough for clustering to behave
// meaningfully in local testing.
const STUB_DIM = 256
const STUB_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'in', 'on', 'to', 'for',
  'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'by', 'at',
  'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'you', 'your',
  'they', 'their', 'them', 'he', 'she', 'his', 'her', 'from', 'into', 'per',
  'not', 'no', 'so', 'do', 'does', 'did', 'have', 'has', 'had', 'can', 'will',
  'would', 'should', 'may', 'might', 'one', 'two', 'three',
])

function stubEmbedding(text: string): number[] {
  const vec = new Array<number>(STUB_DIM).fill(0)
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STUB_STOPWORDS.has(t))
  for (const token of tokens) {
    const h = crypto.createHash('md5').update(token).digest()
    vec[h.readUInt32BE(0) % STUB_DIM] += 1
  }
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}
