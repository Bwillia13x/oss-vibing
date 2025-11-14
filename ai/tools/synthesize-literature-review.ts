import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './synthesize-literature-review.md'
import z from 'zod/v3'
import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { detectMethodology } from './utils/methodology-detection'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  abstract?: string
  keywords?: string[]
  findings?: string
  methodology?: string
  citationCount?: number
}

interface Theme {
  name: string
  papers: Paper[]
  keywords: string[]
  summary: string
  keyFindings: string[]
  agreements: string[]
  contradictions: string[]
}

interface Author {
  name: string
  paperCount: number
  papers: Paper[]
  influence: number
}

export const synthesizeLiteratureReview = ({ writer: _writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      referenceFolder: z.string().describe('Path to folder containing reference files'),
      topic: z.string().describe('Main research topic or question for the review'),
      discipline: z.enum(['STEM', 'Humanities', 'Social Sciences', 'Business', 'General'])
        .default('General')
        .describe('Academic discipline for appropriate review structure'),
      organizationStyle: z.enum(['thematic', 'chronological', 'methodological'])
        .default('thematic')
        .describe('How to organize the literature review'),
      includeGaps: z.boolean().default(true).describe('Include research gaps section'),
    }),
    execute: async ({ referenceFolder, topic, discipline, organizationStyle, includeGaps }, { toolCallId: _toolCallId }) => {
      try {
        // Load references
        const refPath = path.resolve(referenceFolder)
        if (!existsSync(refPath)) {
          throw new Error(`Reference folder not found: ${referenceFolder}`)
        }
        
        const files = await readdir(refPath)
        const papers: Paper[] = []
        
        for (const file of files.filter(f => f.endsWith('.json'))) {
          try {
            const content = await readFile(path.join(refPath, file), 'utf-8')
            const ref = JSON.parse(content)
            
            papers.push({
              id: ref.id || ref.DOI || file,
              title: ref.title || 'Untitled',
              authors: ref.authors || [],
              year: ref.year || new Date().getFullYear(),
              abstract: ref.abstract || ref.summary || '',
              keywords: ref.keywords || [],
              findings: extractFindings(ref.abstract || ''),
              methodology: detectMethodology(ref.abstract || ref.title || ''),
              citationCount: ref.citationCount || 0,
            })
          } catch (_error) {
            console.debug(`Skipping invalid reference file: ${file}`)
          }
        }
        
        if (papers.length === 0) {
          throw new Error('No valid reference files found')
        }
        
        // Sort papers by year for chronological reference
        papers.sort((a, b) => a.year - b.year)
        
        // Identify key authors
        const authorMap = new Map<string, Author>()
        for (const paper of papers) {
          for (const authorName of paper.authors) {
            if (!authorMap.has(authorName)) {
              authorMap.set(authorName, {
                name: authorName,
                paperCount: 0,
                papers: [],
                influence: 0,
              })
            }
            const author = authorMap.get(authorName)!
            author.paperCount++
            author.papers.push(paper)
            author.influence += (paper.citationCount || 0)
          }
        }
        
        const keyAuthors = Array.from(authorMap.values())
          .sort((a, b) => b.influence - a.influence)
          .slice(0, 10)
        
        // Identify themes
        let themes: Theme[] = []
        
        if (organizationStyle === 'thematic') {
          themes = identifyThemes(papers, topic)
        } else if (organizationStyle === 'chronological') {
          themes = organizeChronologically(papers)
        } else if (organizationStyle === 'methodological') {
          themes = organizeByMethodology(papers)
        }
        
        // Identify research gaps if requested
        let gaps: string[] = []
        if (includeGaps) {
          gaps = identifyGaps(papers, themes, topic)
        }
        
        // Generate literature review
        const review = generateLiteratureReview(
          papers,
          themes,
          keyAuthors,
          gaps,
          topic,
          discipline,
          organizationStyle
        )
        
        return review
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'
        throw new Error(`Failed to synthesize literature review: ${message}`)
      }
    },
  })

// Helper functions

function extractFindings(abstract: string): string {
  // Look for findings indicators
  const findingsPatterns = [
    /results? (?:show|indicate|suggest|demonstrate|reveal)[^.]+\./gi,
    /we found [^.]+\./gi,
    /findings? (?:show|indicate|suggest)[^.]+\./gi,
    /conclusion[^.]+\./gi,
  ]
  
  const findings: string[] = []
  for (const pattern of findingsPatterns) {
    const matches = abstract.match(pattern)
    if (matches) {
      findings.push(...matches)
    }
  }
  
  return findings.join(' ')
}

