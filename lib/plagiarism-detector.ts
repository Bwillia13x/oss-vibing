/**
 * Plagiarism Detection System
 * Local implementation for detecting potential plagiarism issues
 */

import { getSentences, getWords } from './readability-metrics'

export interface PlagiarismIssue {
  type: 'uncited_quote' | 'missing_citation' | 'close_paraphrase' | 'suspicious_similarity'
  severity: 'high' | 'medium' | 'low'
  text: string
  context: string
  suggestion: string
  confidence: number // 0-1
}

export interface PlagiarismReport {
  originalityScore: number // 0-100, higher is better
  issues: PlagiarismIssue[]
  statistics: {
    totalSentences: number
    suspiciousSentences: number
    uncitedQuotes: number
    missingCitations: number
    overallRisk: 'low' | 'medium' | 'high'
  }
}

/**
 * Detect direct quotes without proper citations
 * Looks for quoted text and checks if a citation follows
 */
export function detectUncitedQuotes(text: string): PlagiarismIssue[] {
  const issues: PlagiarismIssue[] = []
  
  // Pattern: "quoted text" or "quoted text" (curly quotes) or 'quoted text' without (Author, Year) or [1] following
  const quotePattern = /["""']([^"""']{20,})["""']/g
  const matches = [...text.matchAll(quotePattern)]
  
  for (const match of matches) {
    const quote = match[1]
    const endIndex = match.index! + match[0].length
    const following = text.slice(endIndex, endIndex + 50)
    
    // Check if there's a citation immediately after
    const hasCitation = /^\s*\([\w\s,]+,?\s*\d{4}\)|^\s*\[\d+\]/.test(following)
    
    if (!hasCitation && quote.length > 30) {
      issues.push({
        type: 'uncited_quote',
        severity: 'high',
        text: quote,
        context: text.slice(Math.max(0, match.index! - 30), endIndex + 30),
        suggestion: 'Add proper citation after the quote (Author, Year) or [reference number]',
        confidence: 0.85,
      })
    }
  }
  
  return issues
}

/**
 * Detect sentences with factual claims that lack citations
 */
export function detectMissingCitations(text: string): PlagiarismIssue[] {
  const issues: PlagiarismIssue[] = []
  const sentences = getSentences(text)
  
  // Keywords that often indicate factual claims requiring citations
  const claimKeywords = [
    /\bstudies? (show|indicate|suggest|demonstrate|reveal|found)/i,
    /\bresearch (shows|indicates|suggests|demonstrates|reveals|found)/i,
    /\baccording to research\b/i,
    /\b(data|evidence|findings) (show|indicate|suggest|demonstrate|reveal)/i,
    /\bscientists? (found|discovered|determined|concluded)/i,
    /\bexperts? (say|claim|argue|suggest)/i,
    /\bit (has been|is) (shown|demonstrated|proven|established)/i,
    /\b\d+(\.\d+)?\s*%(percent|percentage)/i, // statistics
    /\bapproximately \d+/i, // specific numbers
  ]
  
  for (const sentence of sentences) {
    // Skip if sentence already has a citation
    if (/\([\w\s,]+,?\s*\d{4}\)|\[\d+\]/.test(sentence)) {
      continue
    }
    
    // Check for claim keywords
    const hasClaim = claimKeywords.some(pattern => pattern.test(sentence))
    
    if (hasClaim) {
      issues.push({
        type: 'missing_citation',
        severity: 'high',
        text: sentence.slice(0, 100) + (sentence.length > 100 ? '...' : ''),
        context: sentence,
        suggestion: 'This factual claim requires a citation to support it',
        confidence: 0.75,
      })
    }
  }
  
  return issues
}

/**
 * Calculate n-gram similarity between two texts
 * Returns similarity score 0-1
 */
function nGramSimilarity(text1: string, text2: string, n: number = 3): number {
  const getNGrams = (text: string, n: number): Set<string> => {
    const words = getWords(text)
    const ngrams = new Set<string>()
    
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ')
      ngrams.add(ngram)
    }
    
    return ngrams
  }
  
  const ngrams1 = getNGrams(text1, n)
  const ngrams2 = getNGrams(text2, n)
  
  if (ngrams1.size === 0 || ngrams2.size === 0) return 0
  
  // Calculate Jaccard similarity
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)))
  const union = new Set([...ngrams1, ...ngrams2])
  
  if (union.size === 0) return 0
  
  return intersection.size / union.size
}

/**
 * Detect close paraphrasing by checking sentence structure similarity
 */
