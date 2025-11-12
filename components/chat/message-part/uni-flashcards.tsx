import type { DataPart } from '@/ai/messages/data-parts'
import { BrainIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-flashcards']
}

export function UniFlashcards({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <BrainIcon className="w-3.5 h-3.5" />
        Flashcards
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
        <div className="text-sm">
          {message.status === 'done' && (
            <span>Generated {message.count} flashcards</span>
          )}
          {message.status === 'generating' && <span>Creating flashcards...</span>}
        </div>
        {message.cards.length > 0 && (
          <div className="text-xs space-y-2 max-h-48 overflow-y-auto">
            {message.cards.slice(0, 3).map((card, idx) => (
              <div key={idx} className="border rounded p-2 space-y-1">
                <div className="font-medium">Q: {card.front}</div>
                <div className="text-muted-foreground">A: {card.back}</div>
                {card.type && (
                  <div className="text-xs text-muted-foreground">Type: {card.type}</div>
                )}
              </div>
            ))}
            {message.cards.length > 3 && (
              <div className="text-muted-foreground">
                ... and {message.cards.length - 3} more
              </div>
            )}
          </div>
        )}
        {message.scheduleMeta?.nextReview && (
          <div className="text-xs text-muted-foreground">
            Next review: {new Date(message.scheduleMeta.nextReview).toLocaleDateString()}
          </div>
        )}
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
