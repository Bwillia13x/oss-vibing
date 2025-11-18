/**
 * Research Tools Integration Service
 * Provides unified access to academic research databases and platforms
 * Supports: Google Scholar, PubMed, arXiv, IEEE Xplore
 */

import monitoring from './monitoring'

export interface ResearchPaper {
  id: string
  title: string
  authors: string[]
  abstract?: string
  year?: number
  venue?: string // Journal, conference, etc.
  doi?: string
  url?: string
  citationCount?: number
  pdfUrl?: string
  source: 'google-scholar' | 'pubmed' | 'arxiv' | 'ieee' | 'jstor'
  metadata?: Record<string, any>
}

export interface SearchOptions {
  query: string
  maxResults?: number
  yearStart?: number
  yearEnd?: number
  sortBy?: 'relevance' | 'date' | 'citations'
  sources?: Array<'google-scholar' | 'pubmed' | 'arxiv' | 'ieee' | 'jstor'>
}

export interface SearchResult {
  papers: ResearchPaper[]
  totalResults: number
  source: string
  query: string
  executionTime: number
}

/**
 * Search Google Scholar for academic papers
 * Supports Serpapi for production use with fallback to mock data
 */
export async function searchGoogleScholar(
  query: string,
  maxResults: number = 10
): Promise<ResearchPaper[]> {
  const startTime = Date.now()
  
  try {
    const serpApiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY
    
    // If Serpapi key is available, use it for real searches
    // Works in both client and server contexts
    if (serpApiKey) {
      return await searchGoogleScholarWithSerpapi(query, maxResults, serpApiKey)
    }
    
    // Fallback to mock data for development/demo
    console.log(`[Google Scholar] No Serpapi key configured, using mock data for: ${query}`)
    
    const mockPapers: ResearchPaper[] = generateMockPapers(query, maxResults)
    
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'google-scholar',
      query,
      results: mockPapers.length.toString(),
      mode: 'mock',
    })
    
    return mockPapers
  } catch (error) {
    console.error('Error searching Google Scholar:', error)
    monitoring.trackError(error as Error, {
      source: 'google-scholar',
      query,
    })
    return []
  }
}

/**
 * Search Google Scholar using Serpapi
 */
