import type { DataPart } from '@/ai/messages/data-parts'
import { FileIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-pdf-summary']
}

export function UniPdfSummary({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <FileIcon className="w-3.5 h-3.5" />
        PDF Summary
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'processing'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="text-sm font-medium">{message.source}</div>
        {message.highlights.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Highlights:</div>
            <div className="text-xs space-y-1">
              {message.highlights.map((highlight, idx) => (
                <div key={idx} className="border-l-2 border-yellow-500 pl-2">
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        )}
        {message.quotes.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Key Quotes:</div>
            <div className="text-xs space-y-1">
              {message.quotes.map((quote, idx) => (
                <div key={idx} className="border-l-2 border-blue-500 pl-2">
                  <div>&ldquo;{quote.text}&rdquo;</div>
                  <div className="text-muted-foreground">Page {quote.page}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