function identifyThemes(papers: Paper[], topic: string): Theme[] {
  const themes: Theme[] = []
  const keywordClusters = new Map<string, Paper[]>()
  
  // Cluster papers by shared keywords
  for (const paper of papers) {
    if (paper.keywords && paper.keywords.length > 0) {
      for (const keyword of paper.keywords) {
        const normalized = keyword.toLowerCase().trim()
        if (!keywordClusters.has(normalized)) {
          keywordClusters.set(normalized, [])
        }
        keywordClusters.get(normalized)!.push(paper)
      }
    }
  }
  
  // Find most common keywords (potential themes)
  const sortedKeywords = Array.from(keywordClusters.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
  
  for (const [keyword, clusterPapers] of sortedKeywords) {
    if (clusterPapers.length >= 2) {
      const findings = clusterPapers
        .filter(p => p.findings && p.findings.length > 0)
        .map(p => p.findings!)
      
      themes.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        papers: clusterPapers,
        keywords: [keyword],
        summary: generateThemeSummary(clusterPapers, keyword),
        keyFindings: findings.slice(0, 5),
        agreements: findAgreements(clusterPapers),
        contradictions: findContradictions(clusterPapers),
      })
    }
  }
  
  // Add an "Other" category for uncategorized papers
  const categorizedIds = new Set<string>()
  for (const theme of themes) {
    for (const paper of theme.papers) {
      categorizedIds.add(paper.id)
    }
  }
  
  const otherPapers = papers.filter(p => !categorizedIds.has(p.id))
  if (otherPapers.length > 0) {
    themes.push({
      name: 'Other Relevant Research',
      papers: otherPapers,
      keywords: [],
      summary: 'Additional studies relevant to the topic',
      keyFindings: [],
      agreements: [],
      contradictions: [],
    })
  }
  
  return themes
}

function organizeChronologically(papers: Paper[]): Theme[] {
  const themes: Theme[] = []
  
  // Group by decade or era
  const minYear = Math.min(...papers.map(p => p.year))
  const maxYear = Math.max(...papers.map(p => p.year))
  
  const decades = []
  for (let year = Math.floor(minYear / 10) * 10; year <= maxYear; year += 10) {
    decades.push(year)
  }
  
  for (let i = 0; i < decades.length; i++) {
    const startYear = decades[i]
    const endYear = i < decades.length - 1 ? decades[i + 1] - 1 : maxYear
    
    const decadePapers = papers.filter(p => p.year >= startYear && p.year <= endYear)
    
    if (decadePapers.length > 0) {
      themes.push({
        name: `${startYear}s Research`,
        papers: decadePapers,
        keywords: extractCommonKeywords(decadePapers),
        summary: `Research developments from ${startYear} to ${endYear}`,
        keyFindings: decadePapers.filter(p => p.findings).map(p => p.findings!).slice(0, 5),
        agreements: findAgreements(decadePapers),
        contradictions: findContradictions(decadePapers),
      })
    }
  }
  
  return themes
}

function organizeByMethodology(papers: Paper[]): Theme[] {
  const methodGroups = new Map<string, Paper[]>()
  
  for (const paper of papers) {
    const method = paper.methodology || 'Other'
    if (!methodGroups.has(method)) {
      methodGroups.set(method, [])
    }
    methodGroups.get(method)!.push(paper)
  }
  
  const themes: Theme[] = []
  
  for (const [method, methodPapers] of methodGroups.entries()) {
    if (methodPapers.length > 0) {
      themes.push({
        name: `${method} Studies`,
        papers: methodPapers,
        keywords: extractCommonKeywords(methodPapers),
        summary: `Research using ${method.toLowerCase()} approaches`,
        keyFindings: methodPapers.filter(p => p.findings).map(p => p.findings!).slice(0, 5),
        agreements: findAgreements(methodPapers),
        contradictions: findContradictions(methodPapers),
      })
    }
  }
  
  return themes.sort((a, b) => b.papers.length - a.papers.length)
}

function generateThemeSummary(papers: Paper[], keyword: string): string {
  const count = papers.length
  const yearRange = `${Math.min(...papers.map(p => p.year))} to ${Math.max(...papers.map(p => p.year))}`
  
  return `This theme encompasses ${count} papers published from ${yearRange} focusing on ${keyword}.`
}

