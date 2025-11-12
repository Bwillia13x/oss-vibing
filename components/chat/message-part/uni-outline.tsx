import type { DataPart } from '@/ai/messages/data-parts'
import { FileTextIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-outline']
}

export function UniOutline({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <FileTextIcon className="w-3.5 h-3.5" />
        Document Outline
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'generating'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div>
          <div className="font-semibold">{message.topic}</div>
          {message.thesis && (
            <div className="text-xs text-muted-foreground mt-1">
              Thesis: {message.thesis}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Level: {message.level}
          </div>
        </div>
        {message.sectionHeads.length > 0 && (
          <div className="text-sm space-y-1">
            {message.sectionHeads.map((section, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                {section}
              </div>
            ))}
          </div>
        )}
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
