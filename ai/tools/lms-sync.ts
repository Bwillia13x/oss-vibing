import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './lms-sync.md'
import z from 'zod/v3'
import { createCanvasClient, getCanvasConfig } from '@/lib/lms-canvas-client'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

/**
 * LMS Sync Tool
 * 
 * Integrates with Learning Management Systems to:
 * - List available courses
 * - Import assignments as task documents
 * - Submit completed work to LMS
 * - Sync grades and feedback
 * 
 * Currently supports Canvas LMS with plans for Blackboard and Moodle.
 */
export const lmsSync = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      action: z.enum(['list-courses', 'list-assignments', 'import-assignment', 'submit', 'get-grades'])
        .describe('Action to perform: list-courses, list-assignments, import-assignment, submit, or get-grades'),
      platform: z.enum(['canvas', 'blackboard', 'moodle']).default('canvas')
        .describe('LMS platform (currently only Canvas is supported)'),
      courseId: z.string().optional()
        .describe('Course ID (required for list-assignments, import-assignment, submit)'),
      assignmentId: z.string().optional()
        .describe('Assignment ID (required for import-assignment, submit)'),
      taskPath: z.string().optional()
        .describe('Path to task document to submit (required for submit action)'),
    }),
    execute: async ({ action, platform, courseId, assignmentId, taskPath }, { toolCallId }) => {
      // Initial status
      writer.write({
        id: toolCallId,
        type: 'data-uni-lms',
        data: {
          action,
          platform,
          status: 'connecting',
        },
      })

      try {
        // Only Canvas is supported in Phase 2
        if (platform !== 'canvas') {
          writer.write({
            id: toolCallId,
            type: 'data-uni-lms',
            data: {
              action,
              platform,
              status: 'error',
              error: {
                message: `${platform} is not yet supported. Currently only Canvas LMS is available. Blackboard and Moodle support coming in Phase 3.`,
              },
            },
          })
          return `Error: ${platform} is not yet supported. Currently only Canvas LMS is available.`
        }

        // Get Canvas configuration
        const config = getCanvasConfig()
        if (!config) {
          writer.write({
            id: toolCallId,
            type: 'data-uni-lms',
            data: {
              action,
              platform,
              status: 'error',
              error: {
                message: 'Canvas LMS is not configured. Please set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN environment variables.',
              },
            },
          })
          return 'Error: Canvas LMS not configured. Set CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN environment variables.'
        }

        const client = createCanvasClient(config)

        // Handle different actions
        switch (action) {
          case 'list-courses': {
            const courses = await client.getCourses()
            
            writer.write({
              id: toolCallId,
              type: 'data-uni-lms',
              data: {
                action,
                platform,
                courses: courses.map(c => ({
                  id: c.id,
                  name: c.name,
                  code: c.courseCode,
                })),
                count: courses.length,
                status: 'done',
              },
            })

            return `Found ${courses.length} active course(s):\n${courses.map(c => `- ${c.name} (${c.courseCode}) - ID: ${c.id}`).join('\n')}`
          }

          case 'list-assignments': {
            if (!courseId) {
              throw new Error('courseId is required for list-assignments action')
            }

            const assignments = await client.getUpcomingAssignments(courseId)
            
            writer.write({
              id: toolCallId,
              type: 'data-uni-lms',
              data: {
                action,
                platform,
                courseId,
                assignments: assignments.map(a => ({
                  id: a.id,
                  name: a.name,
                  dueAt: a.dueAt,
                  points: a.pointsPossible,
                })),
                count: assignments.length,
                status: 'done',
              },
            })

            if (assignments.length === 0) {
              return 'No upcoming assignments found in the next 30 days.'
            }

            return `Found ${assignments.length} upcoming assignment(s):\n${assignments.map(a => {
              const dueDate = a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No due date'
              return `- ${a.name} (Due: ${dueDate}, ${a.pointsPossible} pts) - ID: ${a.id}`
            }).join('\n')}`
          }

          case 'import-assignment': {
            if (!assignmentId) {
              throw new Error('assignmentId is required for import-assignment action')
            }

            const result = await client.importAssignment(assignmentId, courseId)
            
            // Ensure tasks directory exists
            const tasksDir = join(process.cwd(), 'tasks')
            if (!existsSync(tasksDir)) {
              mkdirSync(tasksDir, { recursive: true })
            }

            // Write task file
            const fullPath = join(process.cwd(), result.taskPath)
            writeFileSync(fullPath, result.content, 'utf-8')

            writer.write({
              id: toolCallId,
              type: 'data-uni-lms',
              data: {
                action,
                platform,
                assignmentId,
                assignmentName: result.assignment.name,
                taskPath: result.taskPath,
                dueAt: result.assignment.dueAt || undefined,
                points: result.assignment.pointsPossible,
                status: 'done',
              },
            })

            return `Assignment imported successfully!\n\nName: ${result.assignment.name}\nDue: ${result.assignment.dueAt ? new Date(result.assignment.dueAt).toLocaleString() : 'No due date'}\nPoints: ${result.assignment.pointsPossible}\n\nTask created at: ${result.taskPath}\n\nYou can now work on this assignment in Vibe University. Use lmsSync with action='submit' to submit your work when complete.`
          }

          case 'submit': {
            if (!assignmentId) {
              throw new Error('assignmentId is required for submit action')
            }
            if (!taskPath) {
              throw new Error('taskPath is required for submit action')
            }

            // Read task content
            const fullPath = join(process.cwd(), taskPath)
            if (!existsSync(fullPath)) {
              throw new Error(`Task file not found: ${taskPath}`)
            }

            const content = readFileSync(fullPath, 'utf-8')

            // Extract work area content (everything after "## Work Area")
            const workAreaMatch = content.match(/## Work Area\s*\n\s*(?:<!--.*?-->\s*\n)?\s*([\s\S]*?)(?=\n---|\n##|$)/i)
            const submissionBody = workAreaMatch ? workAreaMatch[1].trim() : content

            if (!submissionBody) {
              throw new Error('No content found to submit. Please add your work under the "Work Area" section.')
            }

            // Submit to Canvas
            const submission = await client.submitAssignment(
              assignmentId,
              {
                submissionType: 'online_text_entry',
                body: submissionBody,
              },
              courseId
            )

            writer.write({
              id: toolCallId,
              type: 'data-uni-lms',
              data: {
                action,
                platform,
                assignmentId,
                taskPath,
                submissionId: submission.id,
                submittedAt: submission.submittedAt || undefined,
                status: 'done',
              },
            })

            return `Assignment submitted successfully!\n\nSubmission ID: ${submission.id}\nSubmitted at: ${submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown'}\n\nYour work has been submitted to Canvas. Check Canvas for grading status and feedback from your instructor.`
          }

          case 'get-grades': {
            if (!courseId) {
              throw new Error('courseId is required for get-grades action')
            }

            // Get all assignments with submissions
            const assignments = await client.getAssignments(courseId)
            const gradesInfo = []

            for (const assignment of assignments) {
              try {
                const submission = await client.getSubmission(assignment.id, 'self', courseId)
                if (submission.submittedAt) {
                  gradesInfo.push({
                    name: assignment.name,
                    points: assignment.pointsPossible,
                    score: submission.score,
                    grade: submission.grade,
                    submittedAt: submission.submittedAt,
                  })
                }
              } catch (_error) {
                // Skip if no submission found
                continue
              }
            }

            writer.write({
              id: toolCallId,
              type: 'data-uni-lms',
              data: {
                action,
                platform,
                courseId,
                grades: gradesInfo,
                count: gradesInfo.length,
                status: 'done',
              },
            })

            if (gradesInfo.length === 0) {
              return 'No graded submissions found for this course.'
            }

            return `Found ${gradesInfo.length} graded submission(s):\n${gradesInfo.map(g => {
              const scoreText = g.score !== null ? `${g.score}/${g.points}` : 'Not graded yet'
              const gradeText = g.grade ? ` (${g.grade})` : ''
              return `- ${g.name}: ${scoreText}${gradeText}`
            }).join('\n')}`
          }

          default:
            throw new Error(`Unknown action: ${action}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-lms',
          data: {
            action,
            platform,
            status: 'error',
            error: {
              message: errorMessage,
            },
          },
        })

        return `Error: ${errorMessage}`
      }
    },
  })
