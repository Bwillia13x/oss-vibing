import { tool } from 'ai'
import z from 'zod/v3'
import { planTask as planTaskAction } from '@/app/actions/runTask'

export function planTask() {
  return tool({
    description: 'Plan a finance task from a natural language prompt',
    inputSchema: z.object({
      prompt: z.string().describe(
        'The natural language prompt describing the finance task'
      ),
    }),
    execute: async ({ prompt }) => {
      const result = await planTaskAction(prompt)
      const stepsText = result.plan.steps
        .map((step, i) => `${i + 1}. ${step}`)
        .join('\n')
      const inputsText = JSON.stringify(result.plan.inputs, null, 2)
      return `Task planned: ${result.task.kind}\n\nSteps:\n${stepsText}\n\nInputs:\n${inputsText}`
    },
  })
}
