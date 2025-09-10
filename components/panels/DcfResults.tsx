"use client"

import { Panel, PanelHeader } from '@/components/panels/panels'
import { cn } from '@/lib/utils'

type Assumptions = Record<string, string | number>
type PVScenarios = Record<string, number>
type SensitivityRow = { wacc: number; terminalG: number; value: number }

interface Props {
  className?: string
  assumptions: Assumptions
  pvByScenario: PVScenarios
  sensitivity: SensitivityRow[]
  artifacts?: string[]
  explain?: string
}

function artifactUrl(path: string): string {
  // If path is already an http(s) URL, return as-is; else proxy via /api/artifacts
  if (/^https?:\/\//i.test(path)) return path
  const u = new URL('/api/artifacts', window.location.origin)
  u.searchParams.set('path', path)
  return u.toString()
}

export function DcfResults({ className, assumptions, pvByScenario, sensitivity, artifacts, explain }: Readonly<Props>) {
  // Build distinct axes for sensitivity
  const waccs = Array.from(new Set(sensitivity.map((r) => r.wacc))).sort((a, b) => a - b)
  const gs = Array.from(new Set(sensitivity.map((r) => r.terminalG))).sort((a, b) => a - b)
  const cell = (w: number, g: number) => sensitivity.find((r) => r.wacc === w && r.terminalG === g)?.value ?? null

  return (
    <Panel className={className}>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase">DCF Results</span>
          {artifacts?.length ? (
            <div className="ml-2 space-x-2">
        {artifacts.map((p) => (
                <a
          key={p}
                  href={artifactUrl(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] underline text-muted-foreground"
                >
                  {p.split('/').pop()}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </PanelHeader>

      <div className="flex-1 overflow-auto p-3 space-y-6">
        {explain ? (
          <p className="text-xs text-muted-foreground">{explain}</p>
        ) : null}

        <section>
          <h3 className="font-mono text-xs uppercase mb-1">Assumptions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(assumptions).map(([k, v]) => (
              <div key={k} className="flex justify-between border rounded-sm px-2 py-1">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-mono text-xs uppercase mb-1">PV by Scenario</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {Object.entries(pvByScenario).map(([name, val]) => (
              <div key={name} className="flex flex-col items-center border rounded-sm px-2 py-2">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-mono text-sm">{val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-mono text-xs uppercase mb-1">Sensitivity (Value multiple)</h3>
          <div className="overflow-auto">
            <table className="min-w-[500px] text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-right">WACC \ g</th>
                  {gs.map((g) => (
                    <th key={g} className="border px-2 py-1 text-right">{g.toFixed(1)}%</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waccs.map((w) => (
                  <tr key={w}>
                    <td className="border px-2 py-1 text-right">{w}%</td>
                    {gs.map((g) => {
                      const v = cell(w, g)
                      return (
                        <td key={g} className={cn('border px-2 py-1 text-right', {
                          'bg-green-50': v != null && v >= 20,
                          'bg-yellow-50': v != null && v >= 10 && v < 20,
                          'bg-red-50': v != null && v < 10,
                        })}>
                          {v == null ? '-' : v.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Panel>
  )
}
