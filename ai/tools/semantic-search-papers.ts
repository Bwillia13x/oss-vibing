import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './semantic-search-papers.md'
import z from 'zod/v3'
import { readFile, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface Paper {
  id: string
  title: string
  abstract?: string
  authors?: string[]
  year?: number
  keywords?: string[]
  DOI?: string
  similarity?: number
}

export const semanticSearchPapers = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      query: z.string().optional().describe('Search query or research question'),
      documentPath: z.string().optional().describe('Path to document to find related papers for'),
      referenceFolder: z.string().describe('Path to folder containing reference files'),
      topK: z.number().min(1).max(50).default(10).describe('Number of most similar papers to return'),
      minSimilarity: z.number().min(0).max(1).default(0.3).describe('Minimum similarity threshold (0-1)'),
    }),
    execute: async ({ query, documentPath, referenceFolder, topK, minSimilarity }, { toolCallId }) => {
      try {
        // Get query text
        let queryText = query || ''
        
        if (documentPath) {
          const docPath = path.resolve(documentPath)
          if (existsSync(docPath)) {
            const content = await readFile(docPath, 'utf-8')
            
            // Extract text from document
            try {
              const doc = JSON.parse(content)
              if (doc.sections) {
                queryText = doc.sections.map((s: any) => s.content || '').join('\n\n')
              } else if (doc.content) {
                queryText = doc.content
              } else if (doc.abstract) {
                queryText = doc.abstract
              }
            } catch {
              queryText = content
            }
          }
        }
        
        if (!queryText || queryText.trim().length === 0) {
          throw new Error('Please provide either a query or document path')
        }
        
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
              abstract: ref.abstract || ref.summary || '',
              authors: ref.authors || [],
              year: ref.year,
              keywords: ref.keywords || [],
              DOI: ref.DOI,
            })
          } catch (error) {
            // Skip invalid files, but log which file and why
            console.debug(`Skipping invalid reference file: ${file}. Error: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
        
        if (papers.length === 0) {
          throw new Error('No valid reference files found')
        }
        
        // Calculate semantic similarity for each paper
        for (const paper of papers) {
          const paperText = [
            paper.title,
            paper.abstract || '',
            paper.keywords?.join(' ') || '',
          ].join(' ').toLowerCase()
          
          paper.similarity = calculateSemanticSimilarity(queryText, paperText)
        }
        
        // Filter and sort by similarity
        const similarPapers = papers
          .filter(p => (p.similarity || 0) >= minSimilarity)
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, topK)
        
        // Categorize results
        const results = categorizeSimilarPapers(similarPapers, queryText)
        
        // Generate response
        const message = formatSearchResults(results, queryText, papers.length, similarPapers.length)
        
        return message
        
      } catch (error) {
        throw error
      }
    },
  })

// Helper functions

function calculateSemanticSimilarity(query: string, document: string): number {
  // Normalize texts
  const queryNorm = normalizeText(query)
  const docNorm = normalizeText(document)
  
  // Extract terms
  const queryTerms = extractTerms(queryNorm)
  const docTerms = extractTerms(docNorm)
  
  if (queryTerms.size === 0 || docTerms.size === 0) {
    return 0
  }
  
  // Calculate multiple similarity metrics and combine
  
  // 1. Jaccard similarity (set overlap)
  const intersection = new Set([...queryTerms].filter(t => docTerms.has(t)))
  const union = new Set([...queryTerms, ...docTerms])
  const jaccard = intersection.size / union.size
  
  // 2. Cosine similarity (term frequency)
  const queryTf = calculateTermFrequency(queryNorm)
  const docTf = calculateTermFrequency(docNorm)
  const cosine = calculateCosineSimilarity(queryTf, docTf)
  
  // 3. Keyword overlap (give more weight to important terms)
  const queryKeywords = extractKeywords(queryNorm)
  const docKeywords = extractKeywords(docNorm)
  const keywordOverlap = calculateKeywordOverlap(queryKeywords, docKeywords)
  
  // 4. Phrase matching (2-gram overlap)
  const queryBigrams = extractBigrams(queryNorm)
  const docBigrams = extractBigrams(docNorm)
  const bigramSim = calculateSetSimilarity(queryBigrams, docBigrams)
  
  // Weighted combination
  const similarity = (
    jaccard * 0.2 +
    cosine * 0.3 +
    keywordOverlap * 0.3 +
    bigramSim * 0.2
  )
  
  return Math.min(similarity, 1.0)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTerms(text: string): Set<string> {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you',
    'your', 'he', 'she', 'his', 'her', 'what', 'which', 'who', 'when',
    'where', 'why', 'how',
  ])
  
  return new Set(
    text
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word))
  )
}

function calculateTermFrequency(text: string): Map<string, number> {
  const terms = text.split(/\s+/)
  const tf = new Map<string, number>()
  
  terms.forEach(term => {
    if (term.length > 2) {
      tf.set(term, (tf.get(term) || 0) + 1)
    }
  })
  
  return tf
}

function calculateCosineSimilarity(tf1: Map<string, number>, tf2: Map<string, number>): number {
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()])
  
  let dotProduct = 0
  let mag1 = 0
  let mag2 = 0
  
  allTerms.forEach(term => {
    const freq1 = tf1.get(term) || 0
    const freq2 = tf2.get(term) || 0
    
    dotProduct += freq1 * freq2
    mag1 += freq1 * freq1
    mag2 += freq2 * freq2
  })
  
  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2)
  return magnitude > 0 ? dotProduct / magnitude : 0
}

function extractKeywords(text: string): Set<string> {
  // Extract potential keywords (longer words, capitalized terms, academic terms)
  const academicTerms = [
    'research', 'study', 'analysis', 'method', 'result', 'conclusion',
    'theory', 'model', 'framework', 'approach', 'data', 'experiment',
    'hypothesis', 'evidence', 'correlation', 'significant', 'factor',
    'impact', 'effect', 'relationship', 'variable', 'measure',
  ]
  
  const words = text.split(/\s+/)
  const keywords = new Set<string>()
  
  words.forEach(word => {
    if (word.length > 6 || academicTerms.includes(word)) {
      keywords.add(word)
    }
  })
  
  return keywords
}

function calculateKeywordOverlap(keywords1: Set<string>, keywords2: Set<string>): number {
  if (keywords1.size === 0 || keywords2.size === 0) return 0
  
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)))
  return intersection.size / Math.max(keywords1.size, keywords2.size)
}

function extractBigrams(text: string): Set<string> {
  const words = text.split(/\s+/).filter(w => w.length > 2)
  const bigrams = new Set<string>()
  
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`)
  }
  
  return bigrams
}

function calculateSetSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0
  
  const intersection = new Set([...set1].filter(item => set2.has(item)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

function categorizeSimilarPapers(papers: Paper[], queryText: string): {
  highlyRelevant: Paper[]
  relevant: Paper[]
  somewhatRelevant: Paper[]
  byYear: Map<number, Paper[]>
  byMethodology: Map<string, Paper[]>
} {
  const highlyRelevant: Paper[] = []
  const relevant: Paper[] = []
  const somewhatRelevant: Paper[] = []
  
  papers.forEach(paper => {
    const sim = paper.similarity || 0
    if (sim >= 0.7) highlyRelevant.push(paper)
    else if (sim >= 0.5) relevant.push(paper)
    else somewhatRelevant.push(paper)
  })
  
  // Group by year
  const byYear = new Map<number, Paper[]>()
  papers.forEach(paper => {
    if (paper.year) {
      if (!byYear.has(paper.year)) {
        byYear.set(paper.year, [])
      }
      byYear.get(paper.year)!.push(paper)
    }
  })
  
  // Categorize by methodology (simple heuristic)
  const byMethodology = new Map<string, Paper[]>()
  const methodKeywords = {
    'quantitative': ['quantitative', 'survey', 'statistical', 'experiment', 'correlation'],
    'qualitative': ['qualitative', 'interview', 'ethnography', 'case study', 'observation'],
    'mixed-methods': ['mixed methods', 'triangulation', 'both qualitative and quantitative'],
    'theoretical': ['theoretical', 'conceptual', 'framework', 'model'],
    'review': ['review', 'meta-analysis', 'systematic review', 'literature'],
  }
  
  papers.forEach(paper => {
    const paperText = `${paper.title} ${paper.abstract || ''}`.toLowerCase()
    
    for (const [method, keywords] of Object.entries(methodKeywords)) {
      if (keywords.some(kw => paperText.includes(kw))) {
        if (!byMethodology.has(method)) {
          byMethodology.set(method, [])
        }
        byMethodology.get(method)!.push(paper)
        break
      }
    }
  })
  
  return {
    highlyRelevant,
    relevant,
    somewhatRelevant,
    byYear,
    byMethodology,
  }
}

function formatSearchResults(
  results: ReturnType<typeof categorizeSimilarPapers>,
  query: string,
  totalPapers: number,
  matchedPapers: number
): string {
  let message = `# Semantic Search Results\n\n`
  
  message += `**Query:** ${query.slice(0, 200)}${query.length > 200 ? '...' : ''}\n\n`
  message += `**Searched:** ${totalPapers} papers\n`
  message += `**Found:** ${matchedPapers} similar papers\n\n`
  
  if (results.highlyRelevant.length > 0) {
    message += `## Highly Relevant (${results.highlyRelevant.length})\n\n`
    message += `Papers with strong conceptual similarity (≥70%):\n\n`
    
    results.highlyRelevant.forEach((paper, index) => {
      message += `### ${index + 1}. ${paper.title}\n`
      if (paper.authors && paper.authors.length > 0) {
        message += `**Authors:** ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}\n`
      }
      if (paper.year) message += `**Year:** ${paper.year}\n`
      if (paper.DOI) message += `**DOI:** ${paper.DOI}\n`
      message += `**Similarity:** ${((paper.similarity || 0) * 100).toFixed(1)}%\n`
      if (paper.abstract) {
        message += `\n${paper.abstract.slice(0, 300)}${paper.abstract.length > 300 ? '...' : ''}\n`
      }
      message += `\n`
    })
  }
  
  if (results.relevant.length > 0) {
    message += `## Relevant (${results.relevant.length})\n\n`
    message += `Papers with moderate conceptual similarity (50-70%):\n\n`
    
    results.relevant.forEach((paper, index) => {
      message += `${index + 1}. **${paper.title}** `
      if (paper.year) message += `(${paper.year}) `
      message += `- Similarity: ${((paper.similarity || 0) * 100).toFixed(1)}%\n`
    })
    message += `\n`
  }
  
  if (results.somewhatRelevant.length > 0) {
    message += `## Somewhat Relevant (${results.somewhatRelevant.length})\n\n`
    message += `Papers with some conceptual overlap (30-50%):\n\n`
    
    results.somewhatRelevant.slice(0, 5).forEach((paper, index) => {
      message += `${index + 1}. **${paper.title}**\n`
    })
    if (results.somewhatRelevant.length > 5) {
      message += `... and ${results.somewhatRelevant.length - 5} more\n`
    }
    message += `\n`
  }
  
  // Temporal analysis
  if (results.byYear.size > 0) {
    message += `## Temporal Distribution\n\n`
    const sortedYears = Array.from(results.byYear.keys()).sort((a, b) => b - a)
    sortedYears.slice(0, 5).forEach(year => {
      const count = results.byYear.get(year)!.length
      message += `- **${year}:** ${count} paper${count > 1 ? 's' : ''}\n`
    })
    message += `\n`
  }
  
  // Methodological distribution
  if (results.byMethodology.size > 0) {
    message += `## Methodological Approaches\n\n`
    const sortedMethods = Array.from(results.byMethodology.entries())
      .sort((a, b) => b[1].length - a[1].length)
    
    sortedMethods.forEach(([method, papers]) => {
      message += `- **${method.charAt(0).toUpperCase() + method.slice(1)}:** ${papers.length} paper${papers.length > 1 ? 's' : ''}\n`
    })
    message += `\n`
  }
  
  message += `## Next Steps\n\n`
  message += `1. Review highly relevant papers first for your literature review\n`
  message += `2. Check citations in these papers for additional sources\n`
  message += `3. Look for methodological gaps or opportunities\n`
  message += `4. Consider how your work relates to or builds on these findings\n`
  
  return message
}
