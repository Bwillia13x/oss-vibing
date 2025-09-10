import type { Command, CommandLog } from '@/components/commands-logs/types'
import type { DataPart } from '@/ai/messages/data-parts'
import type { ChatStatus, DataUIPart } from 'ai'
import { useMonitorState } from '@/components/error-monitor/state'
import { useMemo } from 'react'
import { create } from 'zustand'

interface SandboxStore {
  addGeneratedFiles: (files: string[]) => void
  addLog: (data: { sandboxId: string; cmdId: string; log: CommandLog }) => void
  addPaths: (paths: string[]) => void
  addArtifactPaths: (paths: string[]) => void
  chatStatus: ChatStatus
  clearGeneratedFiles: () => void
  commands: Command[]
  generatedFiles: Set<string>
  paths: string[]
  artifactPaths: string[]
  sandboxId?: string
  setChatStatus: (status: ChatStatus) => void
  setSandboxId: (id: string) => void
  setStatus: (status: 'running' | 'stopped') => void
  setUrl: (url: string, uuid: string) => void
  status?: 'running' | 'stopped'
  upsertCommand: (command: Omit<Command, 'startedAt'>) => void
  url?: string
  urlUUID?: string
}

function getBackgroundCommandErrorLines(commands: Command[]) {
  return commands
    .flatMap(({ command, args, background, logs = [] }) =>
      logs.map((log) => ({ command, args, background, ...log }))
    )
    .sort((logA, logB) => logA.timestamp - logB.timestamp)
    .filter((log) => log.stream === 'stderr' && log.background)
}

export function useCommandErrorsLogs() {
  const { commands } = useSandboxStore()
  const errors = useMemo(
    () => getBackgroundCommandErrorLines(commands),
    [commands]
  )
  return { errors }
}

export const useSandboxStore = create<SandboxStore>()((set) => ({
  addGeneratedFiles: (files) =>
    set((state) => ({
      generatedFiles: new Set([...state.generatedFiles, ...files]),
    })),
  addLog: (data) => {
    set((state) => {
      const idx = state.commands.findIndex((c) => c.cmdId === data.cmdId)
      if (idx === -1) {
        console.warn(`Command with ID ${data.cmdId} not found.`)
        return state
      }
      const updatedCmds = [...state.commands]
      updatedCmds[idx] = {
        ...updatedCmds[idx],
        logs: [...(updatedCmds[idx].logs ?? []), data.log],
      }
      return { commands: updatedCmds }
    })
  },
  addPaths: (paths) =>
    set((state) => ({ paths: [...new Set([...state.paths, ...paths])] })),
  addArtifactPaths: (paths) =>
    set((state) => ({ artifactPaths: [...new Set([...(state.artifactPaths ?? []), ...paths])] })),
  chatStatus: 'ready',
  clearGeneratedFiles: () => set(() => ({ generatedFiles: new Set<string>() })),
  commands: [],
  generatedFiles: new Set<string>(),
  paths: [],
  artifactPaths: [],
  setChatStatus: (status) =>
    set((state) =>
      state.chatStatus === status ? state : { chatStatus: status }
    ),
  setSandboxId: (sandboxId) =>
    set(() => ({
      sandboxId,
      status: 'running',
      commands: [],
      paths: [],
  artifactPaths: [],
      url: undefined,
      generatedFiles: new Set<string>(),
    })),
  setStatus: (status) => set(() => ({ status })),
  setUrl: (url, urlUUID) => set(() => ({ url, urlUUID })),
  upsertCommand: (cmd) => {
    set((state) => {
      const existingIdx = state.commands.findIndex((c) => c.cmdId === cmd.cmdId)
      const idx = existingIdx !== -1 ? existingIdx : state.commands.length
      const prev = state.commands[idx] ?? { startedAt: Date.now(), logs: [] }
      const cmds = [...state.commands]
      cmds[idx] = { ...prev, ...cmd }
      return { commands: cmds }
    })
  },
}))

interface FileExplorerStore {
  paths: string[]
  addPath: (path: string) => void
}

export const useFileExplorerStore = create<FileExplorerStore>()((set) => ({
  paths: [],
  addPath: (path) => {
    set((state) => {
      if (!state.paths.includes(path)) {
        return { paths: [...state.paths, path] }
      }
      return state
    })
  },
}))

export function useDataStateMapper() {
  const { addPaths, setSandboxId, setUrl, upsertCommand, addGeneratedFiles } =
    useSandboxStore()
  const { errors } = useCommandErrorsLogs()
  const { setCursor } = useMonitorState()

  const openLogsTab = () => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (url.searchParams.get('tab') !== 'logs') {
          url.searchParams.set('tab', 'logs')
          window.history.replaceState(null, '', url.toString())
        }
      }
    } catch {
      // no-op
    }
  }

  const onCreateSandbox = (data: DataUIPart<DataPart>['data']) => {
    if ('sandboxId' in data && data.sandboxId) {
      setSandboxId(data.sandboxId)
    }
  }

  const onGeneratingFiles = (data: DataUIPart<DataPart>['data']) => {
    if ('status' in data && data.status === 'uploaded') {
      setCursor(errors.length)
      addPaths((data as any).paths)
      addGeneratedFiles((data as any).paths)
    }
  }

  const onRunCommand = (data: DataUIPart<DataPart>['data']) => {
    if (
      'commandId' in data &&
      data.commandId &&
      ('status' in data && (data.status === 'executing' || data.status === 'running'))
    ) {
      upsertCommand({
        background: (data as any).status === 'running',
        sandboxId: (data as any).sandboxId,
        cmdId: (data as any).commandId,
        command: (data as any).command,
        args: (data as any).args,
      })
      openLogsTab()
    }
  }

  const onGetSandboxUrl = (data: DataUIPart<DataPart>['data']) => {
    if ('url' in data && data.url) {
      setUrl(data.url, crypto.randomUUID())
    }
  }

  return (data: DataUIPart<DataPart>) => {
    switch (data.type) {
      case 'data-create-sandbox':
        onCreateSandbox(data.data)
        break
      case 'data-generating-files':
        onGeneratingFiles(data.data)
        break
      case 'data-run-command':
        onRunCommand(data.data)
        break
      case 'data-get-sandbox-url':
        onGetSandboxUrl(data.data)
        break
      default:
        break
    }
  }
}
