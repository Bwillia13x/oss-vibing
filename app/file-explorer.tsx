'use client'

import { FileExplorer as FileExplorerComponent } from '@/components/file-explorer/file-explorer'
import { useSandboxStore } from './state'

interface Props {
  readonly className: string
}

export function FileExplorer({ className }: Props) {
  const { sandboxId, status, paths, artifactPaths } = useSandboxStore()
  const merged = [
    ...paths,
    ...artifactPaths.map((p) => (p.startsWith('/') ? `/artifacts${p}` : `/artifacts/${p}`)),
  ]
  return (
    <FileExplorerComponent
      className={className}
      disabled={status === 'stopped'}
      sandboxId={sandboxId}
      paths={merged}
    />
  )
}
