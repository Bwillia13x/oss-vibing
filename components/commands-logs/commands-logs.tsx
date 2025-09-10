'use client'

import type { Command } from './types'
import { Panel, PanelHeader } from '@/components/panels/panels'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SquareChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  className?: string
  commands: Command[]
}

export function CommandsLogs(props: Readonly<Props>) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showStdout, setShowStdout] = useState(true)
  const [showStderr, setShowStderr] = useState(true)

  // Initialize visibility from URL/localStorage on mount
  useEffect(() => {
    try {
      const STORAGE_KEY = 'madlab:logs:streams'
      const params = new URLSearchParams(window.location.search)
      const qs = params.get('logs')
      if (qs) {
        const parts = new Set(qs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
        setShowStdout(parts.has('stdout'))
        setShowStderr(parts.has('stderr'))
      } else {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const saved = JSON.parse(raw) as { stdout?: boolean; stderr?: boolean }
          setShowStdout(typeof saved.stdout === 'boolean' ? saved.stdout : true)
          setShowStderr(typeof saved.stderr === 'boolean' ? saved.stderr : true)
        }
      }
    } catch {}
  }, [])

  // Persist and mirror to URL when filters change
  useEffect(() => {
    try {
      const STORAGE_KEY = 'madlab:logs:streams'
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stdout: showStdout, stderr: showStderr }))
      const url = new URL(window.location.href)
      const selected: string[] = []
      if (showStdout) selected.push('stdout')
      if (showStderr) selected.push('stderr')
      if (selected.length === 2) {
        url.searchParams.delete('logs')
      } else {
        url.searchParams.set('logs', selected.join(','))
      }
      window.history.replaceState(null, '', url.toString())
    } catch {}
  }, [showStdout, showStderr])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [props.commands])

  return (
    <Panel className={props.className}>
      <PanelHeader>
        <SquareChevronRight className="mr-2 w-4" />
        <span className="font-mono uppercase font-semibold">
          Sandbox Remote Output
        </span>
        {props.commands.some(c => (c.logs || []).some(l => l.stream === 'stderr')) && (
          <span className="ml-2 rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-mono tracking-wide">
            STDERR
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono flex items-center gap-1">
            <input type="checkbox" checked={showStdout} onChange={() => setShowStdout(v => !v)} />
            <span>stdout</span>
          </label>
          <label className="text-[10px] font-mono flex items-center gap-1">
            <input type="checkbox" checked={showStderr} onChange={() => setShowStderr(v => !v)} />
            <span>stderr</span>
          </label>
        </div>
      </PanelHeader>
      <div className="h-[calc(100%-2rem)]">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
            {props.commands.map((command) => {
              const date = new Date(command.startedAt).toLocaleTimeString(
                'en-US',
                {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }
              )

              const line = `${command.command} ${command.args.join(' ')}`
              const filteredLogs = (command.logs || []).filter(l => (l.stream === 'stdout' && showStdout) || (l.stream === 'stderr' && showStderr))
              const body = filteredLogs.map((log) => log.data).join('') || ''
              const hasStderr = (command.logs || []).some(l => l.stream === 'stderr')
              return (
                <pre
                  key={command.cmdId}
                  className="whitespace-pre-wrap font-mono text-sm"
                >
                  {`[${date}] ${line}\n`}
                  {hasStderr && showStderr && (
                    <div className="mb-2 rounded border border-red-200 bg-red-50 text-red-700 px-2 py-1 text-xs">
                      This command produced stderr output. Review logs below.
                    </div>
                  )}
                  {body}
                </pre>
              )
            })}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    </Panel>
  )
}
