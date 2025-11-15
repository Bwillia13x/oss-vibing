import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './analyze-argument-structure.md'
import z from 'zod/v3'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { 
  DocumentSection, 
  JsonDocument, 
  ArgumentStructureAnalysis 
} from './types'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const analyzeArgumentStructure = ({ writer: _writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().describe('Path to document file to analyze'),
      discipline: z.enum(['STEM', 'Humanities', 'Social Sciences', 'General'])
        .default('General')
        .describe('Academic discipline for specialized analysis'),
      focusAreas: z.array(z.enum(['thesis', 'claims', 'evidence', 'logic', 'counterarguments', 'all']))
        .default(['all'])
        .describe('Specific aspects of argument to analyze'),
    }),
    execute: async ({ documentPath, discipline, focusAreas }, { toolCallId: _toolCallId }) => {
      try {
        // Read the document
        const fullPath = path.resolve(documentPath)
        if (!existsSync(fullPath)) {
          throw new Error(`Document not found: ${documentPath}`)
        }
        
        const content = await readFile(fullPath, 'utf-8')
        
        // Parse JSON document if applicable
        let text = content
        let sections: Array<{ title: string; content: string }> = []
        
        if (fullPath.endsWith('.json')) {
          try {
            const doc: JsonDocument = JSON.parse(content)
            if (doc.sections) {
              sections = doc.sections.map((s) => ({
                title: s.title || 'Untitled',
                content: s.content || ''
              }))
              text = sections.map(s => s.content).join('\n\n')
            } else if (doc.content) {
              text = doc.content
            }
          } catch (_parseError) {
            text = content
          }
        }
        
        if (!text || text.trim().length === 0) {
          throw new Error('Document is empty or could not be parsed')
        }
        
        const shouldAnalyzeAll = focusAreas.includes('all')
        
        // Analyze argument structure
        const analysis: ArgumentStructureAnalysis = {
          status: 'complete',
          discipline,
          documentPath,
        }
        
        // 1. Thesis Analysis
        if (shouldAnalyzeAll || focusAreas.includes('thesis')) {
          const thesisAnalysis = analyzeThesis(text, sections, discipline)
          analysis.thesis = thesisAnalysis
        }
        
        // 2. Claims Analysis
        if (shouldAnalyzeAll || focusAreas.includes('claims')) {
          const claimsAnalysis = analyzeClaims(text, sections)
          analysis.claims = claimsAnalysis
        }
        
        // 3. Evidence Analysis
        if (shouldAnalyzeAll || focusAreas.includes('evidence')) {
          const evidenceAnalysis = analyzeEvidence(text, discipline)
          analysis.evidence = evidenceAnalysis
        }
        
        // 4. Logical Flow Analysis
        if (shouldAnalyzeAll || focusAreas.includes('logic')) {
          const logicAnalysis = analyzeLogicalFlow(sections, text)
          analysis.logicalFlow = logicAnalysis
        }
        
        // 5. Counterarguments Analysis
        if (shouldAnalyzeAll || focusAreas.includes('counterarguments')) {
          const counterargAnalysis = analyzeCounterarguments(text)
          analysis.counterarguments = counterargAnalysis
        }
        
        // Calculate overall argument strength score
        const strengthScore = calculateArgumentStrength(analysis)
        analysis.overallStrength = {
          score: strengthScore,
          rating: getStrengthRating(strengthScore),
          summary: generateStrengthSummary(analysis, strengthScore),
        }
        
        // Build response message
        const message = formatAnalysisMessage(analysis, documentPath)
        
        return message
        
      } catch (error) {
        throw error
      }
    },
  })

// Helper functions for argument analysis