async function searchGoogleScholarWithSerpapi(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<ResearchPaper[]> {
  try {
    const params = new URLSearchParams({
      engine: 'google_scholar',
      q: query,
      num: maxResults.toString(),
      api_key: apiKey,
    })
    
    const response = await fetch(`https://serpapi.com/search?${params}`)
    
    if (!response.ok) {
      throw new Error(`Serpapi returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Parse Serpapi results into our ResearchPaper format
    const papers: ResearchPaper[] = (data.organic_results || []).map((result: any) => ({
      title: result.title || '',
      authors: result.publication_info?.authors?.map((a: any) => a.name || a) || [],
      year: extractYear(result.publication_info?.summary || ''),
      abstract: result.snippet || '',
      url: result.link || '',
      citationCount: result.inline_links?.cited_by?.total || 0,
      source: 'google-scholar',
      doi: extractDOI(result.link || ''),
    }))
    
    return papers
  } catch (error) {
    console.error('Serpapi search failed:', error)
    // Fallback to mock data on error
    return generateMockPapers(query, maxResults)
  }
}

/**
 * Generate mock papers for development/demo
 */
function generateMockPapers(query: string, maxResults: number): ResearchPaper[] {
  const mockPapers: ResearchPaper[] = []
  
  // Generate some realistic-looking mock data
  for (let i = 0; i < Math.min(maxResults, 5); i++) {
    mockPapers.push({
      id: `mock-${Date.now()}-${i}`,
      title: `${query}: A Comprehensive Study (${2020 + i})`,
      authors: [`Author ${i + 1}`, `Researcher ${i + 1}`],
      year: 2020 + i,
      abstract: `This paper examines ${query.toLowerCase()} from multiple perspectives, providing insights into current research trends and future directions.`,
      url: `https://scholar.google.com/mock/${i + 1}`,
      citationCount: Math.floor(Math.random() * 100),
      source: 'google-scholar',
    })
  }
  
  return mockPapers
}

/**
 * Extract year from publication info string
 */
function extractYear(text: string): number {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()
}

/**
 * Extract DOI from URL if present
 */
function extractDOI(url: string): string | undefined {
  const doiMatch = url.match(/10\.\d{4,}\/[^\s]+/)
  return doiMatch ? doiMatch[0] : undefined
}

/**
 * Search PubMed for biomedical literature
 * Uses NCBI E-utilities API (free, no API key required for basic use)
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 10
): Promise<ResearchPaper[]> {
  const startTime = Date.now()
  
  try {
    // PubMed E-utilities API endpoint
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: maxResults.toString(),
      retmode: 'json',
    })
    
    // Search for paper IDs
    const searchResponse = await fetch(`${searchUrl}?${searchParams}`)
    const searchData = await searchResponse.json()
    
    if (!searchData.esearchresult?.idlist) {
      return []
    }
    
    const ids = searchData.esearchresult.idlist
    
    if (ids.length === 0) {
      return []
    }
    
    // Fetch paper details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`
    const fetchParams = new URLSearchParams({
      db: 'pubmed',
      id: ids.join(','),
      retmode: 'xml',
    })
    
    const fetchResponse = await fetch(`${fetchUrl}?${fetchParams}`)
    const _xmlText = await fetchResponse.text()
    
    // Parse XML (simplified - in production use a proper XML parser)
    const papers: ResearchPaper[] = ids.map((id: string, _index: number) => ({
      id: `pubmed-${id}`,
      title: `PubMed Paper ${id}`, // Parse from XML
      authors: [],
      year: new Date().getFullYear(),
      source: 'pubmed' as const,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      metadata: { pubmedId: id },
    }))
    
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'pubmed',
      query,
      results: papers.length.toString(),
    })
    
    return papers
  } catch (error) {
    console.error('Error searching PubMed:', error)
    monitoring.trackError(error as Error, {
      source: 'pubmed',
      query,
    })
    return []
  }
}

/**
 * Search arXiv for preprints
 * Uses arXiv API (free, no API key required)
 */
export async function searchArXiv(
  query: string,
  maxResults: number = 10
): Promise<ResearchPaper[]> {
  const startTime = Date.now()
  
  try {
    const apiUrl = `http://export.arxiv.org/api/query`
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: maxResults.toString(),
      sortBy: 'relevance',
      sortOrder: 'descending',
    })
    
    const response = await fetch(`${apiUrl}?${params}`)
    const xmlText = await response.text()
    
    // Parse Atom XML feed (simplified)
    // In production, use a proper XML parser like fast-xml-parser
    const entryMatches = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g) || []
    
    const papers: ResearchPaper[] = entryMatches.map((entry, index) => {
      const idMatch = entry.match(/<id>(.*?)<\/id>/)
      const titleMatch = entry.match(/<title>(.*?)<\/title>/)
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/)
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/)
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g) || []
      
      const arxivId = idMatch ? idMatch[1].split('/abs/')[1] : `arxiv-${index}`
      const year = publishedMatch ? new Date(publishedMatch[1]).getFullYear() : undefined
      
      const authors = authorMatches.map(author => {
        const nameMatch = author.match(/<name>(.*?)<\/name>/)
        return nameMatch ? nameMatch[1].trim() : ''
      }).filter(Boolean)
      
      return {
        id: arxivId,
        title: titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'Untitled',
        authors,
        abstract: summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, ' ') : undefined,
        year,
        source: 'arxiv' as const,
        url: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
        metadata: { arxivId },
      }
    })
    
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'arxiv',
      query,
      results: papers.length.toString(),
    })
    
    return papers
  } catch (error) {
    console.error('Error searching arXiv:', error)
    monitoring.trackError(error as Error, {
      source: 'arxiv',
      query,
    })
    return []
  }
}

/**
 * Search IEEE Xplore
 * Requires API key from IEEE (https://developer.ieee.org/)
 * API Documentation: https://developer.ieee.org/docs
 */
