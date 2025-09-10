type Entry<T> = { value: T; expiresAt: number }

const CACHE = new Map<string, Entry<unknown>>()

export async function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const cached = CACHE.get(key) as Entry<T> | undefined
  if (cached && cached.expiresAt > now) return cached.value
  const value = await loader()
  CACHE.set(key, { value, expiresAt: now + ttlMs })
  return value
}
