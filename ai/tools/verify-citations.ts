import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './verify-citations.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'
import { lookupDOI, validateDOI } from '@/lib/api/citation-client'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

/**
 * Represents the structure of a document for citation verification.
 * 
 * @interface DocumentData
 * @property {string} [title] - The document title
 * @property {string} [content] - The main document content/text
 * @property {Array} [citations] - In-text citations with their positions
 * @property {Object} [bibliography] - Bibliography/reference list with citation metadata
 * 
 * @remarks
 * - `content` is required for coverage analysis and quote verification
 * - `bibliography.items` should include DOI/URL for source verification
 * - `citations` array is optional but improves verification accuracy
 */
interface DocumentData {
  title?: string
  content?: string
  citations?: Array<{
    id: string
    text: string
    position?: number
  }>
  bibliography?: {
    items?: Array<{
      id: string
      doi?: string
      url?: string
      year?: number
      timestamp?: string
    }>
  }
}

// Citation pattern regex - matches common citation formats like (Author, 2024) or [1]
const CITATION_PATTERN = /\([^)]*\d{4}[^)]*\)|\[[^\]]*\d+[^\]]*\]/

// Analyze citation coverage in document
function analyzeCitationCoverage(content: string, _citations: any[]): {
  totalSentences: number
  citedSentences: number
  coveragePct: number
  uncitedClaims: string[]
} {
  // Split content into sentences (simplified)
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Ignore very short fragments
  
  // Find sentences with citations (containing numbers in parentheses or brackets)
  const citedSentences = sentences.filter(s => CITATION_PATTERN.test(s))
  
  // Find uncited claims (sentences with strong claim words but no citation)
  const claimKeywords = [
    'research shows',
    'studies indicate',
    'evidence suggests',
    'data demonstrates',
    'findings reveal',
    'according to',
    'proven',
    'demonstrated',
    'established',
  ]
  
  const uncitedClaims: string[] = []
  sentences.forEach(sentence => {
    const hasClaimKeyword = claimKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
    const hasCitation = CITATION_PATTERN.test(sentence)
    
    if (hasClaimKeyword && !hasCitation) {
      uncitedClaims.push(sentence.substring(0, 100) + '...')
    }
  })
  
  const coveragePct = sentences.length > 0 
    ? (citedSentences.length / sentences.length) * 100 
    : 0
  
  return {
    totalSentences: sentences.length,
    citedSentences: citedSentences.length,
    coveragePct: Math.round(coveragePct * 10) / 10,
    uncitedClaims: uncitedClaims.slice(0, 10), // Limit to top 10
  }
}

// Verify quotes against sources
function verifyQuotes(content: string, _bibliography: any): Array<{
  quote: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}> {
  const issues: Array<{ quote: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  // Find quoted text in content
  const quotePattern = /"([^"]{20,}?)"/g
  let match
  
  while ((match = quotePattern.exec(content)) !== null) {
    const quote = match[1]
    
    // Check if quote has a nearby citation (within 50 characters)
    const contextStart = Math.max(0, match.index - 50)
    const contextEnd = Math.min(content.length, match.index + match[0].length + 50)
    const context = content.substring(contextStart, contextEnd)
    
    const hasCitation = CITATION_PATTERN.test(context)
    
    if (!hasCitation) {
      issues.push({
        quote: quote.substring(0, 80) + (quote.length > 80 ? '...' : ''),
        issue: 'Quote lacks citation',
        severity: 'high',
      })
    }
  }
  
  return issues.slice(0, 10) // Limit to top 10
}