function analyzeThesis(text: string, sections: Array<{ title: string; content: string }>, discipline: string) {
  // Look for thesis statement (typically in introduction)
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  
  // Heuristics for thesis identification
  const thesisIndicators = [
    /this (?:paper|essay|study|research) (?:argues|demonstrates|shows|explores|examines|investigates)/i,
    /the (?:main|primary|central) argument (?:is|of this)/i,
    /(?:I|we) argue that/i,
    /this (?:paper|essay|study) (?:will|aims to)/i,
  ]
  
  let thesisFound = false
  let thesisStatement = ''
  let thesisClarity = 'unclear'
  
  for (const paragraph of paragraphs.slice(0, 5)) {
    for (const indicator of thesisIndicators) {
      if (indicator.test(paragraph)) {
        thesisFound = true
        thesisStatement = paragraph.trim()
        thesisClarity = 'clear'
        break
      }
    }
    if (thesisFound) break
  }
  
  // Assess thesis characteristics
  const hasSpecificity = thesisStatement.length > 50 && thesisStatement.length < 300
  const isArgumentative = /\b(?:should|must|argue|demonstrate|show|prove)\b/i.test(thesisStatement)
  const isDebatable = !(/\b(?:is|are|was|were)\b/.test(thesisStatement) && thesisStatement.split(' ').length < 15)
  
  return {
    present: thesisFound,
    statement: thesisStatement.slice(0, 500),
    clarity: thesisClarity as 'clear' | 'unclear' | 'absent',
    strength: (isArgumentative && isDebatable ? 'strong' : hasSpecificity ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
    specificity: (hasSpecificity ? 'specific' : 'general') as 'specific' | 'general' | 'vague',
    recommendations: generateThesisRecommendations(thesisFound, thesisStatement, discipline),
  }
}

function analyzeClaims(text: string, _sections: Array<{ title: string; content: string }>) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  
  // Identify claims (sentences that make assertions)
  const claimIndicators = [
    /^(?:First|Second|Third|Additionally|Furthermore|Moreover|In addition),/i,
    /\b(?:demonstrates|shows|proves|indicates|suggests|reveals)\b/i,
    /\b(?:evidence shows|research indicates|studies demonstrate)\b/i,
  ]
  
  const claims: Array<{ text: string; type: string; support: string; strength: string }> = []
  
  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    for (const sentence of sentences) {
      for (const indicator of claimIndicators) {
        if (indicator.test(sentence)) {
          const hasEvidence = /\b(?:study|research|data|evidence|source|citation)\b/i.test(sentence)
          claims.push({
            text: sentence.trim().slice(0, 200),
            type: hasEvidence ? 'evidenced' : 'assertion',
            support: hasEvidence ? 'supported' : 'unsupported',
            strength: hasEvidence ? 'strong' : 'moderate',
          })
          break
        }
      }
    }
  }
  
  return {
    count: claims.length,
    claims: claims.slice(0, 10), // Top 10 claims
  }
}

function analyzeEvidence(text: string, discipline: string) {
  // Count evidence types
  const empiricalEvidence = (text.match(/\b(?:study|experiment|data|survey|test|measurement)\b/gi) || []).length
  const theoreticalEvidence = (text.match(/\b(?:theory|model|framework|concept|principle)\b/gi) || []).length
  const statisticalEvidence = (text.match(/\b(?:significant|correlation|p-value|statistical|percentage|rate)\b/gi) || []).length
  const citationCount = (text.match(/\[[\d,\s]+\]|\([\w\s,]+\d{4}\)/g) || []).length
  
  const totalEvidence = empiricalEvidence + theoreticalEvidence + statisticalEvidence
  const evidenceDensity = text.length > 0 ? (totalEvidence / (text.length / 1000)) : 0
  
  // Determine if evidence is appropriate for discipline
  const appropriateForDiscipline = (discipline === 'STEM' && statisticalEvidence > empiricalEvidence * 0.3) ||
                                   (discipline === 'Humanities' && theoreticalEvidence > 0) ||
                                   (discipline === 'Social Sciences' && empiricalEvidence > 0)
  
  // Determine quality based on evidence density and appropriateness
  let quality: 'strong' | 'moderate' | 'weak'
  if (evidenceDensity > 10 && appropriateForDiscipline && citationCount > 5) {
    quality = 'strong'
  } else if (evidenceDensity > 5 || citationCount > 2) {
    quality = 'moderate'
  } else {
    quality = 'weak'
  }
  
  return {
    types: {
      empirical: empiricalEvidence,
      theoretical: theoreticalEvidence,
      statistical: statisticalEvidence,
    },
    quality,
    recommendations: generateEvidenceRecommendations(
      { empirical: empiricalEvidence, theoretical: theoreticalEvidence, statistical: statisticalEvidence },
      citationCount,
      discipline
    ),
  }
}

