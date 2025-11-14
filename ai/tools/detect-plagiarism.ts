import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './detect-plagiarism.md'
import z from 'zod/v3'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { generatePlagiarismReport, getOriginalityRecommendation } from '../../lib/plagiarism-detector'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const detectPlagiarism = ({ writer: _writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().describe('Path to document file to check for plagiarism'),
      referencePaths: z.array(z.string()).optional().describe('Optional paths to reference sources for comparison'),
      includeMinorIssues: z.boolean().default(false).describe('Include low-severity issues in the report'),
    }),
    execute: async ({ documentPath, referencePaths, includeMinorIssues }, { toolCallId: _toolCallId }) => {
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
            const doc: JsonDocument = JSON.parse(content)
            // Extract text from sections if it's a document structure
            if (doc.sections) {
              text = doc.sections.map((s) => s.content || '').join('\n\n')
            } else if (doc.content) {
              text = doc.content
            }
          } catch (_parseError) {
            // If JSON parsing fails, fall through to use raw content as plain text.
            // This is safe because the document may be plain text or an unexpected format.
            // If debugging is needed, consider logging the error here.
            text = content
          }
        }
        
        if (!text || text.trim().length === 0) {
          throw new Error('Document is empty or could not be parsed')
        }
        
        // Load reference sources if provided
        let referenceSources: string[] | undefined
        if (referencePaths && referencePaths.length > 0) {
          referenceSources = []
          for (const refPath of referencePaths) {
            const fullRefPath = path.resolve(refPath)
            if (existsSync(fullRefPath)) {
              const refContent = await readFile(fullRefPath, 'utf-8')
              referenceSources.push(refContent)
            }
          }
        }
        
        // Generate plagiarism report
        const report = generatePlagiarismReport(text, referenceSources)
        
        // Filter issues based on severity setting
        let filteredIssues = report.issues
        if (!includeMinorIssues) {
          filteredIssues = report.issues.filter(i => i.severity !== 'low')
        }
        
        // Build summary message
        const summary = `Plagiarism check complete for ${documentPath}.\n\n` +
          `Originality Score: ${report.originalityScore}/100\n` +
          `${getOriginalityRecommendation(report.originalityScore)}\n\n` +
          `Found ${filteredIssues.length} potential issues:\n` +
          `- ${report.statistics.uncitedQuotes} uncited quotes\n` +
          `- ${report.statistics.missingCitations} missing citations\n` +
          `- ${report.statistics.suspiciousSentences} suspicious sentences\n` +
          `\nOverall Risk: ${report.statistics.overallRisk.toUpperCase()}\n\n` +
          `Review the detailed report for specific improvements.`
        
        return summary
        
      } catch (error) {
        throw error
      }
    },
  })
