import type { DataPart } from '@/ai/messages/data-parts'
import { PresentationIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-deck-generate']
}

export function UniDeckGenerate({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <PresentationIcon className="w-3.5 h-3.5" />
        Deck Generation
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
            <span>Generated {message.slides.length} slides</span>
          )}
          {message.status === 'generating' && <span>Generating presentation...</span>}
        </div>
        {message.slideTitles.length > 0 && (
          <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
            {message.slideTitles.map((title, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Slide {idx + 1}: {title}
              </div>
            ))}
          </div>
        )}
        {message.speakerNotes && message.speakerNotes.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Speaker notes included for {message.speakerNotes.length} slides
          </div>
        )}
        {message.error && (
          <div className="text-sm text-red-700">{message.error.message}</div>
        )}
      </div>
    </ToolMessage>
  )
}
