/**
 * Citation Management System - Phase 5.3
 * 
 * Complete citation management solution for Vibe University.
 * Provides industry-standard citation formatting and comprehensive verification.
 * 
 * @module lib/citations
 */

// Export formatter
export {
  // Types
  type CitationStyle,
  type CitationType,
  type Author,
  type CitationInput,
  type CSLItem,
  type FormatOptions,
  type BibliographyOptions,
  
  // Formatting functions
  convertToCSL,
  convertFromCSL,
  generateCitationId,
  formatCitation,
  formatBibliography,
  formatInTextCitation,
  validateCitation,
  getStyleInfo,
  detectCitationStyle,
  parseAuthors,
  exportCitation,
} from './formatter'

// Export verifier
export {
  // Types
  type VerificationResult,
  type UncitedClaim,
  type QuoteIssue,
  type StaleCitation,
  type FabricatedCitation,
  type VerificationOptions,
  
  // Verification functions
  analyzeCitationCoverage,
  verifyQuotes,
  detectStaleCitations,
  detectFabricatedCitations,
  calculateQualityScore,
  calculateIntegrityScore,
  generateRecommendations,
  verifyCitations,
} from './verifier'

/**
 * Citation Management System
 * 
 * Example usage:
 * 
 * ```typescript
 * import {
 *   formatCitation,
 *   formatBibliography,
 *   verifyCitations,
 *   type CitationInput
 * } from '@/lib/citations'
 * 
 * // Format a single citation
 * const citation: CitationInput = {
 *   title: 'Climate Change and Global Warming',
 *   authors: [{ family: 'Smith', given: 'John' }],
 *   year: 2023,
 *   journal: 'Nature',
 *   doi: '10.1000/xyz'
 * }
 * 
 * const apa = formatCitation(citation, { style: 'apa', type: 'in-text' })
 * // Returns: "(Smith, 2023)"
 * 
 * const mla = formatCitation(citation, { style: 'mla', type: 'in-text' })
 * // Returns: "(Smith)"
 * 
 * // Format bibliography
 * const bib = formatBibliography([citation], { style: 'apa', sort: true })
 * 
 * // Verify citations in document
 * const result = await verifyCitations(
 *   documentContent,
 *   [citation],
 *   {
 *     checkCoverage: true,
 *     checkQuotes: true,
 *     checkStaleness: true,
 *     checkFabrication: true
 *   }
 * )
 * 
 * console.log(`Coverage: ${result.coveragePct}%`)
 * console.log(`Integrity Score: ${result.integrityScore}`)
 * console.log(`Status: ${result.status}`)
 * console.log(`Recommendations:`, result.recommendations)
 * ```
 */
