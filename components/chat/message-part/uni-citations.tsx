import type { DataPart } from '@/ai/messages/data-parts'
import { BookOpenIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-citations']
}

export function UniCitations({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <BookOpenIcon className="w-3.5 h-3.5" />
        Citations ({message.style})
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'searching' || message.status === 'inserting'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="text-sm">
          {message.status === 'done' && (
            <span>Found {message.items.length} sources, inserted {message.inserted.length} citations</span>
          )}
          {message.status === 'searching' && <span>Searching for sources...</span>}
          {message.status === 'inserting' && <span>Inserting citations...</span>}
        </div>
        {message.items.length > 0 && (
          <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {message.items.map((item) => (
              <div key={item.id} className="border-l-2 border-muted pl-2">
                <div className="font-medium">{item.title}</div>
                {item.author && <div className="text-muted-foreground">{item.author}</div>}
                {item.doi && <div className="text-muted-foreground">DOI: {item.doi}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Retrieved: {new Date(message.timestamp).toLocaleString()}
        </div>
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
