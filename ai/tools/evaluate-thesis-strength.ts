import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './evaluate-thesis-strength.md'
import z from 'zod/v3'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const evaluateThesisStrength = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().describe('Path to document file containing thesis'),
      thesisStatement: z.string().optional().describe('Optional: explicit thesis statement to evaluate (if not in document)'),
      discipline: z.enum(['STEM', 'Humanities', 'Social Sciences', 'Business', 'General'])
        .default('General')
        .describe('Academic discipline for specialized evaluation'),
      documentType: z.enum(['research-paper', 'essay', 'thesis', 'dissertation', 'proposal', 'general'])
        .default('general')
        .describe('Type of document for context-specific evaluation'),
    }),
    execute: async ({ documentPath, thesisStatement, discipline, documentType }, { toolCallId }) => {
      try {
        let text = ''
        let explicitThesis = thesisStatement
        
        // Read document if path provided
        if (documentPath) {
          const fullPath = path.resolve(documentPath)
          if (!existsSync(fullPath)) {
            throw new Error(`Document not found: ${documentPath}`)
          }
          
          const content = await readFile(fullPath, 'utf-8')
          
          // Parse JSON document if applicable
          if (fullPath.endsWith('.json')) {
            try {
              const doc = JSON.parse(content)
              if (doc.sections) {
                text = doc.sections.map((s: any) => s.content || '').join('\n\n')
              } else if (doc.content) {
                text = doc.content
              }
              // Check for explicit thesis field
              if (doc.thesis) {
                explicitThesis = doc.thesis
              }
            } catch (parseError) {
              text = content
            }
          } else {
            text = content
          }
        }
        
        // Extract thesis if not provided
        if (!explicitThesis) {
          explicitThesis = extractThesisStatement(text)
        }
        
        if (!explicitThesis || explicitThesis.trim().length === 0) {
          return `No thesis statement found in ${documentPath}.\n\n` +
                 `Please ensure your document has a clear thesis statement, typically in the introduction.\n` +
                 `A thesis should state your main argument or claim that the paper will support.`
        }
        
        // Evaluate thesis across multiple dimensions
        const evaluation = {
          thesis: explicitThesis,
          discipline,
          documentType,
          scores: {} as any,
          overallScore: 0,
          overallRating: '',
          strengths: [] as string[],
          weaknesses: [] as string[],
          recommendations: [] as string[],
        }
        
        // 1. Clarity & Specificity (20 points)
        evaluation.scores.clarity = evaluateClarity(explicitThesis)
        
        // 2. Argumentative Nature (20 points)
        evaluation.scores.argumentative = evaluateArgumentativeNature(explicitThesis, documentType)
        
        // 3. Scope (20 points)
        evaluation.scores.scope = evaluateScope(explicitThesis, documentType)
        
        // 4. Originality (15 points)
        evaluation.scores.originality = evaluateOriginality(explicitThesis)
        
        // 5. Discipline Alignment (15 points)
        evaluation.scores.disciplineAlignment = evaluateDisciplineAlignment(explicitThesis, discipline)
        
        // 6. Testability (10 points) - for empirical work
        evaluation.scores.testability = evaluateTestability(explicitThesis, discipline, documentType)
        
        // Calculate overall score
        evaluation.overallScore = Math.round(
          evaluation.scores.clarity.score +
          evaluation.scores.argumentative.score +
          evaluation.scores.scope.score +
          evaluation.scores.originality.score +
          evaluation.scores.disciplineAlignment.score +
          evaluation.scores.testability.score
        )
        
        // Determine rating
        evaluation.overallRating = getRating(evaluation.overallScore)
        
        // Compile strengths and weaknesses
        Object.values(evaluation.scores).forEach((score: any) => {
          if (score.strength) evaluation.strengths.push(score.strength)
          if (score.weakness) evaluation.weaknesses.push(score.weakness)
          if (score.recommendations) {
            evaluation.recommendations.push(...score.recommendations)
          }
        })
        
        // Generate response message
        const message = formatEvaluationMessage(evaluation)
        
        return message
        
      } catch (error) {
        throw error
      }
    },
  })

// Helper functions

