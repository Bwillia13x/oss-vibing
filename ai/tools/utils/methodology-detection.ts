/**
 * Detects the research methodology used in a paper based on text analysis.
 * Checks for common methodology-related keywords in the text.
 * 
 * @param text - The text to analyze (typically title, abstract, or combined)
 * @returns The detected methodology type
 */
export function detectMethodology(text: string): string {
  const lower = text.toLowerCase()
  
  if (lower.includes('survey') || lower.includes('questionnaire')) return 'Survey'
  if (lower.includes('experiment') || lower.includes('rct') || lower.includes('randomized')) return 'Experimental'
  if (lower.includes('interview') || lower.includes('qualitative')) return 'Qualitative'
  if (lower.includes('meta-analysis') || lower.includes('systematic review')) return 'Meta-Analysis'
  if (lower.includes('case study')) return 'Case Study'
  if (lower.includes('simulation') || lower.includes('modeling')) return 'Simulation'
  if (lower.includes('observational') || lower.includes('longitudinal')) return 'Observational'
  if (lower.includes('theoretical') || lower.includes('conceptual')) return 'Theoretical'
  if (lower.includes('mixed method')) return 'Mixed Methods'
  
  return 'Other'
}
