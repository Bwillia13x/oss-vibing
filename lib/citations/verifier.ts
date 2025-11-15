/**
 * Citation Verifier - Phase 5.3.2
 * 
 * Comprehensive citation verification system for academic integrity.
 * 
 * Features:
 * - Citation coverage analysis
 * - Quote-to-source verification
 * - Stale citation detection with API checks
 * - Fabrication detection with DOI validation
 * - Citation quality scoring
 * - Recommendation generation
 * 
 * @module lib/citations/verifier
 */

import { lookupDOI, validateDOI } from '../api/citation-client'
import type { CitationInput } from './formatter'

/**
 * Citation verification result
 */
export interface VerificationResult {
  // Overall metrics
  coveragePct: number
  totalSentences: number
  citedSentences: number
  
  // Issues found
  uncitedClaims: UncitedClaim[]
  quoteIssues: QuoteIssue[]
  staleCitations: StaleCitation[]
  fabricatedCitations: FabricatedCitation[]
  
  // Quality metrics
  qualityScore: number  // 0-100
  integrityScore: number  // 0-100
  
  // Recommendations
  recommendations: string[]
  
  // Summary
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

/**
 * Uncited claim detected in document
 */
export interface UncitedClaim {
  text: string
  position?: number
  severity: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Quote verification issue
 */
export interface QuoteIssue {
  quote: string
  position?: number
  issue: string
  severity: 'high' | 'medium' | 'low'
}

/**
 * Stale or outdated citation
 */
export interface StaleCitation {
  citationId: string
  title?: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  age?: number  // Years since publication
  lastChecked?: Date
}

/**
 * Potentially fabricated citation
 */
export interface FabricatedCitation {
  citationId: string
  title?: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  confidence: number  // 0-1, how confident we are it's fabricated
}

/**
 * Verification options
 */
export interface VerificationOptions {
  checkCoverage?: boolean
  checkQuotes?: boolean
  checkStaleness?: boolean
  checkFabrication?: boolean
  checkDOIValidity?: boolean
  coverageThreshold?: number  // Minimum coverage % (default: 50)
  stalenessYears?: number  // Max age in years (default: 10)
  enableAPIChecks?: boolean  // Use external APIs for validation (default: true)
}

/**
 * Citation pattern regex - matches common citation formats
 */
const CITATION_PATTERNS = {
  authorDate: /\([^)]*\d{4}[^)]*\)/g,  // (Author, 2024) or (Author 2024)
  numbered: /\[[^\]]*\d+[^\]]*\]/g,    // [1] or [1, 2]
  superscript: /\d+/g,                  // Superscript numbers (harder to detect)
}

/**
 * Claim indicator keywords - phrases that typically require citations
 */
const CLAIM_KEYWORDS = [
  'research shows',
  'studies indicate',
  'studies show',
  'evidence suggests',
  'data demonstrates',
  'data shows',
  'findings reveal',
  'findings show',
  'according to',
  'research indicates',
  'proven',
  'demonstrated',
  'established',
  'documented',
  'confirmed',
  'verified',
  'shown to',
  'found that',
  'discovered',
  'observed',
  'reported',
  'concluded',
]

/**
 * Analyze citation coverage in document content
 * 
 * @param content - Document text content
 * @param citations - Array of citations in document
 * @param options - Verification options
 * @returns Coverage analysis result
 */
