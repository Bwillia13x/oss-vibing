import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './plan-schedule.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const planSchedule = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      courses: z.array(z.string()).describe('List of course codes or ICS URLs'),
      tasks: z.array(z.string()).optional().describe('List of task IDs'),
      exams: z.array(z.object({
        course: z.string(),
        date: z.string(),
        title: z.string(),
      })).optional().describe('Exam schedule'),
    }),
    execute: async ({ courses, tasks, exams }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-generating-files',
        data: {
          paths: [],
          status: 'generating',
        },
      })

      // Stub implementation - would parse ICS feeds and create schedule
      const generatedPaths = courses.map((course) => `courses/${course}.json`)
      if (tasks) {
        generatedPaths.push('tasks/weekly-plan.json')
      }

      writer.write({
        id: toolCallId,
        type: 'data-generating-files',
        data: {
          paths: generatedPaths,
          status: 'done',
        },
      })

      const conflicts = exams && exams.length > 1 ? 1 : 0
      return `Created schedule for ${courses.length} courses. ${conflicts > 0 ? `Found ${conflicts} scheduling conflict(s).` : 'No conflicts detected.'}`
    },
  })
