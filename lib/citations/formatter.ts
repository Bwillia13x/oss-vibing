/**
 * Citation Formatter - Phase 5.3.1
 * 
 * Production-ready citation formatting using citation-js library.
 * Supports multiple citation styles: APA, MLA, Chicago, IEEE, Harvard, Vancouver.
 * 
 * Features:
 * - Industry-standard formatting via citation-js
 * - Multiple citation styles with automatic style detection
 * - In-text citations (author-date, numbered, note-based)
 * - Bibliography generation with proper sorting
 * - CSL JSON conversion and validation
 * - Citation metadata extraction
 * 
 * @module lib/citations/formatter
 */

import Cite from 'citation-js'

/**
 * Supported citation styles
 */
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'vancouver'

/**
 * Citation type - used for formatting
 */
export type CitationType = 
  | 'in-text' 
  | 'bibliography' 
  | 'note'

/**
 * Author information
 */
export interface Author {
  given?: string    // First/given name
  family: string    // Last/family name
  literal?: string  // Full name as single string (fallback)
}

/**
 * Citation input format - user-friendly structure
 */
export interface CitationInput {
  // Core fields
  id?: string
  type?: 'article' | 'article-journal' | 'book' | 'chapter' | 'paper-conference' | 'thesis' | 'webpage' | 'report'
  title: string
  authors: Author[]
  
  // Publication info
  year?: number
  month?: number
  day?: number
  
  // Identifiers
  doi?: string
  url?: string
  isbn?: string
  issn?: string
  pmid?: string
  
  // Journal/Publication
  journal?: string
  'container-title'?: string  // Alternative to journal
  volume?: string | number
  issue?: string | number
  pages?: string
  
  // Book-specific
  publisher?: string
  'publisher-place'?: string
  edition?: string | number
  
  // Conference/Thesis
  event?: string
  school?: string
  
  // Additional
  abstract?: string
  keywords?: string[]
  language?: string
  accessed?: string  // ISO date string
}

/**
 * CSL JSON format - standard citation format
 */
export interface CSLItem {
  id: string
  type: string
  title?: string
  author?: Array<{ given?: string; family?: string; literal?: string }>
  issued?: { 'date-parts': number[][] }
  accessed?: { 'date-parts': number[][] }
  DOI?: string
  URL?: string
  ISBN?: string
  ISSN?: string
  PMID?: string
  'container-title'?: string
  volume?: string | number
  issue?: string | number
  page?: string
  publisher?: string
  'publisher-place'?: string
  edition?: string | number
  event?: string
  school?: string
  abstract?: string
  keyword?: string
  language?: string
  [key: string]: any
}

/**
 * Citation format options
 */
export interface FormatOptions {
  style: CitationStyle
  type?: CitationType
  format?: 'text' | 'html' | 'rtf'
  lang?: string
  entry?: string | string[]  // Specific entry IDs to format
}

/**
 * Bibliography generation options
 */
export interface BibliographyOptions extends FormatOptions {
  sort?: boolean
  hanging?: boolean  // Hanging indent
  'line-spacing'?: number
  'entry-spacing'?: number
}

/**
 * Map user-friendly style names to citation-js template names
 */
const STYLE_TEMPLATE_MAP: Record<CitationStyle, string> = {
  apa: 'apa',
  mla: 'mla',
  chicago: 'chicago-note-bibliography',
  ieee: 'ieee',
  harvard: 'harvard1',
  vancouver: 'vancouver',
}

/**
 * Convert CitationInput to CSL JSON format
 * 
 * @param input - User-friendly citation input
 * @returns CSL JSON item
 */
