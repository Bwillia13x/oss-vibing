import { PriceAdapter, PricePoint } from '../adapters'
import { getCached } from '../shared-cache'

type Range = '1d' | '1m' | '1y' | '5y' | '10y'

function getFromTo(range: Range) {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = new Date(end)
  switch (range) {
    case '1d':
      start.setUTCDate(end.getUTCDate() - 1)
      break
    case '1m':
      start.setUTCMonth(end.getUTCMonth() - 1)
      break
    case '1y':
      start.setUTCFullYear(end.getUTCFullYear() - 1)
      break
    case '5y':
      start.setUTCFullYear(end.getUTCFullYear() - 5)
      break
    case '10y':
      start.setUTCFullYear(end.getUTCFullYear() - 10)
      break
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(start), to: fmt(end) }
}

export class PolygonPriceAdapter implements PriceAdapter {
  constructor(private readonly apiKey = process.env.POLYGON_API_KEY) {}

  async getPrices({ ticker, range, metric = 'close' }: { ticker: string; range: Range; metric?: 'close' | 'total_return' }): Promise<PricePoint[]> {
  const key = `polygon:${ticker}:${range}:${metric}`
    let ttlMs = 24 * 60 * 60_000
    if (range === '1d') {
      ttlMs = 5 * 60_000
    } else if (range === '1m') {
      ttlMs = 60 * 60_000
    }
    return getCached(key, ttlMs, async () => {
      if (!this.apiKey) {
        // Graceful fallback when no API key set: return an empty series
        return []
      }

      const { from, to } = getFromTo(range)
      // Use 1 day bars for >= 1m; 5 minute for 1d
      const multiplier = range === '1d' ? 5 : 1
      const timespan = range === '1d' ? 'minute' : 'day'

      const url = new URL(`https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${multiplier}/${timespan}/${from}/${to}`)
      url.searchParams.set('adjusted', 'true')
      url.searchParams.set('sort', 'asc')
      url.searchParams.set('apiKey', this.apiKey)

      const res = await fetch(url.toString(), { next: { revalidate: 0 } })
      if (!res.ok) {
        return []
      }
      const json: { results?: Array<{ t: number; c: number; o: number; v: number; vw?: number; }>; resultsCount?: number } = await res.json()
      const points: PricePoint[] = (json.results ?? []).map((r) => ({
        t: new Date(r.t).toISOString().slice(0, 10),
        v: r.c,
      }))

      if (metric === 'total_return' && points.length > 0) {
        const base = points[0].v || 1
        return points.map((p) => ({ t: p.t, v: (p.v / base) * 100 }))
      }
      return points
    })
  }
}