export function analyzeCitationCoverage(
  content: string,
  citations: CitationInput[],
  _options: VerificationOptions = {}
): {
  totalSentences: number
  citedSentences: number
  coveragePct: number
  uncitedClaims: UncitedClaim[]
} {
  if (!content || content.trim() === '') {
    return {
      totalSentences: 0,
      citedSentences: 0,
      coveragePct: 0,
      uncitedClaims: [],
    }
  }
  
  // Split content into sentences
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Ignore very short fragments
  
  // Count sentences with citations
  const citedSentences = sentences.filter(sentence => {
    return (
      CITATION_PATTERNS.authorDate.test(sentence) ||
      CITATION_PATTERNS.numbered.test(sentence)
    )
  })
  
  // Find uncited claims
  const uncitedClaims: UncitedClaim[] = []
  
  sentences.forEach((sentence, idx) => {
    const hasCitation = 
      CITATION_PATTERNS.authorDate.test(sentence) ||
      CITATION_PATTERNS.numbered.test(sentence)
    
    if (hasCitation) return
    
    // Check for claim keywords
    const lowerSentence = sentence.toLowerCase()
    const claimKeyword = CLAIM_KEYWORDS.find(keyword => 
      lowerSentence.includes(keyword)
    )
    
    if (claimKeyword) {
      uncitedClaims.push({
        text: sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''),
        position: idx,
        severity: 'high',
        reason: `Contains claim indicator "${claimKeyword}" without citation`,
      })
    }
    
    // Check for numerical data without citation
    const hasNumbers = /\d+(\.\d+)?%|\d+(\.\d+)?\s*(times|fold|percent)/i.test(sentence)
    if (hasNumbers && lowerSentence.length > 50) {
      uncitedClaims.push({
        text: sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''),
        position: idx,
        severity: 'medium',
        reason: 'Contains numerical data without citation',
      })
    }
  })
  
  const coveragePct = sentences.length > 0
    ? (citedSentences.length / sentences.length) * 100
    : 0
  
  return {
    totalSentences: sentences.length,
    citedSentences: citedSentences.length,
    coveragePct: Math.round(coveragePct * 10) / 10,
    uncitedClaims: uncitedClaims.slice(0, 20), // Limit to top 20
  }
}

/**
 * Verify quotes have proper citations
 * 
 * @param content - Document text content
 * @returns Object with totalQuotes and issues array
 */
export function verifyQuotes(content: string): { totalQuotes: number; issues: QuoteIssue[] } {
  if (!content) return { totalQuotes: 0, issues: [] }
  
  const issues: QuoteIssue[] = []
  let totalQuotes = 0
  
  // Find quoted text (both single and double quotes)
  const quotePatterns = [
    /"([^"]{20,}?)"/g,   // Double quotes
    /'([^']{20,}?)'/g,   // Single quotes
    /«([^»]{20,}?)»/g,   // Guillemets
  ]
  
  quotePatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      totalQuotes++
      const quote = match[1]
      const quoteStart = match.index
      
      // Check for citation within 100 characters after quote
      const contextEnd = Math.min(content.length, quoteStart + match[0].length + 100)
      const context = content.substring(quoteStart, contextEnd)
      
      const hasCitation = 
        CITATION_PATTERNS.authorDate.test(context) ||
        CITATION_PATTERNS.numbered.test(context)
      
      if (!hasCitation) {
        issues.push({
          quote: quote.substring(0, 100) + (quote.length > 100 ? '...' : ''),
          position: quoteStart,
          issue: 'Direct quote lacks citation',
          severity: 'high',
        })
      } else {
        // Check if page number is provided (for longer quotes)
        if (quote.length > 100 && !context.includes('p.') && !context.includes('pp.')) {
          issues.push({
            quote: quote.substring(0, 100) + '...',
            position: quoteStart,
            issue: 'Long quote should include page number',
            severity: 'medium',
          })
        }
      }
    }
  })
  
  return {
    totalQuotes,
    issues: issues.slice(0, 20) // Limit to top 20
  }
}

/**
 * Detect stale or outdated citations
 * 
 * @param citations - Array of citations
 * @param options - Verification options
 * @returns Array of stale citations
 */