export function convertToCSL(input: CitationInput): CSLItem {
  const cslItem: CSLItem = {
    id: input.id || generateCitationId(input),
    type: input.type || 'article-journal',
    title: input.title,
    author: input.authors,
  }
  
  // Add publication date
  if (input.year) {
    const dateParts: number[] = [input.year]
    if (input.month) dateParts.push(input.month)
    if (input.day) dateParts.push(input.day)
    cslItem.issued = { 'date-parts': [dateParts] }
  }
  
  // Add access date
  if (input.accessed) {
    const accessDate = new Date(input.accessed)
    cslItem.accessed = {
      'date-parts': [[
        accessDate.getFullYear(),
        accessDate.getMonth() + 1,
        accessDate.getDate(),
      ]],
    }
  }
  
  // Add identifiers
  if (input.doi) cslItem.DOI = input.doi
  if (input.url) cslItem.URL = input.url
  if (input.isbn) cslItem.ISBN = input.isbn
  if (input.issn) cslItem.ISSN = input.issn
  if (input.pmid) cslItem.PMID = input.pmid
  
  // Add journal/container info
  if (input.journal) cslItem['container-title'] = input.journal
  if (input['container-title']) cslItem['container-title'] = input['container-title']
  if (input.volume !== undefined) cslItem.volume = String(input.volume)
  if (input.issue !== undefined) cslItem.issue = String(input.issue)
  if (input.pages) cslItem.page = input.pages
  
  // Add book info
  if (input.publisher) cslItem.publisher = input.publisher
  if (input['publisher-place']) cslItem['publisher-place'] = input['publisher-place']
  if (input.edition !== undefined) cslItem.edition = String(input.edition)
  
  // Add conference/thesis info
  if (input.event) cslItem.event = input.event
  if (input.school) cslItem.school = input.school
  
  // Add additional metadata
  if (input.abstract) cslItem.abstract = input.abstract
  if (input.keywords) cslItem.keyword = input.keywords.join(', ')
  if (input.language) cslItem.language = input.language
  
  return cslItem
}

/**
 * Convert CSL JSON to CitationInput
 * 
 * @param csl - CSL JSON item
 * @returns User-friendly citation input
 */
export function convertFromCSL(csl: CSLItem): CitationInput {
  const input: CitationInput = {
    id: csl.id,
    type: csl.type as any,
    title: csl.title || '',
    authors: (csl.author || []).map(a => ({
      given: a.given,
      family: a.family || a.literal || '',
      literal: a.literal,
    })),
  }
  
  // Extract date
  if (csl.issued?.['date-parts']?.[0]) {
    const [year, month, day] = csl.issued['date-parts'][0]
    if (year) input.year = year
    if (month) input.month = month
    if (day) input.day = day
  }
  
  // Extract identifiers
  if (csl.DOI) input.doi = csl.DOI
  if (csl.URL) input.url = csl.URL
  if (csl.ISBN) input.isbn = csl.ISBN
  if (csl.ISSN) input.issn = csl.ISSN
  if (csl.PMID) input.pmid = csl.PMID
  
  // Extract journal info
  if (csl['container-title']) input.journal = csl['container-title']
  if (csl.volume) input.volume = csl.volume
  if (csl.issue) input.issue = csl.issue
  if (csl.page) input.pages = csl.page
  
  // Extract book info
  if (csl.publisher) input.publisher = csl.publisher
  if (csl['publisher-place']) input['publisher-place'] = csl['publisher-place']
  if (csl.edition) input.edition = csl.edition
  
  // Extract conference/thesis info
  if (csl.event) input.event = csl.event
  if (csl.school) input.school = csl.school
  
  // Extract additional metadata
  if (csl.abstract) input.abstract = csl.abstract
  if (csl.keyword) input.keywords = csl.keyword.split(',').map((k: string) => k.trim())
  if (csl.language) input.language = csl.language
  
  return input
}

/**
 * Generate a unique citation ID from citation data
 * 
 * @param input - Citation input
 * @returns Unique ID (e.g., "smith2023climate")
 */
export function generateCitationId(input: CitationInput): string {
  const firstAuthor = input.authors[0]
  const authorPart = firstAuthor?.family?.toLowerCase().replace(/[^a-z]/g, '') || 'unknown'
  const yearPart = input.year || 'nd'
  const titlePart = input.title
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .substring(0, 10)
  
  return `${authorPart}${yearPart}${titlePart}`
}

/**
 * Format a single citation in the specified style
 * 
 * @param input - Citation input
 * @param options - Format options
 * @returns Formatted citation string
 * 
 * @example
 * ```typescript
 * const citation = formatCitation({
 *   title: 'Climate Change Research',
 *   authors: [{ family: 'Smith', given: 'John' }],
 *   year: 2023,
 *   journal: 'Nature',
 * }, { style: 'apa', type: 'in-text' })
 * // Returns: "(Smith, 2023)"
 * ```
 */
