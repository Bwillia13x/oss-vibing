import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './identify-research-gaps.md'
import z from 'zod/v3'
import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const identifyResearchGaps = ({ writer: _writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      documentPath: z.string().optional().describe('Path to document with literature review'),
      topic: z.string().describe('Research topic or area to analyze'),
      discipline: z.enum(['STEM', 'Humanities', 'Social Sciences', 'Business', 'General'])
        .default('General')
        .describe('Academic discipline for context'),
      referenceFolder: z.string().optional().describe('Path to folder with reference files'),
    }),
    execute: async ({ documentPath, topic, discipline, referenceFolder }, { toolCallId: _toolCallId }) => {
      try {
        let literatureText = ''
        const references: any[] = []
        
        // Read literature review document if provided
        if (documentPath) {
          const fullPath = path.resolve(documentPath)
          if (existsSync(fullPath)) {
            const content = await readFile(fullPath, 'utf-8')
            
            if (fullPath.endsWith('.json')) {
              try {
                const doc = JSON.parse(content)
                if (doc.sections) {
                  literatureText = doc.sections.map((s: any) => s.content || '').join('\n\n')
                } else if (doc.content) {
                  literatureText = doc.content
                }
              } catch {
                literatureText = content
              }
            } else {
              literatureText = content
            }
          }
        }
        
        // Load references if folder provided
        if (referenceFolder) {
          const refPath = path.resolve(referenceFolder)
          if (existsSync(refPath)) {
            const files = await readdir(refPath)
            for (const file of files) {
              if (file.endsWith('.json')) {
                const refContent = await readFile(path.join(refPath, file), 'utf-8')
                try {
                  const ref = JSON.parse(refContent)
                  references.push(ref)
                } catch (_error) {
                  // Skip invalid JSON
                  console.debug(`Skipping invalid reference file due to invalid JSON: ${file}`);
                }
              }
            }
          }
        }
        
        // Analyze for research gaps
        const gaps = {
          topic,
          discipline,
          identifiedGaps: [] as any[],
          opportunities: [] as string[],
          suggestedQuestions: [] as string[],
        }
        
        // 1. Temporal gaps - outdated research
        const temporalGap = identifyTemporalGaps(literatureText, references, topic)
        if (temporalGap.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Temporal',
            description: temporalGap.description,
            severity: temporalGap.severity,
            evidence: temporalGap.evidence,
          })
        }
        
        // 2. Methodological gaps
        const methodGap = identifyMethodologicalGaps(literatureText, discipline)
        if (methodGap.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Methodological',
            description: methodGap.description,
            severity: methodGap.severity,
            evidence: methodGap.evidence,
          })
        }
        
        // 3. Population/context gaps
        const populationGap = identifyPopulationGaps(literatureText)
        if (populationGap.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Population/Context',
            description: populationGap.description,
            severity: populationGap.severity,
            evidence: populationGap.evidence,
          })
        }
        
        // 4. Theoretical gaps
        const theoreticalGap = identifyTheoreticalGaps(literatureText, discipline)
        if (theoreticalGap.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Theoretical',
            description: theoreticalGap.description,
            severity: theoreticalGap.severity,
            evidence: theoreticalGap.evidence,
          })
        }
        
        // 5. Contradictory findings
        const contradictions = identifyContradictions(literatureText)
        if (contradictions.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Contradictory Findings',
            description: contradictions.description,
            severity: contradictions.severity,
            evidence: contradictions.evidence,
          })
        }
        
        // 6. Limited research areas
        const limitedResearch = identifyLimitedResearch(literatureText, topic)
        if (limitedResearch.hasGap) {
          gaps.identifiedGaps.push({
            type: 'Limited Research',
            description: limitedResearch.description,
            severity: limitedResearch.severity,
            evidence: limitedResearch.evidence,
          })
        }
        
        // Generate opportunities and research questions
        gaps.opportunities = generateOpportunities(gaps.identifiedGaps, topic, discipline)
        gaps.suggestedQuestions = generateResearchQuestions(gaps.identifiedGaps, topic, discipline)
        
        // Format response
        const message = formatGapsMessage(gaps)
        
        return message
        
      } catch (error) {
        throw error
      }
    },
  })

