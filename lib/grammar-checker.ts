/**
 * Grammar and Style Checker for Academic Writing
 * Local implementation without external API dependencies
 */

import { getSentences, getWords } from './readability-metrics'

export interface GrammarIssue {
  type: 'grammar' | 'style' | 'spelling' | 'clarity' | 'passive'
  severity: 'error' | 'warning' | 'suggestion'
  message: string
  suggestion?: string
  position?: { start: number; end: number }
  sentence?: string
}

/**
 * Check for passive voice constructions
 */
export function detectPassiveVoice(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  const sentences = getSentences(text)
  
  // Common passive voice patterns
  const passivePatterns = [
    /\b(is|are|was|were|been|be)\s+(\w+ed|shown|given|taken|made|done|seen|found|used|considered)\b/gi,
    /\b(is|are|was|were|been|be)\s+being\s+\w+ed\b/gi,
  ]
  
  for (const sentence of sentences) {
    for (const pattern of passivePatterns) {
      const matches = sentence.matchAll(pattern)
      for (const match of matches) {
        issues.push({
          type: 'passive',
          severity: 'suggestion',
          message: 'Consider using active voice for clearer, more direct writing',
          sentence: sentence.substring(0, 100) + (sentence.length > 100 ? '...' : ''),
          suggestion: 'Rewrite in active voice (subject performs the action)',
        })
      }
    }
  }
  
  return issues
}

/**
 * Check for common grammar mistakes
 */
