import type { InferUITools, UIMessage, UIMessageStreamWriter } from 'ai'
import type { DataPart } from '@/ai/messages/data-parts'
import { planTask } from './plan-task'
import { executeTask } from './execute-task'

export function tools(params?: { writer?: UIMessageStreamWriter<UIMessage<never, DataPart>> }) {
  return {
    planTask: planTask(),
  executeTask: executeTask({ writer: params?.writer }),
  }
}

export type ToolSet = InferUITools<ReturnType<typeof tools>>
