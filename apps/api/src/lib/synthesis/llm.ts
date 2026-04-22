// Synthesis LLM call. OpenAI-compatible chat completion. When no API key is
// configured, falls back to an extractive heuristic so the full pipeline
// still produces output in local dev.

const MODEL = process.env.SYNTHESIS_MODEL || 'gpt-4o-mini'
const BASE_URL = process.env.SYNTHESIS_BASE_URL || 'https://api.openai.com/v1'
const API_KEY = process.env.SYNTHESIS_API_KEY || process.env.EMBEDDING_API_KEY

export interface SynthesisDraft {
  title: string
  summary: string
  contradictions: string
  openQuestions: string
}

export interface SynthesisInput {
  id: string
  title: string
  text: string
}

export async function synthesize(notes: SynthesisInput[]): Promise<SynthesisDraft> {
  if (!API_KEY) return extractiveFallback(notes)

  const prompt = buildPrompt(notes)
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You synthesize clusters of related notes. Ground every claim in a direct quote. Reply as JSON with keys: title, summary, contradictions, openQuestions.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`synthesis request failed: ${res.status} ${msg}`)
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  const raw = data.choices[0]?.message?.content ?? '{}'
  return parseDraft(raw, notes)
}

function buildPrompt(notes: SynthesisInput[]): string {
  const body = notes
    .map((n, i) => `Note ${i + 1} — "${n.title}" (id=${n.id}):\n${n.text.slice(0, 2000)}`)
    .join('\n\n---\n\n')
  return [
    'Cluster of related notes:',
    body,
    '',
    'Produce:',
    '- title: a 6-10 word label for the cluster theme',
    '- summary: 3-6 sentences of shared threads, each claim followed by a direct quote in "quotes"',
    '- contradictions: explicit disagreements between notes, or "None"',
    '- openQuestions: unresolved questions raised by the cluster, or "None"',
  ].join('\n')
}

function parseDraft(raw: string, notes: SynthesisInput[]): SynthesisDraft {
  try {
    const obj = JSON.parse(raw) as Partial<SynthesisDraft>
    return {
      title: obj.title?.trim() || defaultTitle(notes),
      summary: obj.summary?.trim() || '',
      contradictions: obj.contradictions?.trim() || 'None',
      openQuestions: obj.openQuestions?.trim() || 'None',
    }
  } catch {
    return extractiveFallback(notes)
  }
}

function extractiveFallback(notes: SynthesisInput[]): SynthesisDraft {
  const summary = notes
    .map((n) => {
      const firstSentence = n.text.split(/(?<=[.!?])\s+/)[0]?.slice(0, 200) ?? ''
      return `"${firstSentence}" — ${n.title}`
    })
    .join(' ')
  return {
    title: defaultTitle(notes),
    summary: summary || 'No content available.',
    contradictions: 'None (auto-generated without LLM)',
    openQuestions: 'None (auto-generated without LLM)',
  }
}

function defaultTitle(notes: SynthesisInput[]): string {
  const titles = notes.map((n) => n.title).filter(Boolean)
  if (titles.length === 0) return 'Untitled cluster'
  return `Cluster: ${titles.slice(0, 2).join(' + ')}${titles.length > 2 ? ` +${titles.length - 2}` : ''}`
}