export function detectCloseParaphrasing(text: string, referenceSources?: string[]): PlagiarismIssue[] {
  const issues: PlagiarismIssue[] = []
  
  if (!referenceSources || referenceSources.length === 0) {
    // Without reference sources, check for suspicious patterns within the document
    const sentences = getSentences(text)
    
    // Look for repetitive sentence structures
    // Limit to first 50 sentences to avoid O(n²) performance issues on large documents
    const sentencesToCheck = sentences.slice(0, 50)
    for (let i = 0; i < sentencesToCheck.length; i++) {
      for (let j = i + 1; j < sentencesToCheck.length; j++) {
        const similarity = nGramSimilarity(sentencesToCheck[i], sentencesToCheck[j], 3)
        
        if (similarity > 0.6) {
          issues.push({
            type: 'close_paraphrase',
            severity: 'medium',
            text: sentencesToCheck[i].slice(0, 100),
            context: `Similar to: ${sentencesToCheck[j].slice(0, 100)}`,
            suggestion: 'These sentences are very similar. If paraphrasing the same source, ensure proper citation and more substantial rewording.',
            confidence: similarity,
          })
        }
      }
    }
  } else {
    // Compare against provided reference sources
    const sentences = getSentences(text)
    
    for (const sentence of sentences) {
      for (const source of referenceSources) {
        const sourceSentences = getSentences(source)
        
        for (const sourceSentence of sourceSentences) {
          const similarity = nGramSimilarity(sentence, sourceSentence, 4)
          
          if (similarity > 0.5) {
            issues.push({
              type: 'close_paraphrase',
              severity: similarity > 0.7 ? 'high' : 'medium',
              text: sentence.slice(0, 100),
              context: `Similar to source: ${sourceSentence.slice(0, 100)}`,
              suggestion: 'This text is very similar to a source. Ensure proper paraphrasing and citation.',
              confidence: similarity,
            })
          }
        }
      }
    }
  }
  
  return issues
}

/**
 * Detect suspicious patterns that may indicate plagiarism
 */
export function detectSuspiciousPatterns(text: string): PlagiarismIssue[] {
  const issues: PlagiarismIssue[] = []
  const sentences = getSentences(text)
  
  for (const sentence of sentences) {
    // Check for sudden style changes (e.g., overly sophisticated language)
    const words = getWords(sentence)
    const longWords = words.filter(w => w.length > 12).length
    const longWordRatio = longWords / words.length
    
    // If a sentence has an unusually high ratio of long words, flag it
    if (longWordRatio > 0.3 && words.length > 10) {
      issues.push({
        type: 'suspicious_similarity',
        severity: 'low',
        text: sentence.slice(0, 100),
        context: sentence,
        suggestion: 'This sentence has unusually sophisticated vocabulary. Ensure it\'s properly cited if from a source.',
        confidence: longWordRatio,
      })
    }
    
    // Check for lists without attribution
    const hasListPattern = /\b(first|second|third|finally|lastly|1\.|2\.|3\.)/i.test(sentence)
    const nextSentenceIndex = sentences.indexOf(sentence) + 1
    const hasMultipleListItems = nextSentenceIndex < sentences.length && 
      /\b(second|third|next|additionally|furthermore)/i.test(sentences[nextSentenceIndex])
    
    if (hasListPattern && hasMultipleListItems && !/\([\w\s,]+\d{4}\)|\[\d+\]/.test(sentence)) {
      issues.push({
        type: 'missing_citation',
        severity: 'medium',
        text: sentence.slice(0, 100),
        context: sentence,
        suggestion: 'Lists or series of points often require citations if from a source',
        confidence: 0.5,
      })
    }
  }
  
  return issues
}

/**
 * Generate comprehensive plagiarism report
 */
export function generatePlagiarismReport(
  text: string,
  referenceSources?: string[]
): PlagiarismReport {
  const uncitedQuotes = detectUncitedQuotes(text)
  const missingCitations = detectMissingCitations(text)
  const closeParaphrasing = detectCloseParaphrasing(text, referenceSources)
  const suspiciousPatterns = detectSuspiciousPatterns(text)
  
  const allIssues = [
    ...uncitedQuotes,
    ...missingCitations,
    ...closeParaphrasing,
    ...suspiciousPatterns,
  ]
  
  // Deduplicate similar issues
  const uniqueIssues: PlagiarismIssue[] = []
  const seen = new Set<string>()
  
  for (const issue of allIssues) {
    const key = `${issue.type}:${issue.text.slice(0, 50)}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueIssues.push(issue)
    }
  }
  
  // Sort by severity and confidence
  uniqueIssues.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff
    return b.confidence - a.confidence
  })
  
  const sentences = getSentences(text)
  const suspiciousSentences = new Set(uniqueIssues.map(i => i.text)).size
  
  const highSeverityCount = uniqueIssues.filter(i => i.severity === 'high').length
  const overallRisk: 'low' | 'medium' | 'high' = 
    highSeverityCount > 5 ? 'high' :
    highSeverityCount > 2 ? 'medium' :
    'low'
  
  // Calculate originality score (100 = perfect, 0 = severe issues)
  const originalityScore = Math.max(
    0,
    100 - (
      uncitedQuotes.length * 10 +
      missingCitations.length * 5 +
      closeParaphrasing.filter(i => i.severity === 'high').length * 8 +
      closeParaphrasing.filter(i => i.severity === 'medium').length * 4 +
      suspiciousPatterns.length * 2
    )
  )
  
  return {
    originalityScore: Math.round(originalityScore),
    issues: uniqueIssues,
    statistics: {
      totalSentences: sentences.length,
      suspiciousSentences,
      uncitedQuotes: uncitedQuotes.length,
      missingCitations: missingCitations.length,
      overallRisk,
    },
  }
}

/**
 * Get recommendation based on originality score
 */
export function getOriginalityRecommendation(score: number): string {
  if (score >= 90) {
    return 'Excellent originality. The document shows strong academic integrity.'
  } else if (score >= 75) {
    return 'Good originality. Minor citation issues should be addressed.'
  } else if (score >= 60) {
    return 'Fair originality. Several citation and paraphrasing issues need attention.'
  } else if (score >= 40) {
    return 'Poor originality. Significant plagiarism concerns detected. Major revisions needed.'
  } else {
    return 'Very poor originality. Severe plagiarism issues detected. Document requires complete revision.'
  }
}
