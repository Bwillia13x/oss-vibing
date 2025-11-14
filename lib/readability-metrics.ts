/**
 * Readability Metrics for Academic Writing
 * Implements various readability formulas and text analysis
 */

interface ReadabilityScores {
  fleschReadingEase: number
  fleschKincaidGrade: number
  gunningFog: number
  smogIndex: number
  colemanLiauIndex: number
  automatedReadabilityIndex: number
}

interface TextStatistics {
  sentences: number
  words: number
  syllables: number
  characters: number
  complexWords: number // 3+ syllables
  averageWordsPerSentence: number
  averageSyllablesPerWord: number
}

/**
 * Count syllables in a word using a simplified algorithm.
 * Assumes all 1-2 letter words are monosyllabic (1 syllable).
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().trim()
  if (word.length <= 2) return 1
  
  // Remove trailing e
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  
  // Match vowel groups
  const syllableMatches = word.match(/[aeiouy]{1,2}/g)
  return syllableMatches ? syllableMatches.length : 1
}

/**
 * Split text into sentences
 */
export function getSentences(text: string): string[] {
  // Handle abbreviations and common patterns
  const processed = text
    .replace(/Dr\./g, 'Dr_')
    .replace(/Mr\./g, 'Mr_')
    .replace(/Mrs\./g, 'Mrs_')
    .replace(/Ms\./g, 'Ms_')
    .replace(/Ph\.D\./g, 'PhD_')
    .replace(/e\.g\./g, 'eg_')
    .replace(/i\.e\./g, 'ie_')
    .replace(/etc\./g, 'etc_')
    .replace(/vs\./g, 'vs_')
  
  // Split on sentence boundaries
  const sentences = processed
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  return sentences
}

/**
 * Split text into words
 */
export function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
}

/**
 * Calculate text statistics
 */
export function calculateStatistics(text: string): TextStatistics {
  const sentences = getSentences(text)
  const words = getWords(text)
  
  let totalSyllables = 0
  let complexWords = 0
  
  for (const word of words) {
    const syllables = countSyllables(word)
    totalSyllables += syllables
    if (syllables >= 3) {
      complexWords++
    }
  }
  
  const characters = text.replace(/\s/g, '').length
  
  return {
    sentences: sentences.length || 1,
    words: words.length,
    syllables: totalSyllables,
    characters,
    complexWords,
    averageWordsPerSentence: words.length / (sentences.length || 1),
    averageSyllablesPerWord: totalSyllables / (words.length || 1),
  }
}

/**
 * Flesch Reading Ease Score
 * 90-100: Very Easy (5th grade)
 * 80-89: Easy (6th grade)
 * 70-79: Fairly Easy (7th grade)
 * 60-69: Standard (8th-9th grade)
 * 50-59: Fairly Difficult (10th-12th grade)
 * 30-49: Difficult (College)
 * 0-29: Very Difficult (College graduate)
 */
export function calculateFleschReadingEase(stats: TextStatistics): number {
  const score = 206.835 
    - 1.015 * stats.averageWordsPerSentence
    - 84.6 * stats.averageSyllablesPerWord
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Flesch-Kincaid Grade Level
 * Returns the U.S. school grade level needed to understand the text
 */
export function calculateFleschKincaidGrade(stats: TextStatistics): number {
  const grade = 0.39 * stats.averageWordsPerSentence
    + 11.8 * stats.averageSyllablesPerWord
    - 15.59
  
  return Math.max(0, grade)
}

/**
 * Gunning Fog Index
 * Estimates years of formal education needed to understand the text
 */
export function calculateGunningFog(stats: TextStatistics): number {
  const complexWordRatio = stats.complexWords / stats.words
  const fog = 0.4 * (stats.averageWordsPerSentence + 100 * complexWordRatio)
  
  return Math.max(0, fog)
}

/**
 * SMOG (Simple Measure of Gobbledygook) Index
 * Estimates years of education needed to understand the text
 * Note: SMOG requires at least 30 sentences for accurate calculation
 */
export function calculateSmogIndex(stats: TextStatistics): number {
  if (stats.sentences < 30) return 0
  
  const polysyllables = stats.complexWords
  const smog = 1.0430 * Math.sqrt(polysyllables * (30 / stats.sentences)) + 3.1291
  
  return Math.max(0, smog)
}

/**
 * Coleman-Liau Index
 * Based on characters rather than syllables
 */
export function calculateColemanLiau(stats: TextStatistics): number {
  const L = (stats.characters / stats.words) * 100 // avg letters per 100 words
  const S = (stats.sentences / stats.words) * 100 // avg sentences per 100 words
  
  const cli = 0.0588 * L - 0.296 * S - 15.8
  
  return Math.max(0, cli)
}

/**
 * Automated Readability Index (ARI)
 */
export function calculateARI(stats: TextStatistics): number {
  const ari = 4.71 * (stats.characters / stats.words)
    + 0.5 * (stats.words / stats.sentences)
    - 21.43
  
  return Math.max(0, ari)
}

/**
 * Calculate all readability scores
 */
export function calculateReadabilityScores(text: string): {
  statistics: TextStatistics
  scores: ReadabilityScores
  interpretation: string
} {
  const statistics = calculateStatistics(text)
  
  const scores: ReadabilityScores = {
    fleschReadingEase: calculateFleschReadingEase(statistics),
    fleschKincaidGrade: calculateFleschKincaidGrade(statistics),
    gunningFog: calculateGunningFog(statistics),
    smogIndex: calculateSmogIndex(statistics),
    colemanLiauIndex: calculateColemanLiau(statistics),
    automatedReadabilityIndex: calculateARI(statistics),
  }
  
  // Provide interpretation
  let interpretation = ''
  const avgGrade = (
    scores.fleschKincaidGrade +
    scores.gunningFog +
    scores.smogIndex +
    scores.colemanLiauIndex +
    scores.automatedReadabilityIndex
  ) / 5
  
  if (avgGrade < 6) {
    interpretation = 'Very easy to read - suitable for elementary students'
  } else if (avgGrade < 9) {
    interpretation = 'Easy to read - suitable for middle school'
  } else if (avgGrade < 12) {
    interpretation = 'Standard difficulty - suitable for high school'
  } else if (avgGrade < 16) {
    interpretation = 'Fairly difficult - suitable for college students'
  } else {
    interpretation = 'Difficult - requires college-level education'
  }
  
  return { statistics, scores, interpretation }
}

/**
 * Get readability recommendation for academic writing
 */
export function getAcademicReadabilityRecommendation(
  scores: ReadabilityScores,
  discipline?: string
): string {
  const avgGrade = (
    scores.fleschKincaidGrade +
    scores.gunningFog +
    scores.smogIndex
  ) / 3
  
  // Academic writing typically ranges from grade 12-16
  if (avgGrade < 12) {
    return 'Text may be too simple for academic writing. Consider using more sophisticated vocabulary and complex sentence structures.'
  } else if (avgGrade > 18) {
    return 'Text may be too complex. Consider breaking up long sentences and using clearer language for better comprehension.'
  } else {
    return 'Readability is appropriate for academic writing at the college level.'
  }
}