function analyzeLogicalFlow(sections: Array<{ title: string; content: string }>, text: string) {
  const transitionWords = [
    'however', 'therefore', 'thus', 'consequently', 'moreover', 'furthermore',
    'in addition', 'on the other hand', 'nevertheless', 'in contrast'
  ]
  
  let transitionCount = 0
  for (const word of transitionWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches) transitionCount += matches.length
  }
  
  const totalSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length
  const transitionDensity = totalSentences > 0 ? (transitionCount / totalSentences) * 100 : 0
  
  return {
    transitionsUsed: transitionCount,
    transitionDensity: Math.round(transitionDensity * 10) / 10,
    quality: transitionDensity > 5 ? 'good' : transitionDensity > 2 ? 'fair' : 'needs improvement',
    recommendations: generateLogicalFlowRecommendations(transitionDensity),
  }
}

function analyzeCounterarguments(text: string) {
  const counterargIndicators = [
    /\b(?:however|although|while|despite|critics argue|some claim|opponents suggest)\b/gi,
    /\b(?:on the other hand|in contrast|alternatively)\b/gi,
    /\b(?:it (?:could|might) be argued)\b/gi,
  ]
  
  let counterargCount = 0
  let rebuttalCount = 0
  
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  
  for (const paragraph of paragraphs) {
    for (const indicator of counterargIndicators) {
      const matches = paragraph.match(indicator)
      if (matches) {
        counterargCount += matches.length
        // Check for rebuttals nearby
        if (/\b(?:nevertheless|nonetheless|yet|but|still|refute|counter)\b/i.test(paragraph)) {
          rebuttalCount++
        }
      }
    }
  }
  
  return {
    counterargumentsFound: counterargCount,
    rebuttalsFound: rebuttalCount,
    quality: counterargCount > 0 ? 'present' : 'absent',
    balance: counterargCount > 0 && rebuttalCount >= counterargCount * 0.7 ? 'balanced' : 'unbalanced',
    recommendations: generateCounterargsRecommendations(counterargCount, rebuttalCount),
  }
}

function calculateArgumentStrength(analysis: ArgumentStructureAnalysis): number {
  let score = 0
  
  // Thesis strength (30 points)
  if (analysis.thesis) {
    if (analysis.thesis.present) score += 15
    if (analysis.thesis.clarity === 'clear') score += 5
    if (analysis.thesis.specificity === 'specific') score += 5
    if (analysis.thesis.characteristics.argumentative) score += 3
    if (analysis.thesis.characteristics.debatable) score += 2
  }
  
  // Claims strength (25 points)
  if (analysis.claims) {
    const claimScore = Math.min(analysis.claims.totalClaims * 2, 15)
    score += claimScore
    const evidencedRatio = analysis.claims.totalClaims > 0 
      ? analysis.claims.distribution.evidenced / analysis.claims.totalClaims 
      : 0
    score += evidencedRatio * 10
  }
  
  // Evidence strength (25 points)
  if (analysis.evidence) {
    if (analysis.evidence.quality === 'appropriate') score += 10
    score += Math.min(analysis.evidence.citations * 0.5, 10)
    score += Math.min(analysis.evidence.density, 5)
  }
  
  // Logical flow (10 points)
  if (analysis.logicalFlow) {
    if (analysis.logicalFlow.quality === 'good') score += 10
    else if (analysis.logicalFlow.quality === 'fair') score += 5
  }
  
  // Counterarguments (10 points)
  if (analysis.counterarguments) {
    if (analysis.counterarguments.quality === 'present') score += 5
    if (analysis.counterarguments.balance === 'balanced') score += 5
  }
  
  return Math.min(Math.round(score), 100)
}

