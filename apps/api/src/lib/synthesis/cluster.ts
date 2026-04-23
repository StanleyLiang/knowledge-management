// DBSCAN clustering over a set of embedding vectors using cosine distance.
// Pure function — no I/O — so it can be unit-tested and reused in scripts.

export interface ClusterPoint {
  id: string
  vector: number[]
}

export interface ClusterResult {
  clusters: string[][]
  noise: string[]
}

export interface DbscanOptions {
  // Max cosine distance (1 - cosine similarity) for two points to be neighbors.
  eps: number
  // Minimum neighborhood size for a core point.
  minPoints: number
}

export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('vector length mismatch')
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 1
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function dbscan(points: ClusterPoint[], opts: DbscanOptions): ClusterResult {
  const n = points.length
  const labels = new Array<number>(n).fill(-1) // -1 = unclassified, 0 = noise
  let clusterId = 0

  const neighbors = (i: number): number[] => {
    const out: number[] = []
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      if (cosineDistance(points[i].vector, points[j].vector) <= opts.eps) out.push(j)
    }
    return out
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue
    const seeds = neighbors(i)
    if (seeds.length + 1 < opts.minPoints) {
      labels[i] = 0
      continue
    }
    clusterId += 1
    labels[i] = clusterId
    const queue = [...seeds]
    while (queue.length > 0) {
      const j = queue.shift()!
      if (labels[j] === 0) labels[j] = clusterId
      if (labels[j] !== -1) continue
      labels[j] = clusterId
      const more = neighbors(j)
      if (more.length + 1 >= opts.minPoints) {
        for (const k of more) if (labels[k] === -1 || labels[k] === 0) queue.push(k)
      }
    }
  }

  const clusters: string[][] = []
  const noise: string[] = []
  for (let i = 0; i < n; i++) {
    if (labels[i] <= 0) {
      noise.push(points[i].id)
      continue
    }
    const idx = labels[i] - 1
    if (!clusters[idx]) clusters[idx] = []
    clusters[idx].push(points[i].id)
  }
  return { clusters: clusters.filter(Boolean), noise }
}
