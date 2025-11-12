import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './check-grammar.md'
import z from 'zod/v3'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { calculateReadabilityScores, getAcademicReadabilityRecommendation } from '../../lib/readability-metrics'
import { checkGrammarAndStyle, type GrammarIssue } from '../../lib/grammar-checker'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const checkGrammar = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().describe('Path to document file to check'),
      checkTypes: z.array(z.enum(['grammar', 'style', 'readability', 'passive', 'all']))
        .default(['all'])
        .describe('Types of checks to perform'),
      discipline: z.enum(['STEM', 'Humanities', 'Social Sciences', 'General'])
        .optional()
        .describe('Academic discipline for specialized style guidelines'),
    }),
    execute: async ({ documentPath, checkTypes, discipline }, { toolCallId }) => {
      try {
        // Read the document
        const fullPath = path.resolve(documentPath)
        if (!existsSync(fullPath)) {
          throw new Error(`Document not found: ${documentPath}`)
        }
        
        const content = await readFile(fullPath, 'utf-8')
        
        // Parse JSON document if applicable
        let text = content
        if (fullPath.endsWith('.json')) {
          try {
            const doc = JSON.parse(content)
            // Extract text from sections if it's a document structure
            if (doc.sections) {
              text = doc.sections.map((s: any) => s.content || '').join('\n\n')
            } else if (doc.content) {
              text = doc.content
            }
          } catch (parseError) {
            // If JSON parsing fails, log the error and use raw content as plain text.
            console.warn(`Failed to parse JSON document at ${fullPath}:`, parseError)
            text = content
          }
        }
        
        if (!text || text.trim().length === 0) {
          throw new Error('Document is empty or could not be parsed')
        }
        
        const shouldCheckAll = checkTypes.includes('all')
        const shouldCheckGrammar = shouldCheckAll || checkTypes.includes('grammar') || checkTypes.includes('style')
        const shouldCheckReadability = shouldCheckAll || checkTypes.includes('readability')
        const shouldCheckPassive = shouldCheckAll || checkTypes.includes('passive')
        
        // Run grammar and style checks
        let grammarResults: { issues: GrammarIssue[]; summary: any } | null = null
        if (shouldCheckGrammar || shouldCheckPassive) {
          grammarResults = checkGrammarAndStyle(text)
          
          // Filter issues based on checkTypes
          if (!shouldCheckAll) {
            grammarResults.issues = grammarResults.issues.filter(issue => {
              if (shouldCheckPassive && issue.type === 'passive') return true
              if (shouldCheckGrammar && issue.type !== 'passive') return true
              return false
            })
          }
        }
        
        // Run readability analysis
        let readabilityResults: ReturnType<typeof calculateReadabilityScores> | null = null
        if (shouldCheckReadability) {
          readabilityResults = calculateReadabilityScores(text)
        }
        
        // Prepare results
        const results: any = {
          status: 'done',
        }
        
        if (grammarResults) {
          results.grammar = {
            totalIssues: grammarResults.issues.length,
            errors: grammarResults.summary.errors,
            warnings: grammarResults.summary.warnings,
            suggestions: grammarResults.summary.suggestions,
            passiveVoiceCount: grammarResults.summary.passiveVoiceCount,
            issues: grammarResults.issues.slice(0, 20).map(issue => ({
              type: issue.type,
              severity: issue.severity,
              message: issue.message,
              suggestion: issue.suggestion,
              sentence: issue.sentence,
            })),
          }
        }
        
        if (readabilityResults) {
          results.readability = {
            statistics: {
              words: readabilityResults.statistics.words,
              sentences: readabilityResults.statistics.sentences,
              averageWordsPerSentence: Math.round(readabilityResults.statistics.averageWordsPerSentence * 10) / 10,
              complexWords: readabilityResults.statistics.complexWords,
            },
            scores: {
              fleschReadingEase: Math.round(readabilityResults.scores.fleschReadingEase * 10) / 10,
              fleschKincaidGrade: Math.round(readabilityResults.scores.fleschKincaidGrade * 10) / 10,
              gunningFog: Math.round(readabilityResults.scores.gunningFog * 10) / 10,
            },
            interpretation: readabilityResults.interpretation,
            academicRecommendation: getAcademicReadabilityRecommendation(
              readabilityResults.scores,
              discipline
            ),
          }
        }
        
        // Build summary message
        let summaryParts: string[] = []
        
        if (grammarResults) {
          summaryParts.push(
            `Found ${grammarResults.issues.length} issues: ` +
            `${grammarResults.summary.errors} errors, ` +
            `${grammarResults.summary.warnings} warnings, ` +
            `${grammarResults.summary.suggestions} suggestions`
          )
          
          if (grammarResults.summary.passiveVoiceCount > 0) {
            summaryParts.push(
              `Detected ${grammarResults.summary.passiveVoiceCount} instances of passive voice`
            )
          }
        }
        
        if (readabilityResults) {
          const avgGrade = Math.round(
            (readabilityResults.scores.fleschKincaidGrade +
             readabilityResults.scores.gunningFog) / 2
          )
          summaryParts.push(
            `Readability: Grade ${avgGrade} level ` +
            `(${readabilityResults.interpretation.toLowerCase()})`
          )
        }
        
        const summary = summaryParts.join('. ') + '.'
        
        // Return results
        return `Grammar and style check complete for ${documentPath}.\n\n${summary}\n\nReview the detailed results for specific improvements.`
        
      } catch (error) {
        throw error
      }
    },
  })
