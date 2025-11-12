import type { DataPart } from '@/ai/messages/data-parts'
import { BarChartIcon, CheckIcon, XIcon } from 'lucide-react'
import { Spinner } from './spinner'
import { ToolHeader } from '../tool-header'
import { ToolMessage } from '../tool-message'

interface Props {
  message: DataPart['uni-sheet-analyze']
}

export function UniSheetAnalyze({ message }: Props) {
  return (
    <ToolMessage>
      <ToolHeader>
        <BarChartIcon className="w-3.5 h-3.5" />
        Sheet Analysis
      </ToolHeader>
      <div className="relative pl-6 min-h-5 space-y-2">
        <Spinner
          className="absolute left-0 top-0"
          loading={message.status === 'analyzing'}
        >
          {message.status === 'error' ? (
            <XIcon className="w-4 h-4 text-red-700" />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </Spinner>
        <div className="text-sm">
          <div>Range: {message.range}</div>
          <div>Operations: {message.ops.join(', ')}</div>
        </div>
        {message.tables && message.tables.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Analysis Results:</div>
            {message.tables.map((table, idx) => (
              <div key={idx} className="text-xs border-l-2 border-muted pl-2">
                {table.name}
              </div>
            ))}
          </div>
        )}
        {message.charts && message.charts.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold">Charts Created:</div>
            {message.charts.map((chart, idx) => (
              <div key={idx} className="text-xs flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                {chart.title} ({chart.type})
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
