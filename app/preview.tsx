'use client'

import { memo } from 'react'
import { Preview as PreviewComponent } from '@/components/preview/preview'
import { useSandboxStore } from './state'

interface Props {
  className?: string
}

export const Preview = memo(function Preview({ className }: Props) {
  const { status, url, urlUUID } = useSandboxStore()
  return (
    <PreviewComponent
      key={urlUUID}
      className={className}
      disabled={status === 'stopped'}
      url={url}
    />
  )
})
