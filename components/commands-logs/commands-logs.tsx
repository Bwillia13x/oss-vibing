'use client'

import type { Command } from './types'
import { Panel, PanelHeader } from '@/components/panels/panels'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SquareChevronRight } from 'lucide-react'
import { useEffect, useRef, memo } from 'react'
import { useVirtualScroll } from '@/lib/use-virtual-scroll'

interface Props {
  className?: string
  commands: Command[]
}

// Memoize command rendering for performance
const CommandLogItem = memo(function CommandLogItem({ command }: { command: Command }) {
  const date = new Date(command.startedAt).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const line = `${command.command} ${command.args.join(' ')}`
  const body = command.logs?.map((log) => log.data).join('') || ''
  
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm">
      {`[${date}] ${line}\n${body}`}
    </pre>
  )
})

export const CommandsLogs = memo(function CommandsLogs(props: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // Use virtual scrolling for large command lists (>50 items)
  const useVirtual = props.commands.length > 50
  const itemHeight = 80 // Approximate height per command
  const containerHeight = 600 // Approximate container height

  const { virtualItems, totalHeight, scrollRef } = useVirtualScroll({
    itemCount: props.commands.length,
    itemHeight,
    containerHeight,
    overscan: 5,
  })

  useEffect(() => {
    if (!useVirtual) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [props.commands, useVirtual])

  return (
    <Panel className={props.className}>
      <PanelHeader>
        <SquareChevronRight className="mr-2 w-4" />
        <span className="font-mono uppercase font-semibold">
          Sandbox Remote Output
        </span>
      </PanelHeader>
      <div className="h-[calc(100%-2rem)]">
        <ScrollArea className="h-full">
          {useVirtual ? (
            // Virtual scrolling for large lists
            <div ref={scrollRef} style={{ height: containerHeight, overflow: 'auto' }}>
              <div style={{ height: totalHeight, position: 'relative' }}>
                {virtualItems.map(({ index, start }) => (
                  <div
                    key={props.commands[index].cmdId}
                    style={{
                      position: 'absolute',
                      top: start,
                      width: '100%',
                      padding: '0.5rem',
                    }}
                  >
                    <CommandLogItem command={props.commands[index]} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Regular rendering for small lists
            <div className="p-2 space-y-2">
              {props.commands.map((command) => (
                <CommandLogItem key={command.cmdId} command={command} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </div>
    </Panel>
  )
})