function extractThesisStatement(text: string): string {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0)
  
  // Thesis indicators
  const indicators = [
    /this (?:paper|essay|study|research|thesis|dissertation) (?:argues|demonstrates|shows|explores|examines|investigates|claims|asserts)/i,
    /(?:I|we) argue (?:that|how)/i,
    /the (?:main|primary|central) argument (?:is|of this)/i,
    /the purpose of this (?:paper|study|research) is to/i,
  ]
  
  // Search first 5 paragraphs
  for (const paragraph of paragraphs.slice(0, 5)) {
    for (const indicator of indicators) {
      if (indicator.test(paragraph)) {
        // Extract the sentence containing the indicator
        const sentences = paragraph.split(/[.!?]+/)
        for (const sentence of sentences) {
          if (indicator.test(sentence)) {
            return sentence.trim()
          }
        }
      }
    }
  }
  
  // If no thesis found with indicators, return first substantial sentence
  for (const paragraph of paragraphs.slice(0, 3)) {
    const sentences = paragraph.split(/[.!?]+/)
    const substantialSentence = sentences.find(s => s.trim().length > 50)
    if (substantialSentence) {
      return substantialSentence.trim()
    }
  }
  
  return ''
}

function evaluateClarity(thesis: string) {
  const wordCount = thesis.split(/\s+/).length
  const hasJargon = /\b(?:paradigm|multifaceted|myriad|plethora|dichotomy)\b/i.test(thesis)
  const isConvoluted = thesis.split(',').length > 4
  
  let score = 20
  let strength = ''
  let weakness = ''
  const recommendations: string[] = []
  
  // Ideal length: 15-40 words
  if (wordCount < 10) {
    score -= 5
    weakness = 'Thesis is too brief and lacks specificity'
    recommendations.push('Expand your thesis to include more specific details about your argument')
  } else if (wordCount > 50) {
    score -= 5
    weakness = 'Thesis is overly long and potentially unclear'
    recommendations.push('Condense your thesis to focus on the core argument (aim for 15-40 words)')
  } else {
    strength = 'Thesis length is appropriate'
  }
  
  if (hasJargon) {
    score -= 3
    recommendations.push('Reduce jargon for better clarity')
  }
  
  if (isConvoluted) {
    score -= 4
    weakness = 'Thesis has too many clauses; simplify structure'
    recommendations.push('Break complex thesis into simpler components')
  }
  
  if (wordCount >= 15 && wordCount <= 40 && !hasJargon && !isConvoluted) {
    strength = 'Thesis is clear and well-structured'
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function evaluateArgumentativeNature(thesis: string, documentType: string) {
  const argumentativeWords = /\b(?:argues|demonstrates|shows|proves|contends|claims|asserts|should|must|ought to)\b/i
  const descriptiveWords = /\b(?:is|are|was|were|describes|discusses|explores|examines)\b/i
  
  let score = 20
  let strength = ''
  let weakness = ''
  const recommendations: string[] = []
  
  const isArgumentative = argumentativeWords.test(thesis)
  const isDescriptive = descriptiveWords.test(thesis)
  
  if (documentType === 'research-paper' || documentType === 'essay' || documentType === 'thesis') {
    if (isArgumentative) {
      strength = 'Thesis makes a clear argument'
      score = 20
    } else if (isDescriptive) {
      weakness = 'Thesis is descriptive rather than argumentative'
      score = 8
      recommendations.push('Transform thesis into an argument using words like "argues," "demonstrates," or "shows"')
      recommendations.push('Make a claim that can be supported with evidence')
    } else {
      score = 12
      recommendations.push('Clarify the argumentative stance of your thesis')
    }
  } else {
    // For proposals or exploratory work, descriptive is acceptable
    if (isArgumentative || isDescriptive) {
      strength = 'Thesis clearly states the purpose'
      score = 20
    }
  }
  
  // Check if debatable
  const isObviouslyTrue = /\b(?:is important|is significant|has impact|is relevant)\b/i.test(thesis)
  if (isObviouslyTrue) {
    score -= 5
    recommendations.push('Avoid stating obvious truths; make a specific, debatable claim')
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function evaluateScope(thesis: string, documentType: string) {
  const wordCount = thesis.split(/\s+/).length
  const broadIndicators = /\b(?:all|every|always|never|throughout history|entire|whole world)\b/i
  const specificIndicators = /\b(?:specifically|particularly|in the context of|among|between \d+ and \d+)\b/i
  
  let score
  let strength = ''
  let weakness = ''
  const recommendations: string[] = []
  
  if (broadIndicators.test(thesis)) {
    score = 8
    weakness = 'Thesis scope is too broad'
    recommendations.push('Narrow the scope to a specific context, time period, or population')
    recommendations.push('Focus on a manageable claim that can be thoroughly supported')
  } else if (specificIndicators.test(thesis)) {
    strength = 'Thesis has appropriate, specific scope'
    score = 20
  } else if (wordCount < 15) {
    score = 12
    recommendations.push('Add more specific details to define the scope of your argument')
  } else {
    score = 15
  }
  
  // Adjust for document type
  if (documentType === 'dissertation' && score < 15) {
    // Dissertations can be broader
    score = Math.min(score + 5, 20)
  } else if (documentType === 'essay' && score > 15 && wordCount > 40) {
    // Essays should be focused
    score = 15
    recommendations.push('For an essay, ensure scope is narrow enough to cover thoroughly')
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function evaluateOriginality(thesis: string) {
  const genericPhrases = /\b(?:has many effects|plays a role|is important|has an impact|can be seen)\b/i
  const specificClaim = /\b(?:challenge|question|reveal|demonstrate that|argue that|show how)\b/i
  
  let score
  let strength = ''
  let weakness = ''
  const recommendations: string[] = []
  
  if (genericPhrases.test(thesis)) {
    score = 6
    weakness = 'Thesis uses generic phrasing'
    recommendations.push('Replace vague phrases with specific claims about what you will demonstrate')
  } else if (specificClaim.test(thesis)) {
    strength = 'Thesis presents a specific, original claim'
    score = 15
  } else {
    score = 10
    recommendations.push('Strengthen originality by stating what new insight your work provides')
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function evaluateDisciplineAlignment(thesis: string, discipline: string) {
  let score
  let strength = ''
  const weakness = ''
  const recommendations: string[] = []
  
  switch (discipline) {
    case 'STEM':
      // STEM theses should mention methods, tests, or measurable outcomes
      const hasSTEMIndicators = /\b(?:test|measure|analyze|data|experiment|model|simulation|correlation|effect|relationship)\b/i.test(thesis)
      if (hasSTEMIndicators) {
        strength = 'Thesis aligns with STEM conventions (testable, measurable)'
        score = 15
      } else {
        score = 8
        recommendations.push('For STEM, explicitly mention what you will test or measure')
        recommendations.push('Include variables or outcomes in your thesis')
      }
      break
      
    case 'Humanities':
      // Humanities theses should involve interpretation, analysis, or argument about texts/culture
      const hasHumanitiesIndicators = /\b(?:interpret|analyze|reading|text|represent|reveal|suggest|argue|challenge)\b/i.test(thesis)
      if (hasHumanitiesIndicators) {
        strength = 'Thesis aligns with Humanities conventions (interpretive, analytical)'
        score = 15
      } else {
        score = 8
        recommendations.push('For Humanities, focus on interpretation or analysis of texts, culture, or ideas')
      }
      break
      
    case 'Social Sciences':
      // Social Sciences blend empirical and theoretical
      const hasSocialScienceIndicators = /\b(?:relationship|factor|influence|examine|study|survey|interview|theory|framework)\b/i.test(thesis)
      if (hasSocialScienceIndicators) {
        strength = 'Thesis aligns with Social Sciences conventions'
        score = 15
      } else {
        score = 8
        recommendations.push('For Social Sciences, mention the relationship or factors you will examine')
        recommendations.push('Consider referencing your theoretical framework or research method')
      }
      break
      
    case 'Business':
      const hasBusinessIndicators = /\b(?:strategy|performance|market|organization|management|competitive advantage|value)\b/i.test(thesis)
      if (hasBusinessIndicators) {
        strength = 'Thesis aligns with Business conventions'
        score = 15
      } else {
        score = 10
        recommendations.push('For Business, consider mentioning strategic implications or organizational impact')
      }
      break
      
    default:
      score = 12
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function evaluateTestability(thesis: string, discipline: string, documentType: string) {
  // Testability is most relevant for empirical research
  if (discipline !== 'STEM' && discipline !== 'Social Sciences') {
    return { score: 10, strength: 'Testability not applicable for this discipline', weakness: '', recommendations: [] }
  }
  
  if (documentType !== 'research-paper' && documentType !== 'thesis' && documentType !== 'dissertation') {
    return { score: 10, strength: '', weakness: '', recommendations: [] }
  }
  
  let score
  let strength = ''
  let weakness = ''
  const recommendations: string[] = []
  
  const hasTestableElements = /\b(?:will (?:test|measure|examine|compare|analyze)|hypothesis|relationship between|effect of|correlation)\b/i.test(thesis)
  const hasVagueClaims = /\b(?:explore|investigate|consider)\b/i.test(thesis)
  
  if (hasTestableElements) {
    strength = 'Thesis includes testable elements'
    score = 10
  } else if (hasVagueClaims) {
    score = 5
    weakness = 'Thesis uses vague, non-testable language'
    recommendations.push('Make your thesis testable by stating specific variables or relationships')
    recommendations.push('Use precise language: "test," "measure," "compare," rather than "explore"')
  } else {
    score = 7
    recommendations.push('For empirical research, clarify what you will test or measure')
  }
  
  return { score: Math.max(score, 0), strength, weakness, recommendations }
}

function getRating(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 50) return 'Developing'
  return 'Needs Significant Improvement'
}

function formatEvaluationMessage(evaluation: any): string {
  let message = `# Thesis Strength Evaluation\n\n`
  
  message += `## Thesis Statement\n"${evaluation.thesis}"\n\n`
  
  message += `## Overall Assessment\n`
  message += `**Score:** ${evaluation.overallScore}/100\n`
  message += `**Rating:** ${evaluation.overallRating}\n`
  message += `**Discipline:** ${evaluation.discipline}\n`
  message += `**Document Type:** ${evaluation.documentType}\n\n`
  
  message += `## Detailed Scores\n\n`
  message += `| Category | Score | Max |\n`
  message += `|----------|-------|-----|\n`
  message += `| Clarity & Specificity | ${evaluation.scores.clarity.score} | 20 |\n`
  message += `| Argumentative Nature | ${evaluation.scores.argumentative.score} | 20 |\n`
  message += `| Scope | ${evaluation.scores.scope.score} | 20 |\n`
  message += `| Originality | ${evaluation.scores.originality.score} | 15 |\n`
  message += `| Discipline Alignment | ${evaluation.scores.disciplineAlignment.score} | 15 |\n`
  message += `| Testability | ${evaluation.scores.testability.score} | 10 |\n\n`
  
  if (evaluation.strengths.length > 0) {
    message += `## Strengths\n`
    evaluation.strengths.forEach((s: string) => {
      message += `- ${s}\n`
    })
    message += `\n`
  }
  
  if (evaluation.weaknesses.length > 0) {
    message += `## Areas for Improvement\n`
    evaluation.weaknesses.forEach((w: string) => {
      message += `- ${w}\n`
    })
    message += `\n`
  }
  
  if (evaluation.recommendations.length > 0) {
    message += `## Recommendations\n`
    evaluation.recommendations.forEach((r: string) => {
      message += `${r}\n`
    })
    message += `\n`
  }
  
  // Add example revisions
  message += `## Next Steps\n`
  if (evaluation.overallScore < 70) {
    message += `Your thesis needs strengthening. Focus on:\n`
    message += `1. Making a clear, specific argument\n`
    message += `2. Ensuring it's debatable and not obvious\n`
    message += `3. Aligning with ${evaluation.discipline} conventions\n`
  } else {
    message += `Your thesis is ${evaluation.overallRating.toLowerCase()}. `
    if (evaluation.recommendations.length > 0) {
      message += `Consider the recommendations above for final polish.`
    } else {
      message += `It effectively sets up your argument.`
    }
  }
  
  return message
}
