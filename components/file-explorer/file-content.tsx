import { SyntaxHighlighter } from './syntax-highlighter'
import { Skeleton } from '@/components/ui/skeleton'
import { memo } from 'react'
import useSWR from 'swr'

interface Props {
  sandboxId: string
  path: string
}

export const FileContent = memo(function FileContent({
  sandboxId,
  path,
}: Props) {
  const searchParams = new URLSearchParams({ path })
  const content = useSWR(
    `/api/sandboxes/${sandboxId}/files?${searchParams.toString()}`,
    async (pathname: string, init: RequestInit) => {
      const response = await fetch(pathname, init)
      const text = await response.text()
      return text
    },
    { refreshInterval: 1000 }
  )

  if (content.isLoading || !content.data) {
    return (
      <div className="p-4 space-y-2" role="status" aria-live="polite" aria-label="Loading file content">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <span className="sr-only">Loading file: {path}</span>
      </div>
    )
  }

  return <SyntaxHighlighter path={path} code={content.data} />
})
