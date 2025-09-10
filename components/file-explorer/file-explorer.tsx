'use client'

import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FileIcon,
} from 'lucide-react'
import { FileContent } from '@/components/file-explorer/file-content'
import useSWR from 'swr'
import { Panel, PanelHeader } from '@/components/panels/panels'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { buildFileTree, type FileNode } from './build-file-tree'
import { useState, useMemo, useEffect, useCallback, memo, useMemo as useReactMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  className: string
  disabled?: boolean
  paths: string[]
  sandboxId?: string
}

export const FileExplorer = memo(function FileExplorer({
  className,
  disabled,
  paths,
  sandboxId,
}: Props) {
  const fileTree = useMemo(() => buildFileTree(paths), [paths])
  const [selected, setSelected] = useState<FileNode | null>(null)
  const [fs, setFs] = useState<FileNode[]>(fileTree)

  useEffect(() => {
    setFs(fileTree)
  }, [fileTree])

  const toggleNodeExpanded = useCallback((nodes: FileNode[], path: string): FileNode[] => {
    return nodes.map((node) => {
      if (node.path === path && node.type === 'folder') {
        return { ...node, expanded: !node.expanded }
      }
      if (node.children) {
        return { ...node, children: toggleNodeExpanded(node.children, path) }
      }
      return node
    })
  }, [])

  const toggleFolder = useCallback((path: string) => {
    setFs((prev) => toggleNodeExpanded(prev, path))
  }, [toggleNodeExpanded])

  const selectFile = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      setSelected(node)
    }
  }, [])

  const renderFileTree = useCallback(
    (nodes: FileNode[], depth = 0) => {
      return nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={depth}
          selected={selected}
          onToggleFolder={toggleFolder}
          onSelectFile={selectFile}
          renderFileTree={renderFileTree}
        />
      ))
    },
    [selected, toggleFolder, selectFile]
  )

  let rightPane: React.ReactNode = null
  if (selected && !disabled) {
    if (selected.path.startsWith('/artifacts')) {
      rightPane = <ArtifactContent path={selected.path.replace('/artifacts', '')} />
    } else if (sandboxId) {
      rightPane = (
        <FileContent sandboxId={sandboxId} path={selected.path.substring(1)} />
      )
    }
  }

  return (
    <Panel className={className}>
      <PanelHeader>
        <FileIcon className="w-4 mr-2" />
  <span className="font-mono uppercase font-semibold">Filesystem</span>
        {selected && !disabled && (
          <span className="ml-auto text-gray-500">{selected.path}</span>
        )}
      </PanelHeader>

      <div className="flex text-sm h-[calc(100%-2rem-1px)]">
        <ScrollArea className="w-1/4 border-r border-primary/18 flex-shrink-0">
          <div>{renderFileTree(fs)}</div>
        </ScrollArea>
        {rightPane && (
          <ScrollArea className="w-3/4 flex-shrink-0">
            {rightPane}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </Panel>
  )
})

// Memoized file tree node component
const FileTreeNode = memo(function FileTreeNode({
  node,
  depth,
  selected,
  onToggleFolder,
  onSelectFile,
  renderFileTree,
}: {
  node: FileNode
  depth: number
  selected: FileNode | null
  onToggleFolder: (path: string) => void
  onSelectFile: (node: FileNode) => void
  renderFileTree: (nodes: FileNode[], depth: number) => React.ReactNode
}) {
  const handleClick = useCallback(() => {
    if (node.type === 'folder') {
      onToggleFolder(node.path)
    } else {
      onSelectFile(node)
    }
  }, [node, onToggleFolder, onSelectFile])

  const indentClass = useReactMemo(() => getIndentClass(depth), [depth])

  return (
    <div>
      <button
        type="button"
        className={cn(
          `w-full text-left flex items-center py-0.5 px-1 hover:bg-gray-100 cursor-pointer focus:outline-none`,
          indentClass,
          { 'bg-gray-200/80': selected?.path === node.path }
        )}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {node.expanded ? (
              <ChevronDownIcon className="w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="w-4 mr-1" />
            )}
            <FolderIcon className="w-4 mr-2" />
          </>
        ) : (
          <>
            <div className="w-4 mr-1" />
            <FileIcon className="w-4 mr-2 " />
          </>
        )}
        <span className="">
          {node.path.startsWith('/artifacts') ? (
            <>
              <span className="text-indigo-600">[artifact]</span>{' '}
              {node.name}
            </>
          ) : (
            node.name
          )}
        </span>
      </button>

      {node.type === 'folder' && node.expanded && node.children && (
        <div>{renderFileTree(node.children, depth + 1)}</div>
      )}
    </div>
  )
})

// Simple artifact content fetcher using the server artifact API
const ArtifactContent = memo(function ArtifactContent({ path }: { path: string }) {
  const searchParams = new URLSearchParams({ path })
  const { data, isLoading } = useSWR(
    `/api/artifacts?${searchParams.toString()}`,
    async (pathname: string, init: RequestInit) => {
      const res = await fetch(pathname, init)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) return await res.text()
      if (contentType.includes('text/csv')) return await res.text()
      if (
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('application/octet-stream')
      ) {
        return '[binary file] Download via DCF Results panel.'
      }
      return await res.text()
    },
    { refreshInterval: 0 }
  )
  if (isLoading || !data) {
    return (
      <div className="absolute w-full h-full flex items-center text-center">
        <div className="flex-1">
          <span className="opacity-60 text-sm">Loading artifact…</span>
        </div>
      </div>
    )
  }
  return (
    <pre className="p-3 text-xs whitespace-pre-wrap break-all">
      {data.slice(0, 200000)}
    </pre>
  )
})

function getIndentClass(depth: number) {
  // Use a safe subset of Tailwind spacing classes
  const map = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-16', 'pl-20', 'pl-24', 'pl-28']
  return map[Math.min(depth, map.length - 1)]
}
