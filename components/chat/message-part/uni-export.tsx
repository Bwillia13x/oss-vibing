import type { DataPart } from '@/ai/messages/data-parts'
import { DownloadIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-export']
}

export function UniExport({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <DownloadIcon className="w-3.5 h-3.5" />
        Export Artifact
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'exporting'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="text-sm">
          {message.status === 'done' && message.exportPath && (
            <div>
              <div className="font-medium">Export complete</div>
              <div className="text-xs text-muted-foreground">
                {message.exportPath}
              </div>
            </div>
          )}
          {message.status === 'exporting' && (
            <div>Exporting {message.artifactPath} as {message.format}...</div>
          )}
        </div>
        <div className="text-xs">
          <div>Source: {message.artifactPath}</div>
          <div>Format: {message.format}</div>
        </div>
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