function getStrengthRating(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 50) return 'Developing'
  return 'Needs Improvement'
}

function generateStrengthSummary(analysis: ArgumentStructureAnalysis, score: number): string {
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (analysis.thesis?.present && analysis.thesis?.clarity === 'clear') {
    strengths.push('clear thesis statement')
  } else {
    weaknesses.push('thesis needs clarification')
  }
  
  if (analysis.claims?.distribution.evidenced > analysis.claims?.distribution.assertions) {
    strengths.push('well-supported claims')
  } else if (analysis.claims?.totalClaims > 0) {
    weaknesses.push('claims need more evidence')
  }
  
  if (analysis.evidence?.quality === 'appropriate') {
    strengths.push('appropriate evidence for discipline')
  } else {
    weaknesses.push('evidence quality needs improvement')
  }
  
  if (analysis.logicalFlow?.quality === 'good') {
    strengths.push('strong logical flow')
  } else {
    weaknesses.push('improve transitions between ideas')
  }
  
  if (analysis.counterarguments?.quality === 'present') {
    strengths.push('addresses counterarguments')
  } else {
    weaknesses.push('add counterarguments and rebuttals')
  }
  
  let summary = `Argument Strength: ${score}/100 (${getStrengthRating(score)})\n\n`
  
  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.join(', ')}\n`
  }
  
  if (weaknesses.length > 0) {
    summary += `Areas for Improvement: ${weaknesses.join(', ')}`
  }
  
  return summary
}

function formatAnalysisMessage(analysis: ArgumentStructureAnalysis, documentPath: string): string {
  let message = `# Argument Structure Analysis: ${path.basename(documentPath)}\n\n`
  
  message += `${analysis.overallStrength.summary}\n\n`
  
  if (analysis.thesis) {
    message += `## Thesis Analysis\n`
    message += `Status: ${analysis.thesis.found ? '✓ Found' : '✗ Not found'}\n`
    if (analysis.thesis.found) {
      message += `Clarity: ${analysis.thesis.clarity}\n`
      message += `Specific: ${analysis.thesis.characteristics.specific ? 'Yes' : 'No'}\n`
      message += `Argumentative: ${analysis.thesis.characteristics.argumentative ? 'Yes' : 'No'}\n`
      message += `Debatable: ${analysis.thesis.characteristics.debatable ? 'Yes' : 'No'}\n`
    }
    message += `\nRecommendations:\n${analysis.thesis.recommendations}\n\n`
  }
  
  if (analysis.claims) {
    message += `## Claims Analysis\n`
    message += `Total Claims: ${analysis.claims.totalClaims}\n`
    message += `Evidenced Claims: ${analysis.claims.distribution.evidenced}\n`
    message += `Unsupported Assertions: ${analysis.claims.distribution.assertions}\n`
    message += `\nRecommendations:\n${analysis.claims.recommendations}\n\n`
  }
  
  if (analysis.evidence) {
    message += `## Evidence Analysis\n`
    message += `Empirical: ${analysis.evidence.types.empirical}\n`
    message += `Theoretical: ${analysis.evidence.types.theoretical}\n`
    message += `Statistical: ${analysis.evidence.types.statistical}\n`
    message += `Citations: ${analysis.evidence.citations}\n`
    message += `Evidence Density: ${analysis.evidence.density} per 1000 words\n`
    message += `Quality: ${analysis.evidence.quality}\n`
    message += `\nRecommendations:\n${analysis.evidence.recommendations}\n\n`
  }
  
  if (analysis.logicalFlow) {
    message += `## Logical Flow\n`
    message += `Transitions Used: ${analysis.logicalFlow.transitionsUsed}\n`
    message += `Transition Density: ${analysis.logicalFlow.transitionDensity}%\n`
    message += `Quality: ${analysis.logicalFlow.quality}\n`
    message += `\nRecommendations:\n${analysis.logicalFlow.recommendations}\n\n`
  }
  
  if (analysis.counterarguments) {
    message += `## Counterarguments\n`
    message += `Counterarguments: ${analysis.counterarguments.counterargumentsFound}\n`
    message += `Rebuttals: ${analysis.counterarguments.rebuttalsFound}\n`
    message += `Balance: ${analysis.counterarguments.balance}\n`
    message += `\nRecommendations:\n${analysis.counterarguments.recommendations}\n\n`
  }
  
  return message
}

