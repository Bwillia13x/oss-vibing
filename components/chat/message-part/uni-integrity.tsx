import type { DataPart } from '@/ai/messages/data-parts'
import { ShieldCheckIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-integrity']
}

export function UniIntegrity({ message }: Props) {
  const coverageColor = message.coveragePct >= 80 
    ? 'text-green-600' 
    : message.coveragePct >= 60 
    ? 'text-yellow-600' 
    : 'text-red-600'

  return (
    <ToolMessage>
      <ToolHeader>
        <ShieldCheckIcon className="w-3.5 h-3.5" />
        Integrity Check
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'checking'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="text-sm">
          <div className={`font-semibold ${coverageColor}`}>
            Citation Coverage: {message.coveragePct}%
          </div>
        </div>
        {message.missingCites.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-red-600">
              Missing Citations ({message.missingCites.length}):
            </div>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {message.missingCites.slice(0, 5).map((cite, idx) => (
                <div key={idx} className="border-l-2 border-red-500 pl-2">
                  {cite}
                </div>
              ))}
              {message.missingCites.length > 5 && (
                <div className="text-muted-foreground">
                  ... and {message.missingCites.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
        {message.quoteMismatches.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-yellow-600">
              Quote Mismatches ({message.quoteMismatches.length}):
            </div>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {message.quoteMismatches.slice(0, 3).map((mismatch, idx) => (
                <div key={idx} className="border-l-2 border-yellow-500 pl-2">
                  <div>&ldquo;{mismatch.quote}&rdquo;</div>
                  <div className="text-muted-foreground">{mismatch.issue}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {message.actions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Suggested Actions:</div>
            <div className="text-xs space-y-1">
              {message.actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <CheckIcon className="w-3 h-3" />
                  {action}
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