function findAgreements(papers: Paper[]): string[] {
  const agreements: string[] = []
  
  // Look for common findings patterns
  const findingWords = new Map<string, number>()
  
  for (const paper of papers) {
    if (paper.findings) {
      const words = paper.findings.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (word.length > 5) { // Only meaningful words
          findingWords.set(word, (findingWords.get(word) || 0) + 1)
        }
      }
    }
  }
  
  // Find words that appear in multiple papers (potential agreements)
  for (const [word, count] of findingWords.entries()) {
    if (count >= Math.min(3, Math.ceil(papers.length / 2))) {
      agreements.push(`Multiple studies emphasize ${word}`)
    }
  }
  
  return agreements.slice(0, 3)
}

function findContradictions(papers: Paper[]): string[] {
  const contradictions: string[] = []
  
  // Look for opposing terms in findings
  const opposites = [
    ['positive', 'negative'],
    ['increase', 'decrease'],
    ['effective', 'ineffective'],
    ['significant', 'insignificant'],
    ['support', 'reject'],
  ]
  
  for (const [term1, term2] of opposites) {
    const count1 = papers.filter(p => 
      p.findings?.toLowerCase().includes(term1)
    ).length
    const count2 = papers.filter(p => 
      p.findings?.toLowerCase().includes(term2)
    ).length
    
    if (count1 > 0 && count2 > 0) {
      contradictions.push(`Studies show mixed findings regarding ${term1}/${term2} effects`)
    }
  }
  
  return contradictions.slice(0, 2)
}

function extractCommonKeywords(papers: Paper[]): string[] {
  const keywordCounts = new Map<string, number>()
  
  for (const paper of papers) {
    if (paper.keywords) {
      for (const keyword of paper.keywords) {
        const normalized = keyword.toLowerCase().trim()
        keywordCounts.set(normalized, (keywordCounts.get(normalized) || 0) + 1)
      }
    }
  }
  
  return Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw)
}

function identifyGaps(papers: Paper[], themes: Theme[], topic: string): string[] {
  const gaps: string[] = []
  
  // Check for methodological gaps
  const methods = papers.map(p => p.methodology || 'Other')
  const methodSet = new Set(methods)
  
  if (!methodSet.has('Experimental')) {
    gaps.push('Limited experimental studies - opportunity for controlled experiments')
  }
  if (!methodSet.has('Qualitative')) {
    gaps.push('Lack of qualitative research - opportunity for in-depth understanding')
  }
  if (!methodSet.has('Mixed Methods')) {
    gaps.push('No mixed methods studies - opportunity to combine approaches')
  }
  
  // Check for temporal gaps
  const years = papers.map(p => p.year).sort((a, b) => a - b)
  const recentYears = years.filter(y => y >= new Date().getFullYear() - 3)
  const oldestRecent = recentYears.length > 0 ? Math.max(...recentYears) : undefined
  if (oldestRecent === undefined || years.length < 5) {
    gaps.push('Limited recent research - field may need updated studies')
  }
  
  // Check for small sample
  if (papers.length < 10) {
    gaps.push('Small literature base - opportunity for more research in this area')
  }
  
  // Check theme coverage
  if (themes.length < 3) {
    gaps.push('Narrow thematic focus - opportunity to explore related topics')
  }
  
  return gaps.slice(0, 5)
}

