import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './analyze-research-trends.md'
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
  year: number
  abstract?: string
  keywords?: string[]
  authors?: string[]
  methodology?: string
}

interface Trend {
  topic: string
  years: number[]
  counts: number[]
  trend: 'emerging' | 'growing' | 'stable' | 'declining'
  momentum: number
  relatedKeywords: string[]
}

interface YearStats {
  year: number
  count: number
  topKeywords: string[]
  methodologies: Map<string, number>
}

export const analyzeResearchTrends = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      referenceFolder: z.string().describe('Path to folder containing reference files'),
      topic: z.string().optional().describe('Optional specific topic to track trends for'),
      startYear: z.number().optional().describe('Start year for analysis (default: earliest paper)'),
      endYear: z.number().optional().describe('End year for analysis (default: latest paper)'),
      minPapers: z.number().min(2).default(3).describe('Minimum papers needed to identify a trend'),
    }),
    execute: async ({ referenceFolder, topic, startYear, endYear, minPapers }, { toolCallId }) => {
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
            
            // Only include papers with valid years
            if (ref.year && typeof ref.year === 'number') {
              papers.push({
                id: ref.id || ref.DOI || file,
                title: ref.title || 'Untitled',
                year: ref.year,
                abstract: ref.abstract || ref.summary || '',
                keywords: ref.keywords || extractKeywordsFromText(ref.title, ref.abstract),
                authors: ref.authors || [],
                methodology: detectMethodology(ref.abstract || ref.title || ''),
              })
            }
          } catch (error) {
            console.debug(`Skipping invalid reference file: ${file}`)
          }
        }
        
        if (papers.length === 0) {
          throw new Error('No valid reference files with year information found')
        }
        
        // Determine year range
        const years = papers.map(p => p.year).sort((a, b) => a - b)
        const minYear = startYear || years[0]
        const maxYear = endYear || years[years.length - 1]
        
        if (maxYear - minYear < 1) {
          throw new Error('Need at least 2 years of data to analyze trends')
        }
        
        // Filter papers by year range
        const filteredPapers = papers.filter(p => p.year >= minYear && p.year <= maxYear)
        
        // Build year statistics
        const yearStats = new Map<number, YearStats>()
        for (let year = minYear; year <= maxYear; year++) {
          yearStats.set(year, {
            year,
            count: 0,
            topKeywords: [],
            methodologies: new Map<string, number>(),
          })
        }
        
        // Analyze each paper
        for (const paper of filteredPapers) {
          const stats = yearStats.get(paper.year)!
          stats.count++
          
          // Track methodologies
          if (paper.methodology) {
            const count = stats.methodologies.get(paper.methodology) || 0
            stats.methodologies.set(paper.methodology, count + 1)
          }
        }
        
        // Identify keyword trends
        const keywordsByYear = new Map<string, Map<number, number>>()
        
        for (const paper of filteredPapers) {
          if (paper.keywords) {
            for (const keyword of paper.keywords) {
              const normalized = keyword.toLowerCase().trim()
              if (!keywordsByYear.has(normalized)) {
                keywordsByYear.set(normalized, new Map<number, number>())
              }
              const yearCounts = keywordsByYear.get(normalized)!
              yearCounts.set(paper.year, (yearCounts.get(paper.year) || 0) + 1)
            }
          }
        }
        
        // Calculate trends
        const trends: Trend[] = []
        
        for (const [keyword, yearCounts] of keywordsByYear.entries()) {
          const totalPapers = Array.from(yearCounts.values()).reduce((sum, count) => sum + count, 0)
          
          if (totalPapers >= minPapers) {
            const yearArray = Array.from(yearCounts.keys()).sort((a, b) => a - b)
            const countArray = yearArray.map(y => yearCounts.get(y) || 0)
            
            // Calculate momentum (change in recent years)
            const momentum = calculateMomentum(yearArray, countArray)
            const trendType = classifyTrend(momentum, countArray)
            
            trends.push({
              topic: keyword,
              years: yearArray,
              counts: countArray,
              trend: trendType,
              momentum,
              relatedKeywords: findRelatedKeywords(keyword, keywordsByYear, filteredPapers),
            })
          }
        }
        
        // Sort by momentum (most trending first)
        trends.sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum))
        
        // Filter by topic if specified
        const relevantTrends = topic
          ? trends.filter(t => t.topic.includes(topic.toLowerCase()) || 
                             t.relatedKeywords.some(k => k.includes(topic.toLowerCase())))
          : trends
        
        // Calculate top keywords by year
        for (const [year, stats] of yearStats.entries()) {
          const keywordsThisYear = new Map<string, number>()
          for (const paper of filteredPapers.filter(p => p.year === year)) {
            if (paper.keywords) {
              for (const kw of paper.keywords) {
                const normalized = kw.toLowerCase().trim()
                keywordsThisYear.set(normalized, (keywordsThisYear.get(normalized) || 0) + 1)
              }
            }
          }
          stats.topKeywords = Array.from(keywordsThisYear.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([kw]) => kw)
        }
        
        // Generate report
        const report = generateTrendReport(
          filteredPapers,
          relevantTrends,
          Array.from(yearStats.values()),
          minYear,
          maxYear,
          topic
        )
        
        return report
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred'
        throw new Error(`Failed to analyze research trends: ${message}`)
      }
    },
  })