// Recommendation generators
function generateThesisRecommendations(found: boolean, statement: string, discipline: string): string[] {
  if (!found) {
    return [
      'Add a clear thesis statement in the introduction that states your main argument',
      'Make it specific and debatable',
      `For ${discipline}, ensure it aligns with field conventions`
    ]
  }
  
  const recs: string[] = []
  
  if (statement.length < 50) {
    recs.push('Expand thesis to be more specific and detailed')
  }
  if (statement.length > 300) {
    recs.push('Condense thesis to be more concise and focused')
  }
  if (!/\b(?:argue|demonstrate|show)\b/i.test(statement)) {
    recs.push('Make thesis more argumentative (use "argues," "demonstrates," etc.)')
  }
  
  return recs.length > 0 ? recs : ['Thesis is strong; maintain clarity throughout paper']
}

function generateClaimsRecommendations(claims: Array<{ type: string; strength: string }>): string[] {
  const evidencedRatio = claims.length > 0 
    ? claims.filter(c => c.type === 'evidenced').length / claims.length 
    : 0
  
  if (claims.length < 3) {
    return [
      'Add more supporting claims to strengthen your argument',
      'Each major section should have at least one clear claim'
    ]
  }
  
  if (evidencedRatio < 0.6) {
    return [
      'Support more claims with evidence from sources',
      'Use empirical data, expert testimony, or scholarly research',
      'Add citations to strengthen assertions'
    ]
  }
  
  return ['Claims are well-supported; continue this pattern throughout']
}

function generateEvidenceRecommendations(
  types: { empirical: number; theoretical: number; statistical: number },
  citations: number,
  discipline: string
): string[] {
  const recs: string[] = []
  
  if (citations < 5) {
    recs.push('Add more citations to support your claims (aim for at least 1-2 per paragraph)')
  }
  
  if (discipline === 'STEM' && types.statistical < types.empirical * 0.3) {
    recs.push('Include more statistical evidence (STEM papers benefit from quantitative data)')
  }
  
  if (discipline === 'Humanities' && types.theoretical === 0) {
    recs.push('Incorporate more theoretical frameworks to contextualize your analysis')
  }
  
  if (discipline === 'Social Sciences' && types.empirical === 0) {
    recs.push('Add empirical evidence from studies or surveys')
  }
  
  return recs.length > 0 ? recs : ['Evidence is appropriate for your discipline']
}

function generateLogicalFlowRecommendations(density: number): string {
  if (density < 2) {
    return '- Add more transition words to improve flow between ideas\n- Use "however," "therefore," "moreover," etc.\n- Connect paragraphs with bridging sentences'
  }
  
  if (density > 10) {
    return '- Reduce overuse of transition words; let logic speak for itself\n- Ensure transitions are meaningful, not formulaic'
  }
  
  return '- Logical flow is good; maintain consistency'
}

function generateCounterargsRecommendations(counterargCount: number, rebuttalCount: number): string {
  if (counterargCount === 0) {
    return '- Address potential counterarguments to strengthen your position\n- Consider opposing views and explain why your argument is stronger\n- This demonstrates critical thinking and fairness'
  }
  
  if (rebuttalCount < counterargCount * 0.5) {
    return '- Add rebuttals to the counterarguments you\'ve raised\n- Don\'t just mention opposing views—explain why they\'re insufficient\n- Use phrases like "however," "nevertheless," "this objection fails because..."'
  }
  
  return '- Counterarguments and rebuttals are well-balanced'
}
