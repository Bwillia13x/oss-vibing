import { Sandbox } from '@vercel/sandbox'

export interface SandboxRunner {
  run(
    code: string,
    opts?: { cpuMs?: number; memMb?: number; timeoutMs?: number; allowPackages?: string[] }
  ): Promise<{
    previewUrl: string
    files: string[]
    logs: string[]
    sandboxId?: string
    command?: { cmdId: string; command: string; args: string[] }
  }>
}

function extractDataJSON(code: string): string | null {
  const re = /const\s+data\s*=\s*(\[[\s\S]*?\]);/
  const m = re.exec(code)
  return m ? m[1] : null
}

function extractAnnotationsJSON(code: string): string | null {
  const re = /const\s+annotations\s*=\s*(\[[\s\S]*?\]);/
  const m = re.exec(code)
  return m ? m[1] : null
}

function htmlForChart(dataJSON: string, annotationsJSON?: string | null): string {
  const annotationsLiteral = annotationsJSON ?? '[]'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mad Lab Chart Preview</title>
  <style>body{font-family:ui-sans-serif,system-ui,Arial;margin:20px}</style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/recharts/umd/Recharts.min.js"></script>
  <script>window.process = { env: {} };</script>
  </head>
<body>
  <h3>Mad Lab Chart Preview</h3>
  <div id="root"></div>
  <script>
    const data = ${dataJSON};
    const annotations = ${annotationsLiteral};
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } = Recharts;
    const seriesKeys = Object.keys(data.reduce((acc, r) => { Object.keys(r).forEach(k => { if (k !== 'date' && k !== 'drawdown') acc[k]=1; }); return acc; }, {}));
    const hasDrawdown = data.some(r => 'drawdown' in r);
    const pct = (v) => {
      const n = typeof v === 'string' ? Number(v) : v;
      return typeof n === 'number' && !Number.isNaN(n) ? (n * 100).toFixed(2) + '%' : v;
    };
    const App = () => {
      const allSeries = React.useMemo(() => seriesKeys.concat(hasDrawdown ? ['drawdown'] : []), []);
      const storageKey = React.useMemo(() => {
        try { return 'madlab:series:' + btoa(allSeries.join('|')); } catch { return 'madlab:series:' + allSeries.join('|'); }
      }, [allSeries]);
      const getInitialVisibility = () => {
        // default: all on
        let vis = Object.fromEntries(allSeries.map(k => [k, true]));
        try {
          const params = new URLSearchParams(window.location.search);
          const show = params.get('show');
          const hide = params.get('hide');
          if (show) {
            const on = new Set(show.split(',').map(s => s.trim()).filter(Boolean));
            vis = Object.fromEntries(allSeries.map(k => [k, on.has(k)]));
          } else if (hide) {
            const off = new Set(hide.split(',').map(s => s.trim()).filter(Boolean));
            vis = Object.fromEntries(allSeries.map(k => [k, !off.has(k)]));
          } else {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const saved = JSON.parse(raw);
              if (saved && typeof saved === 'object') {
                for (const k of allSeries) if (Object.prototype.hasOwnProperty.call(saved, k)) vis[k] = !!saved[k];
              }
            }
          }
        } catch {}
        return vis;
      };
  const [visible, setVisible] = React.useState(getInitialVisibility);
      React.useEffect(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(visible));
          const params = new URLSearchParams(window.location.search);
          const on = allSeries.filter(k => visible[k]);
          if (on.length === allSeries.length) {
            // all visible: keep URL clean
            params.delete('show');
            params.delete('hide');
          } else {
            params.set('show', on.join(','));
            params.delete('hide');
          }
          const newUrl = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '');
          window.history.replaceState(null, '', newUrl);
        } catch {}
      }, [visible, storageKey, allSeries]);
       const toggle = (k) => setVisible(v => ({ ...v, [k]: !v[k] }));
       const onLegendClick = (e) => {
         const { dataKey, value } = e || {};
         const key = dataKey || value;
         if (key && allSeries.includes(key)) toggle(key);
       };
      return (
        React.createElement('div', {},
          // Controls
          React.createElement('div', { style: { marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', color: '#6b7280', marginRight: '6px' } }, 'Series:'),
            React.createElement('button', { onClick: () => setVisible(Object.fromEntries(allSeries.map(k => [k, true]))), style: { fontSize: '11px', padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer' } }, 'All'),
            React.createElement('button', { onClick: () => setVisible(Object.fromEntries(allSeries.map(k => [k, false]))), style: { fontSize: '11px', padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb', cursor: 'pointer' } }, 'None'),
            ...allSeries.map((k, i) => React.createElement('label', { key: 'ctl-' + k, style: { fontSize: '12px', color: '#374151', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', checked: !!visible[k], onChange: () => toggle(k) }),
              React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
                React.createElement('span', { style: { width: '10px', height: '10px', backgroundColor: k === 'drawdown' ? '#ef4444' : ['#8884d8','#82ca9d','#ffc658','#ff7300','#413ea0'][i % 5], borderRadius: '2px' } }),
                k
              )
            ))
          ),
          // Chart
          React.createElement('div', { style: { width: '100%', height: 460, maxWidth: '1000px' } },
            React.createElement(ResponsiveContainer, { width: '100%', height: '100%' },
              React.createElement(LineChart, { data },
                React.createElement(CartesianGrid, { strokeDasharray: '3 3' }),
                React.createElement(XAxis, { dataKey: 'date', tickFormatter: v => (typeof v === 'string' ? v.slice(0, 10) : v) }),
                React.createElement(YAxis, null),
                (hasDrawdown && visible['drawdown']) ? React.createElement(YAxis, { yAxisId: 'right', orientation: 'right', tickFormatter: pct }) : null,
                React.createElement(Tooltip, { formatter: (value, name) => {
                  const n = typeof value === 'string' ? Number(value) : value;
                  if (name === 'drawdown') return [pct(n), 'drawdown'];
                  return [n, name];
                }}),
                React.createElement(Legend, { onClick: onLegendClick }),
                ...seriesKeys.filter(k => visible[k]).map((key, i) => React.createElement(Line, { key, type: 'monotone', dataKey: key, stroke: ['#8884d8','#82ca9d','#ffc658','#ff7300','#413ea0'][i % 5] })),
                hasDrawdown && visible['drawdown'] ? React.createElement(Line, { yAxisId: 'right', type: 'monotone', dataKey: 'drawdown', stroke: '#ef4444' }) : null
              )
            )
          ),
          Array.isArray(annotations) ? annotations.map((a, i) =>
            React.createElement(ReferenceLine, { key: 'ann-' + i, x: a, stroke: '#6b7280', strokeDasharray: '3 3', label: { value: String(a), position: 'top', fill: '#6b7280' } })
          ) : null
        )
      );
    };
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
  <p style="color:#6b7280;font-size:12px;margin-top:8px">Not investment advice. For research and educational use.</p>
</body>
</html>`
}

function jsonToCsv(dataJSON: string): string | null {
  try {
    const rows = JSON.parse(dataJSON) as Array<Record<string, string | number>>
    if (!Array.isArray(rows) || rows.length === 0) return null
    const headers: string[] = Array.from(
      rows.reduce((set, r) => {
        Object.keys(r).forEach((k) => set.add(k))
        return set
      }, new Set<string>())
    )
    headers.sort((a, b) => {
      if (a === 'date' && b !== 'date') return -1
      if (b === 'date' && a !== 'date') return 1
      return a.localeCompare(b)
    })
    const toStringSafe = (v: unknown): string => {
      if (v === null || v === undefined) return ''
      const t = typeof v
      if (t === 'number') return (v as number).toString()
      if (t === 'boolean') return (v as boolean).toString()
      if (t === 'string') return v as string
      // For objects/arrays, prefer JSON
      try {
        return JSON.stringify(v)
      } catch {
        // Avoid default [object Object]; fall back to empty string
        return ''
      }
    }
    const esc = (v: unknown) => {
      const s = toStringSafe(v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(',')]
    for (const r of rows) {
      lines.push(headers.map((h) => esc((r as any)[h])).join(','))
    }
    return lines.join('\n')
  } catch {
    return null
  }
}

export function makeSandboxRunner(): SandboxRunner {
  return {
    async run(code: string, _opts = {}) {
      const dataJSON = extractDataJSON(code)
      const annotationsJSON = extractAnnotationsJSON(code)
      const html = dataJSON
        ? htmlForChart(dataJSON, annotationsJSON)
        : '<!DOCTYPE html><html><body><pre>Failed to render chart: could not extract data from code.</pre></body></html>'

      const sandbox = await Sandbox.create({ timeout: 10 * 60 * 1000, ports: [3000] })
      const filesToWrite: { path: string; content: Buffer }[] = [
        { path: 'index.html', content: Buffer.from(html, 'utf8') },
      ]
      const csv = dataJSON ? jsonToCsv(dataJSON) : null
      if (csv) filesToWrite.push({ path: 'data.csv', content: Buffer.from(csv, 'utf8') })
      await sandbox.writeFiles(filesToWrite)

      let serverCmd: { cmdId: string; command: string; args: string[] } | null = null
      try {
        const cmd = await sandbox.runCommand({ cmd: 'npx', args: ['-y', 'http-server', '-p', '3000'], detached: true })
        serverCmd = { cmdId: cmd.cmdId, command: 'npx', args: ['-y', 'http-server', '-p', '3000'] }
      } catch {
        try {
          const cmd = await sandbox.runCommand({ cmd: 'python3', args: ['-m', 'http.server', '3000'], detached: true })
          serverCmd = { cmdId: cmd.cmdId, command: 'python3', args: ['-m', 'http.server', '3000'] }
        } catch {
          const cmd = await sandbox.runCommand({ cmd: 'python', args: ['-m', 'http.server', '3000'], detached: true })
          serverCmd = { cmdId: cmd.cmdId, command: 'python', args: ['-m', 'http.server', '3000'] }
        }
      }

      const previewUrl = sandbox.domain(3000)
      const files = ['index.html']
      if (csv) files.push('data.csv')
      return { previewUrl, files, logs: [], sandboxId: sandbox.sandboxId, command: serverCmd ?? undefined }
    },
  }
}