export function formatCitation(
  input: CitationInput,
  options: FormatOptions
): string {
  try {
    const cslItem = convertToCSL(input)
    const cite = new Cite(cslItem)
    
    const template = STYLE_TEMPLATE_MAP[options.style] || 'apa'
    const format = options.format || 'text'
    const lang = options.lang || 'en-US'
    
    // Determine citation type for citation-js
    let citationType: 'bibliography' | 'citation' = 'bibliography'
    if (options.type === 'in-text' || options.type === 'note') {
      citationType = 'citation'
    }
    
    const formatted = cite.format(citationType, {
      format,
      template,
      lang,
    })
    
    return formatted.trim()
  } catch (error) {
    console.error('Error formatting citation:', error)
    throw new Error(`Failed to format citation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format multiple citations as a bibliography
 * 
 * @param inputs - Array of citation inputs
 * @param options - Bibliography options
 * @returns Formatted bibliography string
 * 
 * @example
 * ```typescript
 * const bib = formatBibliography([
 *   { title: 'Paper A', authors: [{ family: 'Smith', given: 'John' }], year: 2023 },
 *   { title: 'Paper B', authors: [{ family: 'Jones', given: 'Jane' }], year: 2022 },
 * ], { style: 'apa', sort: true })
 * ```
 */
export function formatBibliography(
  inputs: CitationInput[],
  options: BibliographyOptions
): string {
  try {
    if (inputs.length === 0) {
      return ''
    }
    
    // Convert all inputs to CSL
    const cslItems = inputs.map(convertToCSL)
    
    // Sort if requested (by author, then year)
    if (options.sort !== false) {
      cslItems.sort((a, b) => {
        // Compare first author's family name
        const aAuthor = a.author?.[0]?.family || ''
        const bAuthor = b.author?.[0]?.family || ''
        if (aAuthor !== bAuthor) {
          return aAuthor.localeCompare(bAuthor)
        }
        
        // If same author, compare years
        const aYear = a.issued?.['date-parts']?.[0]?.[0] || 0
        const bYear = b.issued?.['date-parts']?.[0]?.[0] || 0
        return aYear - bYear
      })
    }
    
    // Create citation instance
    const cite = new Cite(cslItems)
    
    const template = STYLE_TEMPLATE_MAP[options.style] || 'apa'
    const format = options.format || 'text'
    const lang = options.lang || 'en-US'
    
    const formatted = cite.format('bibliography', {
      format,
      template,
      lang,
    })
    
    return formatted.trim()
  } catch (error) {
    console.error('Error formatting bibliography:', error)
    throw new Error(`Failed to format bibliography: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format an in-text citation (author-date or numbered)
 * 
 * @param input - Citation input
 * @param style - Citation style
 * @param options - Additional options
 * @returns Formatted in-text citation
 * 
 * @example
 * ```typescript
 * formatInTextCitation(citation, 'apa')  // "(Smith, 2023)"
 * formatInTextCitation(citation, 'mla')  // "(Smith 45)"
 * formatInTextCitation(citation, 'ieee') // "[1]"
 * ```
 */
export function formatInTextCitation(
  input: CitationInput,
  style: CitationStyle,
  options?: {
    pageNumber?: string
    suppressAuthor?: boolean
    prefix?: string
    suffix?: string
  }
): string {
  try {
    const cslItem = convertToCSL(input)
    const cite = new Cite(cslItem)
    
    const template = STYLE_TEMPLATE_MAP[style] || 'apa'
    
    let formatted = cite.format('citation', {
      format: 'text',
      template,
      lang: 'en-US',
    })
    
    // Add page number if provided
    if (options?.pageNumber) {
      formatted = formatted.replace(/\)$/, `, ${options.pageNumber})`)
    }
    
    // Add prefix/suffix
    if (options?.prefix) {
      formatted = `${options.prefix} ${formatted}`
    }
    if (options?.suffix) {
      formatted = `${formatted} ${options.suffix}`
    }
    
    return formatted.trim()
  } catch (error) {
    console.error('Error formatting in-text citation:', error)
    throw new Error(`Failed to format in-text citation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate citation data completeness
 * 
 * @param input - Citation input to validate
 * @returns Validation result with missing fields
 */
export function validateCitation(input: CitationInput): {
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []
  
  // Required fields
  if (!input.title || input.title.trim() === '') {
    missing.push('title')
  }
  
  if (!input.authors || input.authors.length === 0) {
    missing.push('authors')
  } else {
    // Check author structure
    input.authors.forEach((author, idx) => {
      if (!author.family && !author.literal) {
        warnings.push(`Author ${idx + 1} missing family name or literal`)
      }
    })
  }
  
  // Recommended fields
  if (!input.year) {
    warnings.push('Missing publication year')
  }
  
  if (!input.doi && !input.url) {
    warnings.push('Missing DOI or URL - citation not verifiable')
  }
  
  // Type-specific validation
  if (input.type === 'article-journal' || input.type === 'article') {
    if (!input.journal) {
      warnings.push('Journal article missing journal name')
    }
  }
  
  if (input.type === 'book' || input.type === 'chapter') {
    if (!input.publisher) {
      warnings.push('Book missing publisher')
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Get citation style information
 * 
 * @param style - Citation style
 * @returns Style metadata
 */
export function getStyleInfo(style: CitationStyle): {
  name: string
  fullName: string
  type: 'author-date' | 'numbered' | 'note'
  description: string
} {
  const styleInfo = {
    apa: {
      name: 'APA',
      fullName: 'American Psychological Association 7th Edition',
      type: 'author-date' as const,
      description: 'Used in psychology, education, and social sciences',
    },
    mla: {
      name: 'MLA',
      fullName: 'Modern Language Association 9th Edition',
      type: 'author-date' as const,
      description: 'Used in humanities and liberal arts',
    },
    chicago: {
      name: 'Chicago',
      fullName: 'Chicago Manual of Style 17th Edition',
      type: 'note' as const,
      description: 'Used in history, arts, and humanities with footnotes/endnotes',
    },
    ieee: {
      name: 'IEEE',
      fullName: 'Institute of Electrical and Electronics Engineers',
      type: 'numbered' as const,
      description: 'Used in engineering and computer science',
    },
    harvard: {
      name: 'Harvard',
      fullName: 'Harvard Reference System',
      type: 'author-date' as const,
      description: 'Used in various academic fields, especially in UK',
    },
    vancouver: {
      name: 'Vancouver',
      fullName: 'Vancouver/ICMJE Style',
      type: 'numbered' as const,
      description: 'Used in medical and scientific journals',
    },
  }
  
  return styleInfo[style] || styleInfo.apa
}

/**
 * Detect citation style from formatted text
 * 
 * @param text - Sample citation text
 * @returns Detected style or null
 */
export function detectCitationStyle(text: string): CitationStyle | null {
  // APA: (Author, Year) or Author (Year)
  if (/\([A-Z][a-z]+,?\s+\d{4}\)/.test(text) || /[A-Z][a-z]+\s+\(\d{4}\)/.test(text)) {
    return 'apa'
  }
  
  // MLA: (Author Page) or (Author)
  if (/\([A-Z][a-z]+\s+\d+\)/.test(text) || /\([A-Z][a-z]+\)/.test(text)) {
    return 'mla'
  }
  
  // IEEE/Vancouver: [1] or [1, 2]
  if (/\[\d+\]/.test(text) || /\[\d+,\s*\d+\]/.test(text)) {
    // Could be IEEE or Vancouver - hard to distinguish
    return 'ieee'
  }
  
  // Chicago: Footnote style (harder to detect from text alone)
  if (/\d+\.\s+[A-Z]/.test(text)) {
    return 'chicago'
  }
  
  return null
}

/**
 * Parse author string into Author objects
 * 
 * @param authorString - Author string (e.g., "Smith, John & Jones, Jane")
 * @returns Array of Author objects
 */
export function parseAuthors(authorString: string): Author[] {
  // Split by common delimiters
  const authorParts = authorString.split(/\s+(?:and|&)\s+|;\s*/)
  
  return authorParts.map(authorStr => {
    const trimmed = authorStr.trim()
    
    // Try "Last, First" format
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim())
      return {
        family: parts[0],
        given: parts[1] || '',
      }
    }
    
    // Try "First Last" format (assume last word is family name)
    const words = trimmed.split(/\s+/)
    if (words.length >= 2) {
      return {
        given: words.slice(0, -1).join(' '),
        family: words[words.length - 1],
      }
    }
    
    // Single name - use as family name
    return {
      family: trimmed,
    }
  })
}

/**
 * Export citation in different formats
 */
export function exportCitation(
  input: CitationInput,
  format: 'bibtex' | 'ris' | 'json' | 'csl'
): string {
  try {
    const cslItem = convertToCSL(input)
    const cite = new Cite(cslItem)
    
    switch (format) {
      case 'bibtex':
        return cite.format('bibtex')
      case 'ris':
        return cite.format('ris')
      case 'json':
        return JSON.stringify(input, null, 2)
      case 'csl':
        return JSON.stringify(cslItem, null, 2)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  } catch (error) {
    console.error('Error exporting citation:', error)
    throw new Error(`Failed to export citation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