export async function detectStaleCitations(
  citations: CitationInput[],
  options: VerificationOptions = {}
): Promise<StaleCitation[]> {
  const issues: StaleCitation[] = []
  const currentYear = new Date().getFullYear()
  const maxAge = options.stalenessYears || 10
  const enableAPIChecks = options.enableAPIChecks !== false
  
  for (const citation of citations) {
    const citationId = citation.id || citation.title
    
    // Check for missing DOI or URL
    if (!citation.doi && !citation.url) {
      issues.push({
        citationId,
        title: citation.title,
        issue: 'Missing DOI or URL - citation not verifiable',
        severity: 'medium',
      })
    }
    
    // Check age
    if (citation.year) {
      const age = currentYear - citation.year
      if (age > maxAge) {
        issues.push({
          citationId,
          title: citation.title,
          issue: `Citation is ${age} years old - may be outdated`,
          severity: age > 15 ? 'medium' : 'low',
          age,
        })
      }
    }
    
    // Validate DOI if present and API checks enabled
    if (citation.doi && enableAPIChecks && options.checkDOIValidity !== false) {
      try {
        const isValid = await validateDOI(citation.doi)
        if (!isValid) {
          issues.push({
            citationId,
            title: citation.title,
            issue: 'DOI not found in citation databases - may be invalid or retracted',
            severity: 'high',
          })
        }
      } catch (error) {
        // API error - skip validation
        console.warn(`Could not validate DOI ${citation.doi}:`, error)
      }
    }
    
    // Check for broken URLs (if URL is provided and no DOI)
    if (citation.url && !citation.doi && enableAPIChecks) {
      // Note: Actual URL checking would require HTTP requests
      // For now, just check format
      try {
        new URL(citation.url)
      } catch {
        issues.push({
          citationId,
          title: citation.title,
          issue: 'Invalid URL format',
          severity: 'medium',
        })
      }
    }
  }
  
  return issues.slice(0, 20) // Limit to top 20
}

/**
 * Detect potentially fabricated citations (alias)
 * 
 * @param citations - Array of citations
 * @param options - Verification options
 * @returns Array of potentially fabricated citations
 */
export async function detectFabrication(
  citations: CitationInput[],
  options: VerificationOptions = {}
): Promise<FabricatedCitation[]> {
  return detectFabricatedCitations(citations, options)
}

/**
 * Detect potentially fabricated citations
 * 
 * @param citations - Array of citations
 * @param options - Verification options
 * @returns Array of potentially fabricated citations
 */
export async function detectFabricatedCitations(
  citations: CitationInput[],
  options: VerificationOptions = {}
): Promise<FabricatedCitation[]> {
  const issues: FabricatedCitation[] = []
  const enableAPIChecks = options.enableAPIChecks !== false
  
  for (const citation of citations) {
    const citationId = citation.id || citation.title
    let confidence = 0
    const reasons: string[] = []
    
    // Check for missing critical fields
    if (!citation.title || citation.title.trim() === '') {
      confidence += 0.4
      reasons.push('missing title')
    }
    
    if (!citation.authors || citation.authors.length === 0) {
      confidence += 0.4
      reasons.push('missing authors')
    }
    
    // Check for placeholder text
    const placeholderPatterns = [
      /untitled/i,
      /unknown author/i,
      /test/i,
      /example/i,
      /placeholder/i,
      /lorem ipsum/i,
      /sample/i,
    ]
    
    const title = citation.title || ''
    const authorText = citation.authors?.map(a => `${a.given} ${a.family} ${a.literal || ''}`).join(' ') || ''
    
    if (placeholderPatterns.some(pattern => pattern.test(title))) {
      confidence += 0.5
      reasons.push('placeholder title')
    }
    
    if (placeholderPatterns.some(pattern => pattern.test(authorText))) {
      confidence += 0.5
      reasons.push('placeholder author')
    }
    
    // Check DOI format if present
    if (citation.doi) {
      const validDOIPattern = /^10\.\d{4,}\/[\w\-\.]+$/
      if (!validDOIPattern.test(citation.doi)) {
        confidence += 0.3
        reasons.push('invalid DOI format')
      }
      
      // Verify DOI exists (if API checks enabled)
      if (enableAPIChecks && options.checkDOIValidity !== false) {
        try {
          const paper = await lookupDOI(citation.doi)
          if (!paper) {
            confidence += 0.6
            reasons.push('DOI not found in databases')
          } else {
            // Compare metadata
            if (paper.title && title) {
              const titleSimilarity = calculateTitleSimilarity(paper.title, title)
              if (titleSimilarity < 0.5) {
                confidence += 0.4
                reasons.push('DOI title mismatch')
              }
            }
          }
        } catch (error) {
          // API error - skip verification
          console.warn(`Could not verify DOI ${citation.doi}:`, error)
        }
      }
    }
    
    // Check for impossible dates
    if (citation.year) {
      const currentYear = new Date().getFullYear()
      if (citation.year > currentYear + 1 || citation.year < 1800) {
        confidence += 0.5
        reasons.push('impossible publication year')
      }
    }
    
    // Check for generic or suspicious titles
    const genericTitlePatterns = [
      /^the study$/i,
      /^research$/i,
      /^article$/i,
      /^paper$/i,
      /^untitled$/i,
    ]
    
    if (genericTitlePatterns.some(pattern => pattern.test(title))) {
      confidence += 0.4
      reasons.push('generic title')
    }
    
    // If confidence is high enough, report as potentially fabricated
    if (confidence >= 0.4) {
      issues.push({
        citationId,
        title: citation.title,
        issue: `Potentially fabricated: ${reasons.join(', ')}`,
        severity: confidence >= 0.7 ? 'high' : 'medium',
        confidence: Math.min(confidence, 1.0),
      })
    }
  }
  
  return issues.slice(0, 20) // Limit to top 20
}