export async function searchIEEE(
  query: string,
  maxResults: number = 10
): Promise<ResearchPaper[]> {
  const startTime = Date.now()
  
  try {
    const apiKey = process.env.IEEE_API_KEY
    
    if (!apiKey) {
      console.warn('IEEE API key not configured - search unavailable')
      monitoring.trackMetric('research_search_time', Date.now() - startTime, {
        source: 'ieee',
        query,
        results: '0',
        status: 'no_api_key',
      })
      return []
    }
    
    const apiUrl = `http://ieeexploreapi.ieee.org/api/v1/search/articles`
    const params = new URLSearchParams({
      querytext: query,
      max_records: maxResults.toString(),
      sort_field: 'relevance',
      apikey: apiKey,
    })
    
    const response = await fetch(`${apiUrl}?${params}`, {
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('IEEE API authentication failed - check API key')
        monitoring.trackMetric('research_search_time', Date.now() - startTime, {
          source: 'ieee',
          query,
          results: '0',
          status: 'auth_failed',
        })
        return []
      }
      throw new Error(`IEEE API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.articles || !Array.isArray(data.articles)) {
      monitoring.trackMetric('research_search_time', Date.now() - startTime, {
        source: 'ieee',
        query,
        results: '0',
      })
      return []
    }
    
    // Enhanced field mapping with fallbacks and normalization
    const papers: ResearchPaper[] = data.articles.map((article: any) => {
      // Normalize authors - handle different formats
      let authors: string[] = []
      if (article.authors?.authors && Array.isArray(article.authors.authors)) {
        authors = article.authors.authors
          .map((a: any) => a.full_name || `${a.fname || ''} ${a.lname || ''}`.trim())
          .filter((name: string) => name.length > 0)
      }
      
      // Parse publication year with fallbacks
      const year = article.publication_year || 
                   (article.publication_date ? parseInt(article.publication_date.substring(0, 4)) : undefined)
      
      // Construct DOI URL if DOI exists
      const doiUrl = article.doi ? `https://doi.org/${article.doi}` : undefined
      
      return {
        id: `ieee-${article.article_number || article.arnumber}`,
        title: article.title || 'Untitled',
        authors,
        abstract: article.abstract || article.summary,
        year,
        venue: article.publication_title || article.pubtitle,
        doi: article.doi,
        source: 'ieee' as const,
        url: doiUrl || article.pdf_url || article.html_url || article.content_url,
        pdfUrl: article.pdf_url,
        citationCount: article.citing_paper_count || article.reference_count,
        metadata: {
          articleNumber: article.article_number || article.arnumber,
          isbn: article.isbn,
          issn: article.issn,
          startPage: article.start_page,
          endPage: article.end_page,
          publisher: article.publisher,
          documentType: article.content_type,
        },
      }
    })
    
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'ieee',
      query,
      results: papers.length.toString(),
      status: 'success',
    })
    
    return papers
  } catch (error) {
    console.error('Error searching IEEE Xplore:', error)
    monitoring.trackError(error as Error, {
      source: 'ieee',
      query,
    })
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'ieee',
      query,
      results: '0',
      status: 'error',
    })
    return []
  }
}

/**
 * Search JSTOR
 * Requires API access (institutional subscription typically required)
 * API Documentation: https://about.jstor.org/whats-in-jstor/text-mining-support/
 */
export async function searchJSTOR(
  query: string,
  maxResults: number = 10
): Promise<ResearchPaper[]> {
  const startTime = Date.now()
  
  try {
    const apiKey = process.env.JSTOR_API_KEY
    
    if (!apiKey) {
      console.warn('JSTOR API key not configured - search unavailable')
      monitoring.trackMetric('research_search_time', Date.now() - startTime, {
        source: 'jstor',
        query,
        results: '0',
        status: 'no_api_key',
      })
      return []
    }
    
    // JSTOR Data for Research API endpoint
    // Note: Actual implementation requires institutional access and approved API key
    const apiUrl = 'https://www.jstor.org/api/search'
    
    const params = new URLSearchParams({
      q: query,
      rows: maxResults.toString(),
      sort: 'score desc',
    })
    
    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('JSTOR API authentication failed - check API key')
        monitoring.trackMetric('research_search_time', Date.now() - startTime, {
          source: 'jstor',
          query,
          results: '0',
          status: 'auth_failed',
        })
        return []
      }
      throw new Error(`JSTOR API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.response?.docs) {
      monitoring.trackMetric('research_search_time', Date.now() - startTime, {
        source: 'jstor',
        query,
        results: '0',
      })
      return []
    }
    
    const papers: ResearchPaper[] = data.response.docs.map((doc: any) => ({
      id: `jstor-${doc.id || doc.item_id}`,
      title: doc.title || doc.item_title,
      authors: Array.isArray(doc.author) 
        ? doc.author 
        : doc.author 
          ? [doc.author] 
          : [],
      abstract: doc.abstract || doc.snippet,
      year: doc.publication_year || parseInt(doc.publicationDate?.substring(0, 4) || '0'),
      venue: doc.journal_title || doc.publication_title,
      doi: doc.doi,
      source: 'jstor' as const,
      url: doc.url || `https://www.jstor.org/stable/${doc.id}`,
      metadata: {
        itemId: doc.item_id,
        itemType: doc.item_type,
        publisher: doc.publisher,
      },
    }))
    
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'jstor',
      query,
      results: papers.length.toString(),
      status: 'success',
    })
    
    return papers
  } catch (error) {
    console.error('Error searching JSTOR:', error)
    monitoring.trackError(error as Error, {
      source: 'jstor',
      query,
    })
    monitoring.trackMetric('research_search_time', Date.now() - startTime, {
      source: 'jstor',
      query,
      results: '0',
      status: 'error',
    })
    return []
  }
}

