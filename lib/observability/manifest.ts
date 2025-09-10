import fs from 'node:fs/promises'
import path from 'node:path'

export type RunManifest = {
  id: string
  kind: string
  inputs?: Record<string, any>
  previewUrl?: string
  artifacts?: string[]
  citations?: string[]
  metrics: {
    model: string
    tokens: number
    cost: number
    latencyMs: number
    cacheHit: boolean
  }
  startedAt: string
  finishedAt: string
}

export async function writeRunManifest(manifest: RunManifest): Promise<string> {
  const base = `/tmp/madlab-run-${Date.now()}`
  const file = path.join(base, `${manifest.id}.json`)
  await fs.mkdir(base, { recursive: true })
  await fs.writeFile(file, JSON.stringify(manifest, null, 2), 'utf8')
  return file
}