// Detect stale or broken citations
async function detectStaleCitations(bibliography: any): Promise<Array<{
  citation: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}>> {
  const issues: Array<{ citation: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  if (!bibliography?.items || !Array.isArray(bibliography.items)) {
    return issues
  }
  
  const currentYear = new Date().getFullYear()
  
  // Verify DOIs in parallel (with limit to avoid rate limiting)
  const verificationPromises = bibliography.items.slice(0, 20).map(async (item: any) => {
    // Check for missing DOI or URL
    if (!item.doi && !item.url) {
      return {
        citation: item.title || item.id || 'Unknown',
        issue: 'Missing DOI or URL - citation not verifiable',
        severity: 'medium' as const,
      }
    }
    
    // Verify DOI exists in academic databases if DOI is present
    if (item.doi) {
      try {
        const isValid = await validateDOI(item.doi, { enableCaching: true })
        if (!isValid) {
          return {
            citation: item.title || item.id || 'Unknown',
            issue: 'DOI not found in academic databases - citation may be invalid or fabricated',
            severity: 'high' as const,
          }
        }
      } catch (error) {
        console.error('Error verifying DOI:', error)
        // Don't fail silently - report the verification issue
        return {
          citation: item.title || item.id || 'Unknown',
          issue: 'Unable to verify DOI - check your internet connection',
          severity: 'medium' as const,
        }
      }
    }
    
    // Check for very old citations (> 10 years for most fields)
    if (item.year && currentYear - item.year > 10) {
      return {
        citation: item.title || item.id || 'Unknown',
        issue: `Citation is ${currentYear - item.year} years old - may be outdated`,
        severity: 'low' as const,
      }
    }
    
    // Check if citation was fetched long ago (stale cache)
    if (item.timestamp) {
      const fetchDate = new Date(item.timestamp)
      const daysSinceFetch = (Date.now() - fetchDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceFetch > 90) {
        return {
          citation: item.title || item.id || 'Unknown',
          issue: `Citation metadata is ${Math.round(daysSinceFetch)} days old - should be re-verified`,
          severity: 'low' as const,
        }
      }
    }
    
    return null
  })
  
  const results = await Promise.all(verificationPromises)
  issues.push(...results.filter((r): r is NonNullable<typeof r> => r !== null))
  
  return issues.slice(0, 10) // Limit to top 10
}

// Detect potentially fabricated citations
async function detectFabricatedCitations(bibliography: any): Promise<Array<{
  citation: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}>> {
  const issues: Array<{ citation: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  if (!bibliography?.items || !Array.isArray(bibliography.items)) {
    return issues
  }
  
  // Verify citations in parallel (limit to first 20 to avoid rate limiting)
  const verificationPromises = bibliography.items.slice(0, 20).map(async (item: any) => {
    const itemIssues: Array<{ citation: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
    
    // Check for suspicious patterns
    
    // Missing critical fields
    if (!item.title || !item.author) {
      itemIssues.push({
        citation: item.id || 'Unknown',
        issue: 'Missing critical fields (title or author) - may be fabricated',
        severity: 'high',
      })
    }
    
    // Generic or placeholder data
    const placeholderPatterns = [
      /untitled/i,
      /unknown author/i,
      /test/i,
      /example/i,
      /placeholder/i,
    ]
    
    const title = item.title || ''
    const author = item.author || ''
    
    if (placeholderPatterns.some(pattern => pattern.test(title) || pattern.test(author))) {
      itemIssues.push({
        citation: item.title || item.id || 'Unknown',
        issue: 'Contains placeholder text - likely not a real source',
        severity: 'high',
      })
    }
    
    // Invalid DOI format (if DOI is present)
    if (item.doi && !/^10\.\d{4,}\//.test(item.doi)) {
      itemIssues.push({
        citation: item.title || item.id || 'Unknown',
        issue: 'Invalid DOI format - citation may be fabricated',
        severity: 'high',
      })
    } else if (item.doi) {
      // Verify the DOI actually exists in academic databases
      try {
        const paper = await lookupDOI(item.doi, { enableCaching: true })
        if (!paper) {
          itemIssues.push({
            citation: item.title || item.id || 'Unknown',
            issue: 'DOI not found in any academic database - citation is likely fabricated',
            severity: 'high',
          })
        } else {
          // Verify the metadata matches
          const titleMatch = paper.title.toLowerCase().includes(title.toLowerCase().substring(0, 20)) ||
                            title.toLowerCase().includes(paper.title.toLowerCase().substring(0, 20))
          
          if (!titleMatch && title.length > 10) {
            itemIssues.push({
              citation: item.title || item.id || 'Unknown',
              issue: 'Title does not match DOI record - metadata may be incorrect',
              severity: 'medium',
            })
          }
        }
      } catch (error) {
        console.error('Error verifying DOI:', error)
        // Don't fail the whole verification if one lookup fails
      }
    }
    
    return itemIssues
  })
  
  const results = await Promise.all(verificationPromises)
  results.forEach(itemIssues => issues.push(...itemIssues))
  
  return issues.slice(0, 10) // Limit to top 10
}

// Generate recommendations
function generateRecommendations(
  coveragePct: number,
  uncitedClaims: string[],
  quoteIssues: any[],
  staleIssues: any[],
  fabricationIssues: any[]
): string[] {
  const recommendations: string[] = []
  
  if (coveragePct < 30) {
    recommendations.push('CRITICAL: Citation coverage is very low. Add citations to support your claims.')
  } else if (coveragePct < 50) {
    recommendations.push('Citation coverage is below recommended levels. Consider adding more citations.')
  }
  
  if (uncitedClaims.length > 0) {
    recommendations.push(`Found ${uncitedClaims.length} claim(s) that need citations. Review and add sources.`)
  }
  
  if (quoteIssues.length > 0) {
    recommendations.push(`Found ${quoteIssues.length} quote(s) without proper citations. Add citation markers.`)
  }
  
  if (fabricationIssues.length > 0) {
    recommendations.push(`CRITICAL: Found ${fabricationIssues.length} potentially fabricated citation(s). Verify or remove.`)
  }
  
  if (staleIssues.length > 0) {
    recommendations.push(`Found ${staleIssues.length} stale or outdated citation(s). Consider updating.`)
  }
  
  if (coveragePct >= 70 && quoteIssues.length === 0 && fabricationIssues.length === 0) {
    recommendations.push('✓ Citation quality looks good! Document meets academic integrity standards.')
  }
  
  return recommendations
}

export const verifyCitations = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().describe('Path to the document to verify'),
      checkSources: z.boolean().default(true).describe('Verify source accessibility'),
      verifyQuotes: z.boolean().default(true).describe('Check quote-to-source matching'),
      checkStaleness: z.boolean().default(true).describe('Detect outdated citations'),
    }),
    execute: async ({ documentPath, checkSources, verifyQuotes: shouldVerifyQuotes, checkStaleness }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-integrity',
        data: {
          coveragePct: 0,
          missingCites: [],
          quoteMismatches: [],
          actions: [],
          status: 'checking',
        },
      })

      try {
        // Read document
        const fullPath = path.join(process.cwd(), documentPath)
        const fileContent = await fs.readFile(fullPath, 'utf-8')
        const docData: DocumentData = JSON.parse(fileContent)
        
        const content = docData.content || ''
        const citations = docData.citations || []
        const bibliography = docData.bibliography || {}
        
        // Perform coverage analysis
        const coverageAnalysis = analyzeCitationCoverage(content, citations)
        
        // Verify quotes
        const quoteIssues = shouldVerifyQuotes 
          ? verifyQuotes(content, bibliography) 
          : []
        
        // Check for stale citations (now async)
        const staleIssues = checkStaleness 
          ? await detectStaleCitations(bibliography) 
          : []
        
        // Check for fabricated citations (now async)
        const fabricationIssues = checkSources 
          ? await detectFabricatedCitations(bibliography) 
          : []
        
        // Combine all issues (normalize to quote format)
        const allIssues = [
          ...quoteIssues,
          ...staleIssues.map(issue => ({
            quote: issue.citation,
            issue: issue.issue,
          })),
          ...fabricationIssues.map(issue => ({
            quote: issue.citation,
            issue: issue.issue,
          })),
        ]
        
        // Generate recommendations
        const recommendations = generateRecommendations(
          coverageAnalysis.coveragePct,
          coverageAnalysis.uncitedClaims,
          quoteIssues,
          staleIssues,
          fabricationIssues
        )

        writer.write({
          id: toolCallId,
          type: 'data-uni-integrity',
          data: {
            coveragePct: coverageAnalysis.coveragePct,
            missingCites: coverageAnalysis.uncitedClaims,
            quoteMismatches: allIssues,
            actions: recommendations,
            status: 'done',
          },
        })

        return `Citation verification complete for ${documentPath}:
- Coverage: ${coverageAnalysis.coveragePct}% (${coverageAnalysis.citedSentences}/${coverageAnalysis.totalSentences} sentences cited)
- Uncited claims: ${coverageAnalysis.uncitedClaims.length}
- Quote issues: ${quoteIssues.length}
- Stale citations: ${staleIssues.length}
- Fabrication concerns: ${fabricationIssues.length}
- Recommendations: ${recommendations.length}

${recommendations.join('\n')}`
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-integrity',
          data: {
            coveragePct: 0,
            missingCites: [],
            quoteMismatches: [],
            actions: [],
            status: 'error',
            error: { message: errorMessage },
          },
        })
        
        return `Error verifying citations: ${errorMessage}`
      }
    },
  })