/**
 * Unified search across multiple sources
 */
export async function searchMultipleSources(
  options: SearchOptions
): Promise<SearchResult[]> {
  const {
    query,
    maxResults = 10,
    sources = ['arxiv', 'pubmed'],
  } = options
  
  const results: SearchResult[] = []
  const searchPromises: Promise<{ source: string; papers: ResearchPaper[] }>[] = []
  
  // Search each source in parallel
  if (sources.includes('google-scholar')) {
    searchPromises.push(
      searchGoogleScholar(query, maxResults).then(papers => ({
        source: 'google-scholar',
        papers,
      }))
    )
  }
  
  if (sources.includes('pubmed')) {
    searchPromises.push(
      searchPubMed(query, maxResults).then(papers => ({
        source: 'pubmed',
        papers,
      }))
    )
  }
  
  if (sources.includes('arxiv')) {
    searchPromises.push(
      searchArXiv(query, maxResults).then(papers => ({
        source: 'arxiv',
        papers,
      }))
    )
  }
  
  if (sources.includes('ieee')) {
    searchPromises.push(
      searchIEEE(query, maxResults).then(papers => ({
        source: 'ieee',
        papers,
      }))
    )
  }
  
  if (sources.includes('jstor')) {
    searchPromises.push(
      searchJSTOR(query, maxResults).then(papers => ({
        source: 'jstor',
        papers,
      }))
    )
  }
  
  // Wait for all searches to complete
  const searchResults = await Promise.allSettled(searchPromises)
  
  searchResults.forEach((result, _index) => {
    if (result.status === 'fulfilled') {
      const { source, papers } = result.value
      results.push({
        papers,
        totalResults: papers.length,
        source,
        query,
        executionTime: 0, // Already tracked in individual functions
      })
    } else {
      console.error(`Search failed for source:`, result.reason)
    }
  })
  
  return results
}

/**
 * Get paper details by DOI
 */
export async function getPaperByDOI(doi: string): Promise<ResearchPaper | null> {
  try {
    // Validate DOI format to prevent request forgery
    const doiRegex = /^10\.\d{4,}\/[^\s]+$/
    if (!doiRegex.test(doi)) {
      console.warn('Invalid DOI format:', doi)
      return null
    }
    
    // Use Crossref API (free, no API key required)
    // DOI is validated above, so this is safe from request forgery
    const encodedDoi = encodeURIComponent(doi)
    const response = await fetch(`https://api.crossref.org/works/${encodedDoi}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    const work = data.message
    
    const paper: ResearchPaper = {
      id: `doi-${doi}`,
      title: work.title?.[0] || 'Untitled',
      authors: work.author?.map((a: any) => `${a.given} ${a.family}`) || [],
      abstract: work.abstract,
      year: work.published?.['date-parts']?.[0]?.[0],
      venue: work['container-title']?.[0],
      doi,
      url: work.URL,
      citationCount: work['is-referenced-by-count'],
      source: 'arxiv', // Generic source for DOI lookups
      metadata: {
        type: work.type,
        publisher: work.publisher,
        issn: work.ISSN,
      },
    }
    
    return paper
  } catch (error) {
    console.error('Error fetching paper by DOI:', error)
    monitoring.trackError(error as Error, {
      method: 'getPaperByDOI',
      doi,
    })
    return null
  }
}

/**
 * Format citation from paper
 */
export function formatCitation(
  paper: ResearchPaper,
  style: 'apa' | 'mla' | 'chicago' = 'apa'
): string {
  const authors = paper.authors.join(', ')
  const year = paper.year || 'n.d.'
  
  switch (style) {
    case 'apa':
      return `${authors} (${year}). ${paper.title}. ${paper.venue || ''}. ${paper.doi ? `https://doi.org/${paper.doi}` : paper.url || ''}`
    
    case 'mla':
      return `${authors}. "${paper.title}." ${paper.venue || ''}, ${year}. ${paper.url || ''}`
    
    case 'chicago':
      return `${authors}. "${paper.title}." ${paper.venue || ''} (${year}). ${paper.url || ''}`
    
    default:
      return `${authors}. ${paper.title}. ${year}.`
  }
}
