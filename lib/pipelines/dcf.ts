export type DcfTask = { kind: 'dcf'; ticker: string; horizon: number; wacc?: number; scenarios?: { base: any; bull?: any; bear?: any } }

export type DcfOutput = {
  assumptions: Record<string, number | string>
  pvByScenario: Record<'base' | 'bull' | 'bear', number>
  sensitivity: Array<{ wacc: number; terminalG: number; value: number }>
  files: string[]
  explain: string
}

export function sanityCheckInputs(task: DcfTask): { ok: boolean; warnings: string[] } {
  const warnings: string[] = []
  if (task.horizon > 10) warnings.push('Horizon > 10y may reduce reliability.')
  if (typeof task.wacc === 'number' && (task.wacc < 4 || task.wacc > 20)) {
    warnings.push('WACC outside [4,20].')
  }
  return { ok: warnings.length === 0, warnings }
}

export async function runDcf(
  task: DcfTask,
  deps: { metrics: { start(): void; stop(): any; label(k: string, v: string | number): void } }
): Promise<DcfOutput> {
  deps.metrics.start()
  const url = process.env.WORKER_URL
  if (url) {
    const res = await fetch(`${url.replace(/\/$/, '')}/dcf`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ticker: task.ticker,
        horizon: task.horizon,
        wacc: task.wacc,
        scenarios: task.scenarios,
      }),
    })
    const out = (await res.json()) as DcfOutput
    deps.metrics.stop()
    return out
  }

  // Fallback: simple DCF math with unit cash flow baseline.
  // We compute PV as the present value of a growing annuity plus terminal value.
  // CF_1 = CF0 * (1+g); CF_t = CF_1 * (1+g)^(t-1)
  // PV_flows = CF_1 * (1 - ((1+g)/(1+r))^N) / (r - g)
  // TV at N = CF_{N+1} / (r - g); PV_TV = TV / (1+r)^N
  // Use CF0 = 1.0 (unit cash flow), giving a dimensionless multiple.
  const N = Math.max(1, Math.floor(task.horizon))
  const rDefault = (task.wacc ?? 10) / 100
  const CF0 = 1.0
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
  const pv = (rPct: number, gPct: number) => {
    const r = clamp(rPct, 0.01, 0.5)
    const g = clamp(gPct, -0.05, 0.04)
    if (g >= r) {
      // Avoid divide-by-zero or exploding terminal value; nudge g below r
      const gSafe = r - 0.001
      return pv(r, gSafe)
    }
    const CF1 = CF0 * (1 + g)
    const k = (1 + g) / (1 + r)
    const pvFlows = CF1 * (1 - Math.pow(k, N)) / (r - g)
    const CFN1 = CF1 * Math.pow(1 + g, N)
    const TV = CFN1 / (r - g)
    const pvTV = TV / Math.pow(1 + r, N)
    return pvFlows + pvTV
  }
  const scenarioG = {
    base: 0.02,
    bull: 0.03,
    bear: 0.00,
  }
  const pvByScenario = {
    base: Number(pv(rDefault, scenarioG.base).toFixed(2)),
    bull: Number(pv(rDefault, scenarioG.bull).toFixed(2)),
    bear: Number(pv(rDefault, scenarioG.bear).toFixed(2)),
  }
  const sensitivity: Array<{ wacc: number; terminalG: number; value: number }> = []
  for (let w = 6; w <= 12; w += 1) {
    for (let g = 0; g <= 2.5; g += 0.5) {
      const val = pv(w / 100, g / 100)
      sensitivity.push({ wacc: w, terminalG: Number(g.toFixed(1)), value: Number(val.toFixed(2)) })
    }
  }
  const assumptions = {
    ticker: task.ticker,
    horizon: N,
    wacc: Math.round(rDefault * 10000) / 100,
    cf0: CF0,
    notes: 'Unit-cash-flow DCF. Values are multiples of CF0.',
  }
  // Produce CSV artifacts to make the result useful, stored in tmp and returned by path
  const files: string[] = []
  try {
    const toCsv = (rows: Array<Record<string, any>>) => {
      if (!rows.length) return ''
  const headerSet: Set<string> = rows.reduce((s: Set<string>, r) => {
        Object.keys(r).forEach(k => s.add(k))
        return s
      }, new Set<string>())
  const headers = Array.from(headerSet)
      const esc = (v: unknown) => {
        let s: string
        if (v == null) s = ''
        else if (typeof v === 'string') s = v
        else s = JSON.stringify(v)
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
      }
      return [headers.join(','), ...rows.map(r => headers.map(h => esc((r as any)[h])).join(','))].join('\n')
    }
    const assumptionsCsv = toCsv(Object.entries(assumptions).map(([k, v]) => ({ key: k, value: v })))
    const sensitivityCsv = toCsv(sensitivity.map(r => ({ wacc: r.wacc, terminalG: r.terminalG, value: r.value })))
    const base = `/tmp/madlab-dcf-${Date.now()}`
    const fs = await import('fs/promises')
    await fs.mkdir(base, { recursive: true })
    await fs.writeFile(`${base}/assumptions.csv`, assumptionsCsv, 'utf8')
    await fs.writeFile(`${base}/sensitivity.csv`, sensitivityCsv, 'utf8')
    files.push(`${base}/assumptions.csv`, `${base}/sensitivity.csv`)
  } catch {}
  deps.metrics.stop()
  return {
    assumptions,
    pvByScenario,
    sensitivity,
    files,
    explain: 'DCF computed locally (unit cash flow baseline). Start the Python worker and set WORKER_URL for live fundamentals and exports.',
  }
}