// Helper functions

function extractKeywordsFromText(title: string, abstract?: string): string[] {
  const text = `${title} ${abstract || ''}`.toLowerCase()
  const keywords: string[] = []
  
  // Common academic keywords and phrases
  const patterns = [
    /\b(machine learning|deep learning|neural network|artificial intelligence)\b/g,
    /\b(data analysis|data mining|big data|data science)\b/g,
    /\b(climate change|global warming|sustainability|renewable energy)\b/g,
    /\b(social media|digital media|online platform)\b/g,
    /\b(covid-19|pandemic|coronavirus|sars-cov-2)\b/g,
    /\b(blockchain|cryptocurrency|bitcoin|distributed ledger)\b/g,
    /\b(quantum computing|quantum mechanics|quantum physics)\b/g,
    /\b(gene editing|crispr|genomics|biotechnology)\b/g,
    /\b(virtual reality|augmented reality|mixed reality)\b/g,
    /\b(internet of things|iot|smart devices)\b/g,
  ]
  
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      keywords.push(...matches)
    }
  }
  
  return [...new Set(keywords)]
}

function calculateMomentum(years: number[], counts: number[]): number {
  if (years.length < 2) return 0
  
  // Use linear regression slope as momentum indicator
  const n = years.length
  const sumX = years.reduce((sum, year) => sum + year, 0)
  const sumY = counts.reduce((sum, count) => sum + count, 0)
  const sumXY = years.reduce((sum, year, i) => sum + year * counts[i], 0)
  const sumXX = years.reduce((sum, year) => sum + year * year, 0)
  
  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return 0
  const slope = (n * sumXY - sumX * sumY) / denominator
  
  return slope
}

function classifyTrend(momentum: number, counts: number[]): 'emerging' | 'growing' | 'stable' | 'declining' {
  const avgCount = counts.reduce((sum, c) => sum + c, 0) / counts.length
  
  if (momentum > avgCount * 0.3) return 'emerging'
  if (momentum > avgCount * 0.1) return 'growing'
  if (momentum < -avgCount * 0.1) return 'declining'
  return 'stable'
}

