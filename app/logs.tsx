'use client'

import { memo } from 'react'
import { CommandsLogs } from '@/components/commands-logs/commands-logs'
import { useSandboxStore } from './state'

export const Logs = memo(function Logs(props: { className?: string }) {
  const { commands } = useSandboxStore()
  return <CommandsLogs className={props.className} commands={commands} />
})