function generateLiteratureReview(
  papers: Paper[],
  themes: Theme[],
  keyAuthors: Author[],
  gaps: string[],
  topic: string,
  discipline: string,
  organizationStyle: string
): string {
  let review = '# Literature Review\n\n'
  
  // Introduction
  review += `## Introduction\n\n`
  review += `This literature review examines the research on **${topic}** within the field of ${discipline}. `
  review += `The review synthesizes findings from ${papers.length} academic papers `
  review += `published between ${Math.min(...papers.map(p => p.year))} and ${Math.max(...papers.map(p => p.year))}. `
  review += `The review is organized ${organizationStyle}ly to provide a comprehensive understanding of the field.\n\n`
  
  // Key authors section
  if (keyAuthors.length > 0) {
    review += `### Key Contributors\n\n`
    review += `Several scholars have made significant contributions to this field. `
    
    const topAuthors = keyAuthors.slice(0, 5)
    const authorNames = topAuthors.map(a => {
      const paperYears = a.papers.map(p => p.year).sort((a, b) => a - b)
      return `${a.name} (${paperYears[0]}-${paperYears[paperYears.length - 1]})`
    })
    
    if (authorNames.length === 1) {
      review += `Notable researcher is ${authorNames[0]}, `
    } else {
      review += `Notable researchers include ${authorNames.slice(0, -1).join(', ')}, and ${authorNames[authorNames.length - 1]}, `
    }
    review += `whose work has been influential in shaping current understanding.\n\n`
  }
  
  review += '---\n\n'
  
  // Main themes/sections
  for (const theme of themes) {
    review += `## ${theme.name}\n\n`
    
    review += theme.summary + '\n\n'
    
    // Synthesize findings
    if (theme.papers.length > 0) {
      const recentPapers = theme.papers.filter(p => p.year >= new Date().getFullYear() - 5)
      const olderPapers = theme.papers.filter(p => p.year < new Date().getFullYear() - 5)
      
      if (olderPapers.length > 0) {
        review += `### Early Research\n\n`
        review += `Early investigations into ${theme.name.toLowerCase()} established foundational understanding. `
        
        // Cite some early papers
        const earlyPapers = olderPapers.slice(0, 3)
        const citations = earlyPapers.map(p => {
          const authorList = p.authors.length > 2 
            ? `${p.authors[0]} et al.` 
            : p.authors.join(' and ')
          return `${authorList} (${p.year})`
        }).join(', ')
        
        review += `Studies by ${citations} `
        review += `provided important insights into the field.\n\n`
      }
      
      if (recentPapers.length > 0) {
        review += `### Recent Developments\n\n`
        review += `More recent research has expanded upon earlier work. `
        
        // Highlight recent findings
        const recentFindings = recentPapers
          .filter(p => p.findings && p.findings.length > 0)
          .slice(0, 3)
        
        for (const paper of recentFindings) {
          const authorList = paper.authors.length > 2 
            ? `${paper.authors[0]} et al.` 
            : paper.authors.join(' and ')
          review += `${authorList} (${paper.year}) found that ${paper.findings?.toLowerCase() || 'contributed to the field'}. `
        }
        
        review += '\n\n'
      }
      
      // Agreements
      if (theme.agreements.length > 0) {
        review += `### Consensus Findings\n\n`
        review += `Research in this area shows convergence on several points:\n\n`
        for (const agreement of theme.agreements) {
          review += `- ${agreement}\n`
        }
        review += '\n'
      }
      
      // Contradictions
      if (theme.contradictions.length > 0) {
        review += `### Areas of Debate\n\n`
        review += `However, some aspects remain contested:\n\n`
        for (const contradiction of theme.contradictions) {
          review += `- ${contradiction}\n`
        }
        review += '\n'
      }
    }
    
    review += '---\n\n'
  }
  
  // Research gaps
  if (gaps.length > 0) {
    review += `## Research Gaps and Future Directions\n\n`
    review += `Despite substantial progress, several gaps remain in the literature:\n\n`
    
    for (let i = 0; i < gaps.length; i++) {
      review += `${i + 1}. **${gaps[i]}**\n`
    }
    
    review += '\n'
    review += `These gaps present opportunities for future research to advance understanding of ${topic}.\n\n`
    
    review += '---\n\n'
  }
  
  // Conclusion
  review += `## Synthesis and Conclusions\n\n`
  review += `This review of ${papers.length} studies reveals a ${papers.length > 20 ? 'well-developed' : 'developing'} `
  review += `body of research on ${topic}. `
  
  if (themes.length > 0) {
    review += `The literature can be organized into ${themes.length} major themes, `
    review += `each contributing to our understanding of different aspects of the topic. `
  }
  
  review += `Research has progressed from early foundational work to more sophisticated investigations, `
  review += `though opportunities remain for further exploration`
  
  if (gaps.length > 0) {
    review += `, particularly in addressing the identified gaps`
  }
  
  review += `.`
  
  review += `\n\n### Key Takeaways\n\n`
  
  // Summarize key points
  const takeaways: string[] = []
  
  if (themes.length > 0 && themes[0].keyFindings.length > 0) {
    takeaways.push(`Main finding: ${themes[0].keyFindings[0]}`)
  }
  
  if (keyAuthors.length > 0) {
    takeaways.push(`Key scholars have established strong theoretical foundations`)
  }
  
  if (themes.some(t => t.contradictions.length > 0)) {
    takeaways.push(`Some areas remain debated, requiring further investigation`)
  }
  
  if (gaps.length > 0) {
    takeaways.push(`Significant opportunities exist for future research`)
  }
  
  for (let i = 0; i < takeaways.length; i++) {
    review += `${i + 1}. ${takeaways[i]}\n`
  }
  
  review += '\n---\n\n'
  review += `*This literature review synthesizes ${papers.length} papers using ${organizationStyle} organization. `
  review += `Generated for research on: ${topic}*`
  
  return review
}