function findRelatedKeywords(
  keyword: string,
  keywordsByYear: Map<string, Map<number, number>>,
  papers: Paper[]
): string[] {
  const related = new Set<string>()
  
  // Find papers with this keyword
  const papersWithKeyword = papers.filter(p => 
    p.keywords?.some(k => k.toLowerCase().includes(keyword))
  )
  
  // Collect other keywords from these papers
  for (const paper of papersWithKeyword) {
    if (paper.keywords) {
      for (const kw of paper.keywords) {
        const normalized = kw.toLowerCase().trim()
        if (normalized !== keyword && !related.has(normalized)) {
          related.add(normalized)
        }
      }
    }
  }
  
  return Array.from(related).slice(0, 5)
}

function generateTrendReport(
  papers: Paper[],
  trends: Trend[],
  yearStats: YearStats[],
  startYear: number,
  endYear: number,
  topic?: string
): string {
  const totalPapers = papers.length
  const yearRange = endYear - startYear + 1
  
  let report = '# Research Trend Analysis Report\n\n'
  
  if (topic) {
    report += `**Topic Focus:** ${topic}\n`
  }
  report += `**Analysis Period:** ${startYear} - ${endYear} (${yearRange} years)\n`
  report += `**Total Papers:** ${totalPapers}\n\n`
  
  report += '---\n\n'
  
  // Overall publication trends
  report += '## 📊 Publication Activity Over Time\n\n'
  report += '| Year | Papers Published | Top Keywords |\n'
  report += '|------|------------------|-------------|\n'
  
  for (const stats of yearStats) {
    const keywords = stats.topKeywords.length > 0 ? stats.topKeywords.slice(0, 3).join(', ') : 'N/A'
    report += `| ${stats.year} | ${stats.count} | ${keywords} |\n`
  }
  
  report += '\n'
  
  // Calculate overall trend
  const firstHalf = yearStats.slice(0, Math.floor(yearStats.length / 2))
  const secondHalf = yearStats.slice(Math.floor(yearStats.length / 2))
  const avgFirstHalf = firstHalf.reduce((sum, s) => sum + s.count, 0) / firstHalf.length
  const avgSecondHalf = secondHalf.reduce((sum, s) => sum + s.count, 0) / secondHalf.length
  const overallTrend = avgSecondHalf > avgFirstHalf * 1.2 ? 'growing' : 
                       avgSecondHalf < avgFirstHalf * 0.8 ? 'declining' : 'stable'
  
  report += `**Overall Publication Trend:** ${overallTrend.charAt(0).toUpperCase() + overallTrend.slice(1)}\n\n`
  
  report += '---\n\n'
  
  // Emerging topics
  const emergingTrends = trends.filter(t => t.trend === 'emerging').slice(0, 10)
  if (emergingTrends.length > 0) {
    report += '## 🚀 Emerging Topics (Rapid Growth)\n\n'
    report += 'These topics show strong upward momentum and increasing research interest:\n\n'
    
    for (const trend of emergingTrends) {
      const growth = trend.counts[0] > 0
        ? ((trend.counts[trend.counts.length - 1] / trend.counts[0]) * 100).toFixed(0)
        : 'N/A'
      report += `### ${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}\n`
      report += `- **Momentum Score:** ${trend.momentum.toFixed(2)}\n`
      report += `- **Papers:** ${trend.counts.reduce((sum, c) => sum + c, 0)} total\n`
      report += `- **Growth:** ${growth}% increase from ${trend.years[0]} to ${trend.years[trend.years.length - 1]}\n`
      if (trend.relatedKeywords.length > 0) {
        report += `- **Related Keywords:** ${trend.relatedKeywords.join(', ')}\n`
      }
      report += '\n'
    }
    
    report += '---\n\n'
  }
  
  // Growing topics
  const growingTrends = trends.filter(t => t.trend === 'growing').slice(0, 10)
  if (growingTrends.length > 0) {
    report += '## 📈 Growing Topics (Steady Increase)\n\n'
    report += 'These topics show consistent growth and sustained interest:\n\n'
    
    for (const trend of growingTrends) {
      report += `### ${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}\n`
      report += `- **Momentum Score:** ${trend.momentum.toFixed(2)}\n`
      report += `- **Papers:** ${trend.counts.reduce((sum, c) => sum + c, 0)} total\n`
      report += `- **Trend:** Consistent upward trajectory\n`
      if (trend.relatedKeywords.length > 0) {
        report += `- **Related Keywords:** ${trend.relatedKeywords.join(', ')}\n`
      }
      report += '\n'
    }
    
    report += '---\n\n'
  }
  
  // Stable topics
  const stableTrends = trends.filter(t => t.trend === 'stable').slice(0, 5)
  if (stableTrends.length > 0) {
    report += '## 📊 Stable Topics (Established Fields)\n\n'
    report += 'These topics maintain consistent research activity:\n\n'
    
    for (const trend of stableTrends) {
      report += `- **${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}**: `
      report += `${trend.counts.reduce((sum, c) => sum + c, 0)} papers, stable over time\n`
    }
    
    report += '\n---\n\n'
  }
  
  // Declining topics
  const decliningTrends = trends.filter(t => t.trend === 'declining').slice(0, 5)
  if (decliningTrends.length > 0) {
    report += '## 📉 Declining Topics (Waning Interest)\n\n'
    report += 'These topics show decreasing research activity:\n\n'
    
    for (const trend of decliningTrends) {
      report += `- **${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}**: `
      report += `${trend.counts.reduce((sum, c) => sum + c, 0)} papers, downward trend (momentum: ${trend.momentum.toFixed(2)})\n`
    }
    
    report += '\n---\n\n'
  }
  
  // Methodology trends
  report += '## 🔬 Methodological Trends\n\n'
  const allMethodologies = new Map<string, number>()
  for (const paper of papers) {
    if (paper.methodology) {
      allMethodologies.set(paper.methodology, (allMethodologies.get(paper.methodology) || 0) + 1)
    }
  }
  
  const sortedMethods = Array.from(allMethodologies.entries())
    .sort((a, b) => b[1] - a[1])
  
  report += '| Methodology | Papers | Percentage |\n'
  report += '|-------------|--------|------------|\n'
  
  for (const [method, count] of sortedMethods) {
    const pct = ((count / totalPapers) * 100).toFixed(1)
    report += `| ${method} | ${count} | ${pct}% |\n`
  }
  
  report += '\n---\n\n'
  
  // Research implications
  report += '## 💡 Research Implications\n\n'
  
  if (emergingTrends.length > 0) {
    report += '### Hot Topics for New Research\n\n'
    report += 'Consider focusing on these rapidly growing areas:\n\n'
    for (const trend of emergingTrends.slice(0, 3)) {
      report += `- **${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}**: `
      report += `High momentum (${trend.momentum.toFixed(2)}) indicates strong current interest\n`
    }
    report += '\n'
  }
  
  if (decliningTrends.length > 0) {
    report += '### Topics to Approach with Caution\n\n'
    report += 'These areas show declining interest, which may indicate:\n'
    report += '- Saturated research field\n'
    report += '- Solved problems or diminishing returns\n'
    report += '- Shifting focus to related but different topics\n\n'
    for (const trend of decliningTrends.slice(0, 3)) {
      report += `- ${trend.topic.charAt(0).toUpperCase() + trend.topic.slice(1)}\n`
    }
    report += '\n'
  }
  
  report += '### Recommendations\n\n'
  report += '1. **Follow emerging trends** to position research in high-impact areas\n'
  report += '2. **Cross-reference with stable topics** to build on established foundations\n'
  report += '3. **Consider interdisciplinary approaches** combining trending topics\n'
  report += '4. **Monitor methodology shifts** to use appropriate research methods\n'
  report += '5. **Identify gaps** between declining and emerging topics for novel contributions\n\n'
  
  report += '---\n\n'
  report += `*Report generated from ${totalPapers} papers spanning ${yearRange} years (${startYear}-${endYear})*`
  
  return report
}