export function checkCommonGrammarErrors(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  
  // Common grammar patterns to check
  const patterns = [
    {
      regex: /\b(their|they're|there)\b/gi,
      check: (match: string, context: string) => {
        // Simple heuristic checks
        if (match.toLowerCase() === 'their' && /\s+is\b/i.test(context)) {
          return 'Possible confusion: "their" vs "there/they\'re"'
        }
        return null
      },
    },
    {
      regex: /\b(your|you're)\b/gi,
      check: (match: string, context: string) => {
        if (match.toLowerCase() === 'your' && /\s+(a|the|very)\b/i.test(context)) {
          return 'Possible confusion: "your" vs "you\'re"'
        }
        return null
      },
    },
    {
      regex: /\b(its|it's)\b/gi,
      check: (match: string, context: string) => {
        if (match.toLowerCase() === 'its' && /\s+(a|the|not|very)\b/i.test(context)) {
          return 'Possible confusion: "its" (possessive) vs "it\'s" (it is)'
        }
        return null
      },
    },
    {
      regex: /\bthen\b/gi,
      check: (match: string, context: string) => {
        if (/\bmore\s+\w+\s+then\b/i.test(context)) {
          return 'Use "than" for comparisons, "then" for time sequence'
        }
        return null
      },
    },
  ]
  
  const sentences = getSentences(text)
  for (const sentence of sentences) {
    for (const pattern of patterns) {
      const matches = sentence.matchAll(pattern.regex)
      for (const match of matches) {
        const context = sentence.slice(
          Math.max(0, match.index! - 20),
          Math.min(sentence.length, match.index! + match[0].length + 20)
        )
        const error = pattern.check(match[0], context)
        if (error) {
          issues.push({
            type: 'grammar',
            severity: 'warning',
            message: error,
            sentence: sentence.substring(0, 100),
          })
        }
      }
    }
  }
  
  return issues
}

/**
 * Check sentence structure and clarity
 */
export function checkSentenceStructure(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  const sentences = getSentences(text)
  
  for (const sentence of sentences) {
    const words = getWords(sentence)
    
    // Check for overly long sentences
    if (words.length > 40) {
      issues.push({
        type: 'clarity',
        severity: 'warning',
        message: `Long sentence (${words.length} words). Consider breaking into shorter sentences for clarity.`,
        sentence: sentence.substring(0, 100) + '...',
        suggestion: 'Break into 2-3 shorter sentences',
      })
    }
    
    // Check for very short sentences (might be fragments)
    if (words.length < 4 && !sentence.match(/^(yes|no|perhaps|however|therefore|thus|hence|indeed)\b/i)) {
      issues.push({
        type: 'grammar',
        severity: 'suggestion',
        message: 'Very short sentence. Ensure it is a complete thought.',
        sentence,
      })
    }
    
    // Check for repeated words
    const wordCounts = new Map<string, number>()
    for (const word of words) {
      if (word.length > 3) { // Ignore short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    }
    
    for (const [word, count] of wordCounts) {
      if (count >= 3) {
        issues.push({
          type: 'style',
          severity: 'suggestion',
          message: `Word "${word}" repeated ${count} times in one sentence. Consider using synonyms.`,
          sentence: sentence.substring(0, 100),
        })
      }
    }
  }
  
  return issues
}

/**
 * Check for academic writing style issues
 */
export function checkAcademicStyle(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  const sentences = getSentences(text)
  
  // Check for informal contractions
  const contractions = /\b(don't|doesn't|didn't|won't|can't|couldn't|shouldn't|wouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)\b/gi
  
  for (const sentence of sentences) {
    const matches = sentence.matchAll(contractions)
    for (const match of matches) {
      issues.push({
        type: 'style',
        severity: 'warning',
        message: `Avoid contractions in academic writing: "${match[0]}"`,
        sentence: sentence.substring(0, 100),
        suggestion: 'Write out the full form (e.g., "do not" instead of "don\'t")',
      })
    }
    
    // Check for first/second person (usually avoided in academic writing)
    if (/\b(I|me|my|mine|we|us|our|you|your|yours)\b/i.test(sentence)) {
      issues.push({
        type: 'style',
        severity: 'suggestion',
        message: 'Consider using third person instead of first/second person in formal academic writing',
        sentence: sentence.substring(0, 100),
        suggestion: 'Use "the researcher", "the study", "one", etc.',
      })
    }
    
    // Check for vague quantifiers
    if (/\b(a lot|lots of|many|some|few)\b/i.test(sentence) && !/\b(in many cases|many studies|few studies)\b/i.test(sentence)) {
      issues.push({
        type: 'clarity',
        severity: 'suggestion',
        message: 'Consider using specific numbers or more precise quantifiers',
        sentence: sentence.substring(0, 100),
        suggestion: 'Use specific numbers, percentages, or terms like "approximately", "several", "numerous"',
      })
    }
    
    // Check for hedging words (good in moderation)
    const hedgingCount = (sentence.match(/\b(perhaps|possibly|probably|maybe|might|could|may)\b/gi) || []).length
    if (hedgingCount >= 3) {
      issues.push({
        type: 'style',
        severity: 'suggestion',
        message: 'Excessive hedging detected. Use cautiously to maintain authority.',
        sentence: sentence.substring(0, 100),
      })
    }
  }
  
  return issues
}

/**
 * Check for wordy phrases that can be simplified
 */
export function checkWordiness(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = []
  
  const wordyPhrases: Record<string, string> = {
    'in order to': 'to',
    'due to the fact that': 'because',
    'at this point in time': 'now',
    'in the event that': 'if',
    'for the purpose of': 'to',
    'in spite of the fact that': 'although',
    'with regard to': 'regarding',
    'it is important to note that': '(remove)',
    'it should be noted that': '(remove)',
    'a number of': 'several',
    'in the process of': '(remove)',
    'on a daily basis': 'daily',
  }
  
  const sentences = getSentences(text)
  
  for (const sentence of sentences) {
    for (const [wordy, concise] of Object.entries(wordyPhrases)) {
      const regex = new RegExp('\\b' + wordy + '\\b', 'gi')
      if (regex.test(sentence)) {
        issues.push({
          type: 'clarity',
          severity: 'suggestion',
          message: `Wordy phrase: "${wordy}"`,
          sentence: sentence.substring(0, 100),
          suggestion: concise === '(remove)' ? 'Remove this phrase' : `Consider using "${concise}" instead`,
        })
      }
    }
  }
  
  return issues
}

/**
 * Run all grammar and style checks
 */
export function checkGrammarAndStyle(text: string): {
  issues: GrammarIssue[]
  summary: {
    errors: number
    warnings: number
    suggestions: number
    passiveVoiceCount: number
  }
} {
  const allIssues: GrammarIssue[] = [
    ...detectPassiveVoice(text),
    ...checkCommonGrammarErrors(text),
    ...checkSentenceStructure(text),
    ...checkAcademicStyle(text),
    ...checkWordiness(text),
  ]
  
  // Deduplicate issues with the same sentence and message
  const uniqueIssues: GrammarIssue[] = []
  const seen = new Set<string>()
  
  for (const issue of allIssues) {
    const key = `${issue.sentence}:${issue.message}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueIssues.push(issue)
    }
  }
  
  const summary = {
    errors: uniqueIssues.filter(i => i.severity === 'error').length,
    warnings: uniqueIssues.filter(i => i.severity === 'warning').length,
    suggestions: uniqueIssues.filter(i => i.severity === 'suggestion').length,
    passiveVoiceCount: uniqueIssues.filter(i => i.type === 'passive').length,
  }
  
  return { issues: uniqueIssues, summary }
}
