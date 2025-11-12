import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './verify-citations.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

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

// Analyze citation coverage in document
function analyzeCitationCoverage(content: string, citations: any[]): {
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
  const citationPattern = /\([^)]*\d{4}[^)]*\)|\[[^\]]*\d+[^\]]*\]/
  const citedSentences = sentences.filter(s => citationPattern.test(s))
  
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
    const hasCitation = citationPattern.test(sentence)
    
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
function verifyQuotes(content: string, bibliography: any): Array<{
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
    
    const citationPattern = /\([^)]*\d{4}[^)]*\)|\[[^\]]*\d+[^\]]*\]/
    const hasCitation = citationPattern.test(context)
    
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
function detectStaleCitations(bibliography: any): Array<{
  citation: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}> {
  const issues: Array<{ citation: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  if (!bibliography?.items || !Array.isArray(bibliography.items)) {
    return issues
  }
  
  const currentYear = new Date().getFullYear()
  
  bibliography.items.forEach((item: any) => {
    // Check for missing DOI or URL
    if (!item.doi && !item.url) {
      issues.push({
        citation: item.title || item.id || 'Unknown',
        issue: 'Missing DOI or URL - citation not verifiable',
        severity: 'medium',
      })
    }
    
    // Check for very old citations (> 10 years for most fields)
    if (item.year && currentYear - item.year > 10) {
      issues.push({
        citation: item.title || item.id || 'Unknown',
        issue: `Citation is ${currentYear - item.year} years old - may be outdated`,
        severity: 'low',
      })
    }
    
    // Check if citation was fetched long ago (stale cache)
    if (item.timestamp) {
      const fetchDate = new Date(item.timestamp)
      const daysSinceFetch = (Date.now() - fetchDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceFetch > 90) {
        issues.push({
          citation: item.title || item.id || 'Unknown',
          issue: `Citation metadata is ${Math.round(daysSinceFetch)} days old - should be re-verified`,
          severity: 'low',
        })
      }
    }
  })
  
  return issues.slice(0, 10) // Limit to top 10
}

// Detect potentially fabricated citations
function detectFabricatedCitations(bibliography: any): Array<{
  citation: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}> {
  const issues: Array<{ citation: string; issue: string; severity: 'high' | 'medium' | 'low' }> = []
  
  if (!bibliography?.items || !Array.isArray(bibliography.items)) {
    return issues
  }
  
  bibliography.items.forEach((item: any) => {
    // Check for suspicious patterns
    
    // Missing critical fields
    if (!item.title || !item.author) {
      issues.push({
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
      issues.push({
        citation: item.title || item.id || 'Unknown',
        issue: 'Contains placeholder text - likely not a real source',
        severity: 'high',
      })
    }
    
    // Invalid DOI format (if DOI is present)
    if (item.doi && !/^10\.\d{4,}\//.test(item.doi)) {
      issues.push({
        citation: item.title || item.id || 'Unknown',
        issue: 'Invalid DOI format - citation may be fabricated',
        severity: 'high',
      })
    }
  })
  
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
        
        // Check for stale citations
        const staleIssues = checkStaleness 
          ? detectStaleCitations(bibliography) 
          : []
        
        // Check for fabricated citations
        const fabricationIssues = checkSources 
          ? detectFabricatedCitations(bibliography) 
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