/**
 * Calculate title similarity (simple Levenshtein-based)
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim()
  const t2 = title2.toLowerCase().trim()
  
  if (t1 === t2) return 1.0
  
  // Simple word overlap ratio
  const words1 = new Set(t1.split(/\s+/))
  const words2 = new Set(t2.split(/\s+/))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Calculate quality score based on citations
 * 
 * @param citations - Array of citations
 * @returns Quality score (0-100)
 */
export function calculateQualityScore(citations: CitationInput[] | CitationInput): number {
  // Handle single citation or array
  const citationArray = Array.isArray(citations) ? citations : [citations]
  
  if (citationArray.length === 0) return 0
  
  let score = 0
  let maxScore = 0
  
  citationArray.forEach(citation => {
    // Has DOI or URL: +10 points
    if (citation.doi || citation.url) {
      score += 10
    }
    maxScore += 10
    
    // Has full author names: +5 points
    if (citation.authors?.length > 0 && citation.authors[0].given) {
      score += 5
    }
    maxScore += 5
    
    // Has journal/publisher: +5 points
    if (citation.journal || citation.publisher) {
      score += 5
    }
    maxScore += 5
    
    // Has year: +5 points
    if (citation.year) {
      score += 5
    }
    maxScore += 5
    
    // Recent publication (last 5 years): +5 points
    if (citation.year && new Date().getFullYear() - citation.year <= 5) {
      score += 5
    }
    maxScore += 5
  })
  
  return Math.round((score / maxScore) * 100)
}

/**
 * Calculate integrity score based on issues found
 * 
 * @param result - Verification result
 * @returns Integrity score (0-100)
 */
export function calculateIntegrityScore(result: Partial<VerificationResult>): number {
  let score = 100
  
  // Deduct for coverage issues
  if (result.coveragePct !== undefined && result.coveragePct < 50) {
    score -= (50 - result.coveragePct) * 0.5
  }
  
  // Deduct for uncited claims
  const uncitedCount = result.uncitedClaims?.length || 0
  score -= Math.min(uncitedCount * 2, 20)
  
  // Deduct for quote issues
  const quoteCount = result.quoteIssues?.length || 0
  score -= Math.min(quoteCount * 3, 30)
  
  // Deduct for fabricated citations
  const fabricatedCount = result.fabricatedCitations?.length || 0
  score -= Math.min(fabricatedCount * 10, 40)
  
  return Math.max(0, Math.round(score))
}

/**
 * Generate recommendations based on verification results
 * 
 * @param result - Verification result
 * @returns Array of recommendations
 */