// Helper functions

function identifyTemporalGaps(text: string, references: any[], topic: string) {
  // Extract years from text
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || []
  const years = yearMatches.map(y => parseInt(y))
  
  const currentYear = new Date().getFullYear()
  const recentYears = years.filter(y => y >= currentYear - 5)
  const oldYears = years.filter(y => y < currentYear - 10)
  
  const hasGap = oldYears.length > recentYears.length * 2
  
  if (hasGap) {
    return {
      hasGap: true,
      severity: 'high',
      description: `Most research on ${topic} is more than 10 years old, with limited recent studies`,
      evidence: `Found ${oldYears.length} citations from before ${currentYear - 10} vs. ${recentYears.length} from last 5 years`,
    }
  }
  
  // Check for specific temporal gaps mentioned in text
  const temporalGapIndicators = [
    /no recent (?:research|studies|work)/i,
    /outdated (?:research|data|studies)/i,
    /limited (?:current|contemporary|recent) (?:research|studies)/i,
    /needs? (?:updating|current research)/i,
  ]
  
  for (const indicator of temporalGapIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'medium',
        description: `Existing literature explicitly mentions need for updated research on ${topic}`,
        evidence: 'Literature review mentions lack of recent studies',
      }
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function identifyMethodologicalGaps(text: string, _discipline: string) {
  const qualitativeIndicators = /\b(?:interview|case study|ethnography|observation|qualitative)\b/gi
  const quantitativeIndicators = /\b(?:survey|experiment|statistical|quantitative|measure|correlation)\b/gi
  const mixedIndicators = /\b(?:mixed methods?|triangulation)\b/gi
  
  const qualCount = (text.match(qualitativeIndicators) || []).length
  const quantCount = (text.match(quantitativeIndicators) || []).length
  const mixedCount = (text.match(mixedIndicators) || []).length
  
  // Check for methodological imbalance
  if (qualCount > quantCount * 3 && quantCount > 0) {
    return {
      hasGap: true,
      severity: 'medium',
      description: 'Research is heavily qualitative; quantitative studies could provide complementary insights',
      evidence: `Found ${qualCount} qualitative indicators vs. ${quantCount} quantitative`,
    }
  }
  
  if (quantCount > qualCount * 3 && qualCount > 0) {
    return {
      hasGap: true,
      severity: 'medium',
      description: 'Research is heavily quantitative; qualitative studies could explore lived experiences',
      evidence: `Found ${quantCount} quantitative indicators vs. ${qualCount} qualitative`,
    }
  }
  
  if (mixedCount === 0 && qualCount > 5 && quantCount > 5) {
    return {
      hasGap: true,
      severity: 'low',
      description: 'No mixed-methods studies identified; combining approaches could yield richer insights',
      evidence: 'Both qualitative and quantitative studies exist, but not combined',
    }
  }
  
  // Check for explicit methodological gaps
  const methodGapIndicators = [
    /lack of (?:experimental|qualitative|quantitative|longitudinal) (?:studies|research)/i,
    /no (?:experimental|qualitative|quantitative|longitudinal) (?:studies|research)/i,
    /need for (?:experimental|qualitative|quantitative|longitudinal) (?:studies|research)/i,
  ]
  
  for (const indicator of methodGapIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'high',
        description: 'Literature explicitly identifies methodological gaps',
        evidence: 'Authors note lack of certain research methods',
      }
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function identifyPopulationGaps(text: string) {
  const populationIndicators = [
    /\b(?:WEIRD|Western|college students|undergraduate)\b/i,
    /limited to (?:one|single) (?:country|region|population|culture)/i,
    /predominantly (?:white|male|female|Western)/i,
  ]
  
  const diversityLackIndicators = [
    /lack of diversity/i,
    /homogeneous sample/i,
    /limited to (?:one|single) demographic/i,
    /need for (?:diverse|cross-cultural|international) (?:samples?|studies)/i,
  ]
  
  for (const indicator of diversityLackIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'high',
        description: 'Research lacks diversity in populations studied',
        evidence: 'Literature identifies need for more diverse samples',
      }
    }
  }
  
  for (const indicator of populationIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'medium',
        description: 'Research may be limited to specific populations (e.g., WEIRD, college students)',
        evidence: 'Multiple studies focus on similar demographic groups',
      }
    }
  }
  
  // Check for geographic concentration
  const geographicTerms = text.match(/\b(?:United States|America|Europe|Western)\b/gi) || []
  if (geographicTerms.length > 10) {
    return {
      hasGap: true,
      severity: 'medium',
      description: 'Research appears geographically concentrated in Western contexts',
      evidence: `Found ${geographicTerms.length} references to Western/US contexts`,
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function identifyTheoreticalGaps(text: string, discipline: string) {
  const theoryIndicators = /\b(?:theory|theoretical framework|model|paradigm|lens)\b/gi
  const theoryCount = (text.match(theoryIndicators) || []).length
  
  const gapIndicators = [
    /lack of (?:theoretical|conceptual) (?:framework|foundation)/i,
    /no (?:theoretical|conceptual) (?:framework|foundation)/i,
    /need for (?:theoretical|conceptual) (?:framework|development)/i,
    /atheoretical/i,
  ]
  
  for (const indicator of gapIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'high',
        description: 'Research lacks theoretical grounding or framework',
        evidence: 'Literature explicitly mentions need for theoretical development',
      }
    }
  }
  
  // If humanities/social sciences but low theory mentions
  if ((discipline === 'Humanities' || discipline === 'Social Sciences') && theoryCount < 5) {
    return {
      hasGap: true,
      severity: 'medium',
      description: 'Limited theoretical framing in existing research',
      evidence: `Only ${theoryCount} theoretical references found`,
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function identifyContradictions(text: string) {
  const contradictionIndicators = [
    /contradictory (?:findings|results|evidence)/i,
    /conflicting (?:findings|results|evidence)/i,
    /inconsistent (?:findings|results|evidence)/i,
    /mixed (?:findings|results|evidence)/i,
    /however[,\s]+(?:other|some) (?:studies|research) (?:found|show|suggest)/i,
    /in contrast[,\s]+(?:other|some) (?:studies|research)/i,
  ]
  
  for (const indicator of contradictionIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'high',
        description: 'Contradictory findings exist in the literature that need resolution',
        evidence: 'Literature notes conflicting results across studies',
      }
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function identifyLimitedResearch(text: string, topic: string) {
  const limitedResearchIndicators = [
    /limited research/i,
    /little is known/i,
    /few studies/i,
    /under(?:studied|researched|explored)/i,
    /gap in (?:the )?literature/i,
    /not (?:yet|well) (?:studied|researched|explored)/i,
    /warrants? (?:further|more) (?:research|investigation|study)/i,
  ]
  
  for (const indicator of limitedResearchIndicators) {
    if (indicator.test(text)) {
      return {
        hasGap: true,
        severity: 'high',
        description: `Limited existing research on ${topic}`,
        evidence: 'Literature explicitly states research is limited or lacking',
      }
    }
  }
  
  return { hasGap: false, severity: 'none', description: '', evidence: '' }
}

function generateOpportunities(gaps: any[], topic: string, _discipline: string): string[] {
  const opportunities: string[] = []
  
  for (const gap of gaps) {
    switch (gap.type) {
      case 'Temporal':
        opportunities.push(`Conduct updated study with current data to reflect recent developments in ${topic}`)
        break
      case 'Methodological':
        if (gap.description.includes('qualitative')) {
          opportunities.push(`Design quantitative study to complement qualitative insights`)
        } else if (gap.description.includes('quantitative')) {
          opportunities.push(`Conduct qualitative research to explore lived experiences`)
        } else {
          opportunities.push(`Use mixed-methods approach to triangulate findings`)
        }
        break
      case 'Population/Context':
        opportunities.push(`Expand research to underrepresented populations or cultural contexts`)
        opportunities.push(`Conduct cross-cultural or comparative study`)
        break
      case 'Theoretical':
        opportunities.push(`Develop or apply theoretical framework to ${topic}`)
        opportunities.push(`Use existing theory from related field to provide new lens`)
        break
      case 'Contradictory Findings':
        opportunities.push(`Design study to resolve contradictions through replication or meta-analysis`)
        opportunities.push(`Investigate moderating factors that might explain contradictory results`)
        break
      case 'Limited Research':
        opportunities.push(`Pioneering study in this unexplored area`)
        opportunities.push(`Exploratory research to map the landscape of ${topic}`)
        break
    }
  }
  
  return opportunities.slice(0, 8) // Top 8 opportunities
}

function generateResearchQuestions(gaps: any[], topic: string, _discipline: string): string[] {
  const questions: string[] = []
  
  for (const gap of gaps) {
    switch (gap.type) {
      case 'Temporal':
        questions.push(`How has ${topic} evolved in the past five years?`)
        questions.push(`What new factors influence ${topic} in the current context?`)
        break
      case 'Methodological':
        if (gap.description.includes('qualitative')) {
          questions.push(`To what extent does ${topic} demonstrate measurable effects?`)
        } else {
          questions.push(`How do individuals experience and make sense of ${topic}?`)
        }
        break
      case 'Population/Context':
        questions.push(`How does ${topic} differ across cultural or demographic contexts?`)
        questions.push(`What are the experiences of underrepresented groups regarding ${topic}?`)
        break
      case 'Theoretical':
        questions.push(`How can [theoretical framework] explain patterns in ${topic}?`)
        questions.push(`What theoretical model best accounts for ${topic}?`)
        break
      case 'Contradictory Findings':
        questions.push(`Under what conditions does ${topic} produce different outcomes?`)
        questions.push(`What factors moderate the relationship between X and Y in ${topic}?`)
        break
      case 'Limited Research':
        questions.push(`What are the key dimensions and characteristics of ${topic}?`)
        questions.push(`What factors are associated with ${topic}?`)
        break
    }
  }
  
  return questions.slice(0, 6) // Top 6 questions
}

function formatGapsMessage(gaps: any): string {
  let message = `# Research Gap Analysis: ${gaps.topic}\n\n`
  
  message += `**Discipline:** ${gaps.discipline}\n\n`
  
  if (gaps.identifiedGaps.length === 0) {
    message += `No significant research gaps identified in the provided literature.\n\n`
    message += `This could mean:\n`
    message += `- The area is well-researched\n`
    message += `- You need to review more literature\n`
    message += `- Consider narrowing your focus to find specific unexplored questions\n`
    return message
  }
  
  message += `## Identified Gaps (${gaps.identifiedGaps.length})\n\n`
  
  gaps.identifiedGaps.forEach((gap: any, index: number) => {
    const severityEmoji = gap.severity === 'high' ? '🔴' : gap.severity === 'medium' ? '🟡' : '🔵'
    message += `### ${index + 1}. ${gap.type} ${severityEmoji}\n`
    message += `**Severity:** ${gap.severity}\n\n`
    message += `**Description:** ${gap.description}\n\n`
    message += `**Evidence:** ${gap.evidence}\n\n`
  })
  
  if (gaps.opportunities.length > 0) {
    message += `## Research Opportunities\n\n`
    gaps.opportunities.forEach((opp: string, index: number) => {
      message += `${index + 1}. ${opp}\n`
    })
    message += `\n`
  }
  
  if (gaps.suggestedQuestions.length > 0) {
    message += `## Suggested Research Questions\n\n`
    gaps.suggestedQuestions.forEach((q: string, index: number) => {
      message += `${index + 1}. ${q}\n`
    })
    message += `\n`
  }
  
  message += `## Next Steps\n\n`
  message += `1. Select one or more gaps that align with your interests and expertise\n`
  message += `2. Review additional literature specifically targeting these gaps\n`
  message += `3. Refine your research question to address the identified gap\n`
  message += `4. Consider how your proposed study will fill this gap\n`
  message += `5. Articulate the significance and contribution of addressing this gap\n`
  
  return message
}
