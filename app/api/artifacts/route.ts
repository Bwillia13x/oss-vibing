import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs/promises'

// Streams a server-side artifact file for download. Restricted to /tmp/madlab-dcf-* paths.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const p = url.searchParams.get('path') || ''
  // Basic validation: only allow our known temp directory prefixes
  if (!(p.startsWith('/tmp/madlab-dcf-') || p.startsWith('/tmp/madlab-run-'))) {
      return NextResponse.json({ error: 'Invalid artifact path' }, { status: 400 })
    }
    // Resolve and normalize to prevent traversal and ensure it still matches prefix
    const resolved = path.resolve(p)
  if (!(resolved.startsWith('/tmp/madlab-dcf-') || resolved.startsWith('/tmp/madlab-run-'))) {
      return NextResponse.json({ error: 'Invalid artifact path' }, { status: 400 })
    }
  const data = await fs.readFile(resolved)
    const filename = path.basename(resolved)
    const ext = path.extname(filename).toLowerCase()
  let contentType = 'application/octet-stream'
  if (ext === '.csv') contentType = 'text/csv; charset=utf-8'
  else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  else if (ext === '.json') contentType = 'application/json; charset=utf-8'
  const body = new Blob([new Uint8Array(data)], { type: contentType })
  return new Response(body, {
      status: 200,
      headers: {
    'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Artifact download error:', err)
    return NextResponse.json({ error: 'Failed to retrieve artifact' }, { status: 500 })
  }
}