export function generateRecommendations(result: Partial<VerificationResult>): string[] {
  const recommendations: string[] = []
  
  // Coverage recommendations
  if (result.coveragePct !== undefined) {
    if (result.coveragePct < 30) {
      recommendations.push('🔴 CRITICAL: Citation coverage is very low (<30%). Add citations to support your claims.')
    } else if (result.coveragePct < 50) {
      recommendations.push('🟡 WARNING: Citation coverage is below recommended levels (<50%). Consider adding more citations.')
    } else if (result.coveragePct >= 70) {
      recommendations.push('✅ Good citation coverage (>70%).')
    }
  }
  
  // Uncited claims
  const uncitedCount = result.uncitedClaims?.length || 0
  if (uncitedCount > 0) {
    recommendations.push(`📝 Found ${uncitedCount} claim(s) that need citations. Review and add supporting sources.`)
  }
  
  // Quote issues
  const quoteCount = result.quoteIssues?.length || 0
  if (quoteCount > 0) {
    recommendations.push(`💬 Found ${quoteCount} quote(s) without proper citations. Add citation markers immediately after quotes.`)
  }
  
  // Fabrication issues
  const fabricatedCount = result.fabricatedCitations?.length || 0
  if (fabricatedCount > 0) {
    recommendations.push(`🔴 CRITICAL: Found ${fabricatedCount} potentially fabricated citation(s). Verify or remove these sources immediately.`)
  }
  
  // Stale citations
  const staleCount = result.staleCitations?.length || 0
  if (staleCount > 0) {
    recommendations.push(`⏰ Found ${staleCount} stale or outdated citation(s). Consider updating with recent sources.`)
  }
  
  // Overall assessment
  if (result.integrityScore !== undefined) {
    if (result.integrityScore >= 90) {
      recommendations.push('🎉 Excellent! Document meets high academic integrity standards.')
    } else if (result.integrityScore >= 70) {
      recommendations.push('👍 Good academic integrity. Minor improvements recommended.')
    } else if (result.integrityScore >= 50) {
      recommendations.push('⚠️ Fair academic integrity. Several improvements needed.')
    } else {
      recommendations.push('❌ Poor academic integrity. Significant improvements required before submission.')
    }
  }
  
  return recommendations
}

/**
 * Perform comprehensive citation verification
 * 
 * @param content - Document text content
 * @param citations - Array of citations
 * @param options - Verification options
 * @returns Complete verification result
 */
export async function verifyCitations(
  content: string,
  citations: CitationInput[],
  options: VerificationOptions = {}
): Promise<VerificationResult> {
  // Set defaults
  const opts: VerificationOptions = {
    checkCoverage: true,
    checkQuotes: true,
    checkStaleness: true,
    checkFabrication: true,
    checkDOIValidity: true,
    coverageThreshold: 50,
    stalenessYears: 10,
    enableAPIChecks: true,
    ...options,
  }
  
  // Run all checks in parallel
  const [
    coverageResult,
    quoteResult,
    staleCitations,
    fabricatedCitations,
  ] = await Promise.all([
    opts.checkCoverage
      ? Promise.resolve(analyzeCitationCoverage(content, citations, opts))
      : Promise.resolve({ totalSentences: 0, citedSentences: 0, coveragePct: 0, uncitedClaims: [] }),
    opts.checkQuotes
      ? Promise.resolve(verifyQuotes(content))
      : Promise.resolve({ totalQuotes: 0, issues: [] }),
    opts.checkStaleness
      ? detectStaleCitations(citations, opts)
      : Promise.resolve([]),
    opts.checkFabrication
      ? detectFabricatedCitations(citations, opts)
      : Promise.resolve([]),
  ])
  
  // Calculate scores
  const qualityScore = calculateQualityScore(citations)
  
  const result: VerificationResult = {
    coveragePct: coverageResult.coveragePct,
    totalSentences: coverageResult.totalSentences,
    citedSentences: coverageResult.citedSentences,
    uncitedClaims: coverageResult.uncitedClaims,
    quoteIssues: quoteResult.issues,
    staleCitations,
    fabricatedCitations,
    qualityScore,
    integrityScore: 0,  // Will be calculated below
    recommendations: [],
    status: 'good',  // Will be determined below
  }
  
  // Calculate integrity score
  result.integrityScore = calculateIntegrityScore(result)
  
  // Generate recommendations
  result.recommendations = generateRecommendations(result)
  
  // Determine overall status
  if (result.integrityScore >= 90) {
    result.status = 'excellent'
  } else if (result.integrityScore >= 70) {
    result.status = 'good'
  } else if (result.integrityScore >= 50) {
    result.status = 'fair'
  } else if (result.integrityScore >= 30) {
    result.status = 'poor'
  } else {
    result.status = 'critical'
  }
  
  return result
}
