import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './generate-quiz.md'
import z from 'zod/v3'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createQuizFromNotes, gradeQuiz, type Quiz, type QuizAttempt } from '../../lib/quiz-generator'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const generateQuiz = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      action: z.enum(['create', 'grade', 'list']).describe('Action to perform: create a new quiz, grade an attempt, or list quizzes'),
      notePath: z.string().optional().describe('Path to notes file (required for create action)'),
      quizTitle: z.string().optional().describe('Title for the quiz (optional, defaults to notes filename)'),
      totalQuestions: z.number().optional().default(10).describe('Number of questions to generate (default: 10)'),
      questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'fill-blank'])).optional().default(['multiple-choice', 'true-false', 'fill-blank']).describe('Types of questions to include'),
      difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional().default('mixed').describe('Difficulty level of questions'),
      quizPath: z.string().optional().describe('Path to quiz file (required for grade action)'),
      answers: z.record(z.any()).optional().describe('User answers as key-value pairs (required for grade action)'),
    }),
    execute: async ({ action, notePath, quizTitle, totalQuestions, questionTypes, difficulty, quizPath, answers }, { toolCallId }) => {
      try {
        // Ensure directories exist
        const quizzesDir = path.join(process.cwd(), 'quizzes')
        if (!existsSync(quizzesDir)) {
          await mkdir(quizzesDir, { recursive: true })
        }

        const attemptsDir = path.join(process.cwd(), 'quizzes', 'attempts')
        if (!existsSync(attemptsDir)) {
          await mkdir(attemptsDir, { recursive: true })
        }

        switch (action) {
          case 'create': {
            if (!notePath) {
              writer.write({
                id: toolCallId,
                type: 'data-uni-quiz',
                data: {
                  status: 'error',
                  error: { message: 'notePath is required for create action' }
                }
              })
              return { success: false, error: 'notePath is required' }
            }

            // Read notes file
            const fullNotePath = path.join(process.cwd(), notePath)
            if (!existsSync(fullNotePath)) {
              writer.write({
                id: toolCallId,
                type: 'data-uni-quiz',
                data: {
                  status: 'error',
                  error: { message: `Notes file not found: ${notePath}` }
                }
              })
              return { success: false, error: 'Notes file not found' }
            }

            writer.write({
              id: toolCallId,
              type: 'data-uni-quiz',
              data: {
                action: 'create',
                status: 'generating',
              }
            })

            const notesContent = await readFile(fullNotePath, 'utf-8')
            const title = quizTitle || path.basename(notePath, path.extname(notePath))
            
            // Generate quiz
            const quiz = createQuizFromNotes(notesContent, title, notePath, {
              totalQuestions,
              questionTypes,
              difficulty
            })

            // Save quiz to file
            const quizFileName = `${title.toLowerCase().replace(/\s+/g, '-')}-quiz.json`
            const quizFilePath = path.join(quizzesDir, quizFileName)
            await writeFile(quizFilePath, JSON.stringify(quiz, null, 2), 'utf-8')

            // Prepare question preview for display
            const questionsPreview = quiz.questions.map(q => {
              if (q.type === 'multiple-choice') {
                return {
                  id: q.id,
                  type: q.type,
                  question: q.question,
                  options: q.options
                }
              } else if (q.type === 'true-false') {
                return {
                  id: q.id,
                  type: q.type,
                  statement: q.statement
                }
              } else {
                return {
                  id: q.id,
                  type: q.type,
                  question: q.question
                }
              }
            })

            writer.write({
              id: toolCallId,
              type: 'data-uni-quiz',
              data: {
                action: 'create',
                quizId: quiz.id,
                title: quiz.title,
                totalQuestions: quiz.questions.length,
                questions: questionsPreview,
                savedPath: `quizzes/${quizFileName}`,
                status: 'done',
              }
            })

            return {
              success: true,
              quizId: quiz.id,
              title: quiz.title,
              totalQuestions: quiz.questions.length,
              savedPath: `quizzes/${quizFileName}`,
              message: `✓ Quiz created with ${quiz.questions.length} questions and saved to quizzes/${quizFileName}`
            }
          }

          case 'grade': {
            if (!quizPath || !answers) {
              writer.write({
                id: toolCallId,
                type: 'data-uni-quiz',
                data: {
                  status: 'error',
                  error: { message: 'quizPath and answers are required for grade action' }
                }
              })
              return { success: false, error: 'quizPath and answers are required' }
            }

            // Read quiz file
            const fullQuizPath = path.join(process.cwd(), quizPath)
            if (!existsSync(fullQuizPath)) {
              writer.write({
                id: toolCallId,
                type: 'data-uni-quiz',
                data: {
                  status: 'error',
                  error: { message: `Quiz file not found: ${quizPath}` }
                }
              })
              return { success: false, error: 'Quiz file not found' }
            }

            writer.write({
              id: toolCallId,
              type: 'data-uni-quiz',
              data: {
                action: 'grade',
                status: 'grading',
              }
            })

            const quizContent = await readFile(fullQuizPath, 'utf-8')
            const quiz: Quiz = JSON.parse(quizContent)

            // Grade the quiz
            const result = gradeQuiz(quiz, answers)

            // Save attempt
            const attempt: QuizAttempt = {
              quizId: quiz.id,
              attemptId: `attempt-${Date.now()}`,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              answers,
              score: result.score,
              correctCount: result.correctCount,
              totalQuestions: result.totalQuestions
            }

            const attemptFileName = `${quiz.id}-${attempt.attemptId}.json`
            const attemptFilePath = path.join(attemptsDir, attemptFileName)
            await writeFile(attemptFilePath, JSON.stringify({
              attempt,
              feedback: result.feedback
            }, null, 2), 'utf-8')

            writer.write({
              id: toolCallId,
              type: 'data-uni-quiz',
              data: {
                action: 'grade',
                score: result.score,
                correctCount: result.correctCount,
                totalQuestions: result.totalQuestions,
                feedback: result.feedback,
                attemptSaved: `quizzes/attempts/${attemptFileName}`,
                status: 'done',
              }
            })

            return {
              success: true,
              score: result.score,
              correctCount: result.correctCount,
              totalQuestions: result.totalQuestions,
              percentage: result.score,
              grade: result.score >= 90 ? 'A' : result.score >= 80 ? 'B' : result.score >= 70 ? 'C' : result.score >= 60 ? 'D' : 'F',
              feedback: result.feedback,
              attemptSaved: `quizzes/attempts/${attemptFileName}`,
              message: `✓ Quiz graded: ${result.correctCount}/${result.totalQuestions} correct (${result.score}%)`
            }
          }

          case 'list': {
            // List all available quizzes
            const fs = await import('fs/promises')
            const quizFiles = await fs.readdir(quizzesDir)
            const quizList = []

            for (const file of quizFiles) {
              if (file.endsWith('-quiz.json')) {
                const quizContent = await readFile(path.join(quizzesDir, file), 'utf-8')
                const quiz: Quiz = JSON.parse(quizContent)
                quizList.push({
                  id: quiz.id,
                  title: quiz.title,
                  source: quiz.source,
                  totalQuestions: quiz.questions.length,
                  createdAt: quiz.createdAt,
                  path: `quizzes/${file}`
                })
              }
            }

            writer.write({
              id: toolCallId,
              type: 'data-uni-quiz',
              data: {
                action: 'list',
                quizzes: quizList,
                count: quizList.length,
                status: 'done',
              }
            })

            return {
              success: true,
              quizzes: quizList,
              count: quizList.length,
              message: `Found ${quizList.length} quiz(zes)`
            }
          }

          default:
            return { success: false, error: 'Invalid action' }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        writer.write({
          id: toolCallId,
          type: 'data-uni-quiz',
          data: {
            status: 'error',
            error: { message: errorMessage }
          }
        })
        return { success: false, error: errorMessage }
      }
    }
  })
