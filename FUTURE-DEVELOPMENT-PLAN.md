# Vibe University - Detailed Future Development Plan

**Date:** November 15, 2025  
**Planning Horizon:** 6 months (Nov 2025 - May 2026)  
**Target:** Production-Ready Institutional Platform  
**Current Completion:** 78%  
**Target Completion:** 100%

---

## Executive Summary

This document outlines a comprehensive, prioritized development plan to bring Vibe University from 78% completion to production-ready status for institutional deployment. The plan is organized into three phases over 6 months, with clear milestones, resource requirements, and success criteria.

### Strategic Objectives

1. **Complete Core Features:** Implement real citation APIs and PDF processing
2. **Achieve Compliance:** FERPA compliance for institutional deployment
3. **Ensure Quality:** 100% test pass rate, 80%+ coverage
4. **Enable Collaboration:** Real-time collaborative editing
5. **Production Deploy:** Launch beta to 5 pilot institutions

### Timeline Overview

```
Phase 13: Real API Integrations (Weeks 1-6)
├── Real citation APIs (Crossref, OpenAlex, Semantic Scholar)
├── PDF processing with GROBID
├── Grammar API integration
└── Test fixes and stability

Phase 14: Compliance & Quality (Weeks 7-12)
├── FERPA compliance implementation
├── Advanced statistics completion
├── Database migration planning
└── Testing and quality improvements

Phase 15: Advanced Features (Months 4-6)
├── Real-time collaboration (Yjs)
├── Reference manager sync (Zotero)
├── Production deployment
└── Pilot program launch
```

---

## Phase 13: Real API Integrations & Core Completion

**Duration:** 6 weeks  
**Goal:** Complete core academic features with real data  
**Priority:** CRITICAL  

### Week 1: Foundation & Test Fixes

#### Sprint 13.1: Test Stability & API Setup

**Priority 1: Fix Failing Tests** (Days 1-2)
```typescript
// Problem: 17 tests failing due to database setup
// Files: tests/repositories.test.ts, tests/admin-apis.test.ts

Tasks:
- [ ] Refactor test database setup
- [ ] Create proper test fixtures
- [ ] Implement beforeEach cleanup
- [ ] Seed test user consistently
- [ ] Add test isolation
- [ ] Verify all 201 tests pass

Code Changes:
// tests/setup.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanDatabase() {
  await prisma.citation.deleteMany()
  await prisma.reference.deleteMany()
  await prisma.document.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
}

export async function seedTestUser() {
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    }
  })
}

// Update all test files to use:
beforeEach(async () => {
  await cleanDatabase()
  await seedTestUser()
})
```

**Deliverable:** 100% test pass rate  
**Success Metric:** 201/201 tests passing  
**Estimated Effort:** 1-2 days  

**Priority 2: Register API Accounts** (Days 2-3)
```
Academic APIs (all free):
- [ ] Crossref API: https://www.crossref.org/services/metadata-delivery/
  - Register for free account
  - Get API key
  - Read rate limits (50 requests/second)
  - Set up polite pool (mailto: parameter)

- [ ] OpenAlex API: https://openalex.org/
  - No API key required
  - Rate limit: 100,000 requests/day
  - Add polite email in User-Agent
  - Review API documentation

- [ ] Semantic Scholar API: https://www.semanticscholar.org/product/api
  - Register for API key
  - Rate limit: 100 requests/second with key
  - Review documentation
  - Test sample requests

- [ ] Unpaywall API: https://unpaywall.org/products/api
  - Free for non-commercial
  - Register email for polite access
  - Rate limit: 100,000 requests/day
  - Review documentation

Grammar API:
- [ ] LanguageTool API: https://languagetooltool.org/http-api
  - Option 1: Self-hosted (free, unlimited)
  - Option 2: Cloud ($20-50/month)
  - Decision: Start with self-hosted
```

**Deliverable:** All API credentials configured  
**Success Metric:** Successful test requests to all APIs  
**Estimated Effort:** 1 day  

**Priority 3: Set Up Development Infrastructure** (Days 3-5)
```
Docker Services:
- [ ] GROBID service for PDF processing
  - Pull image: docker pull lfoppiano/grobid:0.8.0
  - Configure docker-compose.yml
  - Test with sample PDF
  - Document setup process

- [ ] LanguageTool (if self-hosted)
  - Pull image: docker pull erikvl87/languagetool
  - Configure docker-compose.yml
  - Test grammar checking
  - Configure languages

- [ ] Redis (for production caching)
  - Pull image: redis:7-alpine
  - Configure persistence
  - Set up connection pooling
  - Test caching functionality

// docker-compose.yml additions
services:
  grobid:
    image: lfoppiano/grobid:0.8.0
    ports:
      - "8070:8070"
    environment:
      - GROBID_SERVICE_NAMES=processFulltextDocument
    volumes:
      - ./grobid-data:/opt/grobid/grobid-home/tmp

  languagetool:
    image: erikvl87/languagetool
    ports:
      - "8081:8010"
    environment:
      - langtool_languageModel=/ngrams
      - Java_Xms=512m
      - Java_Xmx=2g

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
```

**Deliverable:** Working development environment  
**Success Metric:** All services healthy and responding  
**Estimated Effort:** 2 days  

### Week 2: Crossref API Integration

#### Sprint 13.2: Citation API - Crossref

**Implementation:**
```typescript
// lib/citations/crossref-client.ts

export interface CrossrefWork {
  DOI: string
  title: string[]
  author: Array<{ given?: string; family: string }>
  'published-print'?: { 'date-parts': number[][] }
  'container-title'?: string[]
  volume?: string
  page?: string
  publisher?: string
  type: string
}

export class CrossrefClient {
  private baseUrl = 'https://api.crossref.org/works'
  private email = process.env.CROSSREF_EMAIL || 'dev@vibeuniversity.com'
  private cache: Map<string, CrossrefWork>

  constructor() {
    this.cache = new Map()
  }

  /**
   * Resolve DOI to citation metadata
   */
  async resolveDOI(doi: string): Promise<CrossrefWork | null> {
    // Check cache first
    if (this.cache.has(doi)) {
      return this.cache.get(doi)!
    }

    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(doi)}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Crossref API error: ${response.status}`)
      }

      const data = await response.json()
      const work = data.message as CrossrefWork

      // Cache result
      this.cache.set(doi, work)

      return work
    } catch (error) {
      console.error('Crossref API error:', error)
      return null
    }
  }

  /**
   * Search for works by query
   */
  async search(query: string, limit = 20): Promise<CrossrefWork[]> {
    try {
      const params = new URLSearchParams({
        query,
        rows: limit.toString(),
        mailto: this.email
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`
        }
      })

      if (!response.ok) {
        throw new Error(`Crossref search error: ${response.status}`)
      }

      const data = await response.json()
      return data.message.items as CrossrefWork[]
    } catch (error) {
      console.error('Crossref search error:', error)
      return []
    }
  }

  /**
   * Convert Crossref work to CSL-JSON
   */
  toCSL(work: CrossrefWork): any {
    return {
      type: work.type === 'journal-article' ? 'article-journal' : work.type,
      DOI: work.DOI,
      title: work.title[0],
      author: work.author.map(a => ({
        given: a.given,
        family: a.family
      })),
      issued: work['published-print']?.['date-parts']?.[0] 
        ? { 'date-parts': work['published-print']['date-parts'] }
        : undefined,
      'container-title': work['container-title']?.[0],
      volume: work.volume,
      page: work.page,
      publisher: work.publisher
    }
  }
}

// Singleton instance
export const crossrefClient = new CrossrefClient()
```

**Update find-sources tool:**
```typescript
// ai/tools/find-sources.ts

import { crossrefClient } from '@/lib/citations/crossref-client'

export async function findSourcesTool(params: FindSourcesParams) {
  const { query, count = 10 } = params

  // Use real Crossref API
  const works = await crossrefClient.search(query, count)

  // Convert to our format
  const sources = works.map(work => ({
    title: work.title[0],
    authors: work.author.map(a => `${a.given} ${a.family}`).join(', '),
    year: work['published-print']?.['date-parts']?.[0]?.[0] || 'n.d.',
    doi: work.DOI,
    url: `https://doi.org/${work.DOI}`,
    type: work.type,
    journal: work['container-title']?.[0],
    abstract: work.abstract || ''
  }))

  return { sources, count: sources.length }
}
```

**Tasks:**
- [ ] Implement Crossref client
- [ ] Add rate limiting (50 req/sec)
- [ ] Add caching layer (Redis)
- [ ] Update find-sources tool
- [ ] Update verify-citations tool
- [ ] Add error handling
- [ ] Write unit tests (20+ tests)
- [ ] Write integration tests
- [ ] Update documentation

**Deliverable:** Working Crossref integration  
**Success Metric:** 95%+ DOI resolution success rate  
**Estimated Effort:** 3-4 days  

### Week 3: OpenAlex & Semantic Scholar Integration

#### Sprint 13.3: Advanced Citation APIs

**OpenAlex Client:**
```typescript
// lib/citations/openalex-client.ts

export class OpenAlexClient {
  private baseUrl = 'https://api.openalex.org'
  private email = process.env.OPENALEX_EMAIL || 'dev@vibeuniversity.com'

  async searchWorks(query: string, limit = 20) {
    const params = new URLSearchParams({
      'filter': `title.search:${query}`,
      'per-page': limit.toString(),
      'mailto': this.email
    })

    const response = await fetch(`${this.baseUrl}/works?${params}`)
    const data = await response.json()
    
    return data.results.map((work: any) => ({
      id: work.id,
      doi: work.doi,
      title: work.title,
      authors: work.authorships.map((a: any) => ({
        name: a.author.display_name,
        orcid: a.author.orcid
      })),
      publicationYear: work.publication_year,
      citedByCount: work.cited_by_count,
      concepts: work.concepts.map((c: any) => c.display_name),
      abstract: work.abstract_inverted_index,
      openAccess: work.open_access
    }))
  }

  async getWork(id: string) {
    const response = await fetch(`${this.baseUrl}/works/${id}?mailto=${this.email}`)
    return response.json()
  }

  async getCitingWorks(id: string) {
    const response = await fetch(
      `${this.baseUrl}/works?filter=cites:${id}&mailto=${this.email}`
    )
    const data = await response.json()
    return data.results
  }

  async getRelatedWorks(id: string) {
    const response = await fetch(
      `${this.baseUrl}/works?filter=related_to:${id}&mailto=${this.email}`
    )
    const data = await response.json()
    return data.results
  }
}

export const openAlexClient = new OpenAlexClient()
```

**Semantic Scholar Client:**
```typescript
// lib/citations/semantic-scholar-client.ts

export class SemanticScholarClient {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1'
  private apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY

  async searchPapers(query: string, limit = 20) {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      fields: 'paperId,title,authors,year,citationCount,influentialCitationCount,abstract'
    })

    const response = await fetch(
      `${this.baseUrl}/paper/search?${params}`,
      {
        headers: this.apiKey ? { 'x-api-key': this.apiKey } : {}
      }
    )

    const data = await response.json()
    return data.data
  }

  async getPaper(paperId: string) {
    const fields = [
      'paperId', 'title', 'authors', 'year', 'abstract',
      'citationCount', 'influentialCitationCount', 
      'citations', 'references', 'tldr'
    ].join(',')

    const response = await fetch(
      `${this.baseUrl}/paper/${paperId}?fields=${fields}`,
      {
        headers: this.apiKey ? { 'x-api-key': this.apiKey } : {}
      }
    )

    return response.json()
  }

  async getCitations(paperId: string) {
    const response = await fetch(
      `${this.baseUrl}/paper/${paperId}/citations?fields=paperId,title,year`,
      {
        headers: this.apiKey ? { 'x-api-key': this.apiKey } : {}
      }
    )

    const data = await response.json()
    return data.data
  }

  async getReferences(paperId: string) {
    const response = await fetch(
      `${this.baseUrl}/paper/${paperId}/references?fields=paperId,title,year`,
      {
        headers: this.apiKey ? { 'x-api-key': this.apiKey } : {}
      }
    )

    const data = await response.json()
    return data.data
  }

  async getRecommendations(paperId: string, limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/paper/${paperId}/recommendations?limit=${limit}`,
      {
        headers: this.apiKey ? { 'x-api-key': this.apiKey } : {}
      }
    )

    const data = await response.json()
    return data.recommendedPapers
  }
}

export const semanticScholarClient = new SemanticScholarClient()
```

**Update Phase 8 AI Tools:**
```typescript
// ai/tools/semantic-search-papers.ts - Update to use real APIs

export async function semanticSearchPapers(params: SearchParams) {
  const { query, limit = 20 } = params

  // Use OpenAlex for broad search
  const openAlexResults = await openAlexClient.searchWorks(query, limit)

  // Use Semantic Scholar for semantic matching
  const semanticResults = await semanticScholarClient.searchPapers(query, limit)

  // Merge and deduplicate results
  const mergedResults = mergeResults(openAlexResults, semanticResults)

  // Apply semantic similarity scoring
  const scoredResults = await scoreResults(mergedResults, query)

  return {
    papers: scoredResults.slice(0, limit),
    totalFound: scoredResults.length
  }
}
```

**Tasks:**
- [ ] Implement OpenAlex client
- [ ] Implement Semantic Scholar client
- [ ] Add unified search interface
- [ ] Update semantic-search-papers tool
- [ ] Update visualize-citation-network tool
- [ ] Update analyze-research-trends tool
- [ ] Add comprehensive error handling
- [ ] Implement fallback mechanisms
- [ ] Write unit tests (30+ tests)
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Update documentation

**Deliverable:** Working multi-API citation system  
**Success Metric:** 98%+ search success rate  
**Estimated Effort:** 5-6 days  

### Week 4: PDF Processing with GROBID

#### Sprint 13.4: PDF Metadata Extraction

**GROBID Client:**
```typescript
// lib/pdf/grobid-client.ts

export interface GrobidMetadata {
  title: string
  authors: Array<{
    firstName: string
    lastName: string
    affiliation?: string
  }>
  abstract: string
  citations: Array<{
    title: string
    authors: string[]
    year?: number
    doi?: string
    raw: string
  }>
  date: string
  journal?: string
  doi?: string
}

export class GrobidClient {
  private baseUrl = process.env.GROBID_URL || 'http://localhost:8070/api'

  /**
   * Process PDF and extract metadata
   */
  async processFulltext(pdfBuffer: Buffer): Promise<GrobidMetadata | null> {
    const formData = new FormData()
    formData.append('input', new Blob([pdfBuffer]), 'document.pdf')

    try {
      const response = await fetch(`${this.baseUrl}/processFulltextDocument`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`GROBID error: ${response.status}`)
      }

      const teiXml = await response.text()
      return this.parseTEI(teiXml)
    } catch (error) {
      console.error('GROBID processing error:', error)
      return null
    }
  }

  /**
   * Parse TEI XML to structured metadata
   */
  private parseTEI(teiXml: string): GrobidMetadata {
    // Parse XML using DOMParser or xml2js
    // Extract title, authors, abstract, citations
    // Return structured metadata
    
    // Implementation details...
    return {
      title: '',
      authors: [],
      abstract: '',
      citations: [],
      date: ''
    }
  }

  /**
   * Extract citations only
   */
  async processCitations(pdfBuffer: Buffer) {
    const formData = new FormData()
    formData.append('input', new Blob([pdfBuffer]), 'document.pdf')

    const response = await fetch(`${this.baseUrl}/processCitations`, {
      method: 'POST',
      body: formData
    })

    const teiXml = await response.text()
    return this.parseCitations(teiXml)
  }

  private parseCitations(teiXml: string) {
    // Parse citations from TEI XML
    return []
  }
}

export const grobidClient = new GrobidClient()
```

**PDF Upload API:**
```typescript
// app/api/pdf/upload/route.ts

import { grobidClient } from '@/lib/pdf/grobid-client'
import { crossrefClient } from '@/lib/citations/crossref-client'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // Convert to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Process with GROBID
  const metadata = await grobidClient.processFulltext(buffer)

  if (!metadata) {
    return Response.json({ error: 'PDF processing failed' }, { status: 500 })
  }

  // Enrich citations with Crossref data
  const enrichedCitations = await Promise.all(
    metadata.citations.map(async (citation) => {
      if (citation.doi) {
        const crossrefData = await crossrefClient.resolveDOI(citation.doi)
        return { ...citation, crossrefData }
      }
      return citation
    })
  )

  // Save to database
  const savedReference = await prisma.reference.create({
    data: {
      userId: 'current-user-id', // Get from session
      title: metadata.title,
      authors: JSON.stringify(metadata.authors),
      year: parseInt(metadata.date),
      doi: metadata.doi,
      metadata: JSON.stringify(metadata)
    }
  })

  return Response.json({
    success: true,
    reference: savedReference,
    citations: enrichedCitations
  })
}
```

**Tasks:**
- [ ] Implement GROBID client
- [ ] Create PDF upload endpoint
- [ ] Parse TEI XML to structured data
- [ ] Integrate with citation APIs
- [ ] Add PDF text extraction
- [ ] Implement page number tracking
- [ ] Add highlight extraction
- [ ] Create UI for PDF upload
- [ ] Write unit tests (15+ tests)
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Update documentation

**Deliverable:** Working PDF processing pipeline  
**Success Metric:** 90%+ accurate metadata extraction  
**Estimated Effort:** 5-6 days  

### Week 5: Grammar API & Caching Layer

#### Sprint 13.5: Content Enhancement

**LanguageTool Integration:**
```typescript
// lib/grammar/languagetool-client.ts

export interface GrammarIssue {
  message: string
  shortMessage: string
  offset: number
  length: number
  category: string
  ruleId: string
  replacements: string[]
  context: string
  severity: 'error' | 'warning' | 'info'
}

export class LanguageToolClient {
  private baseUrl = process.env.LANGUAGETOOL_URL || 'http://localhost:8081/v2'

  async check(text: string, language = 'en-US'): Promise<GrammarIssue[]> {
    const formData = new URLSearchParams()
    formData.append('text', text)
    formData.append('language', language)

    const response = await fetch(`${this.baseUrl}/check`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    return data.matches.map((match: any) => ({
      message: match.message,
      shortMessage: match.shortMessage,
      offset: match.offset,
      length: match.length,
      category: match.rule.category.name,
      ruleId: match.rule.id,
      replacements: match.replacements.map((r: any) => r.value),
      context: match.context.text,
      severity: this.getSeverity(match.rule.category.id)
    }))
  }

  private getSeverity(categoryId: string): 'error' | 'warning' | 'info' {
    if (categoryId.includes('GRAMMAR') || categoryId.includes('TYPOS')) {
      return 'error'
    }
    if (categoryId.includes('STYLE')) {
      return 'warning'
    }
    return 'info'
  }
}

export const languageToolClient = new LanguageToolClient()
```

**Update grammar-checker tool:**
```typescript
// lib/grammar-checker.ts

import { languageToolClient } from '@/lib/grammar/languagetool-client'

export async function checkGrammar(text: string) {
  const issues = await languageToolClient.check(text)

  return {
    issues,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
    score: calculateGrammarScore(issues, text.length)
  }
}

function calculateGrammarScore(issues: GrammarIssue[], textLength: number) {
  const errorWeight = 5
  const warningWeight = 2
  
  const errorPoints = issues.filter(i => i.severity === 'error').length * errorWeight
  const warningPoints = issues.filter(i => i.severity === 'warning').length * warningWeight
  
  const totalPoints = errorPoints + warningPoints
  const maxPoints = textLength / 100 * 10 // Expect max 1 issue per 100 chars
  
  return Math.max(0, 100 - (totalPoints / maxPoints * 100))
}
```

**Redis Caching Layer:**
```typescript
// lib/cache/redis-cache.ts

import Redis from 'ioredis'

export class RedisCache {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }

  async set(key: string, value: any, ttlSeconds = 3600) {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
  }

  async delete(key: string) {
    await this.redis.del(key)
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1
  }

  async clear(pattern: string) {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

export const redisCache = new RedisCache()
```

**API Response Caching:**
```typescript
// lib/cache/api-cache.ts

import { redisCache } from './redis-cache'

export async function cachedCrossrefLookup(doi: string) {
  const cacheKey = `crossref:doi:${doi}`
  
  // Check cache
  const cached = await redisCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API
  const result = await crossrefClient.resolveDOI(doi)

  // Cache for 7 days (citations don't change often)
  if (result) {
    await redisCache.set(cacheKey, result, 7 * 24 * 3600)
  }

  return result
}

export async function cachedOpenAlexSearch(query: string) {
  const cacheKey = `openalex:search:${query}`
  
  const cached = await redisCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const result = await openAlexClient.searchWorks(query)

  // Cache search results for 1 hour
  await redisCache.set(cacheKey, result, 3600)

  return result
}
```

**Tasks:**
- [ ] Implement LanguageTool client
- [ ] Update grammar-checker tool
- [ ] Implement Redis caching
- [ ] Add cache middleware for APIs
- [ ] Cache Crossref lookups (7 days)
- [ ] Cache OpenAlex searches (1 hour)
- [ ] Cache GROBID results (permanent)
- [ ] Add cache invalidation logic
- [ ] Write unit tests (20+ tests)
- [ ] Performance testing
- [ ] Update documentation

**Deliverable:** Grammar checking and caching  
**Success Metric:** 95%+ cache hit rate for citations  
**Estimated Effort:** 4-5 days  

### Week 6: Integration & Testing

#### Sprint 13.6: End-to-End Integration

**Integration Testing:**
```typescript
// tests/integration/citation-workflow.test.ts

describe('Citation Workflow Integration', () => {
  it('should find sources via Crossref', async () => {
    const sources = await findSourcesTool({
      query: 'machine learning',
      count: 10
    })

    expect(sources.count).toBeGreaterThan(0)
    expect(sources.sources[0]).toHaveProperty('doi')
  })

  it('should process PDF and extract citations', async () => {
    const pdfBuffer = await fs.readFile('test/sample.pdf')
    const metadata = await grobidClient.processFulltext(pdfBuffer)

    expect(metadata).toBeDefined()
    expect(metadata.title).toBeTruthy()
    expect(metadata.citations.length).toBeGreaterThan(0)
  })

  it('should verify citations with Crossref', async () => {
    const citations = await verifyCitations({
      documentId: 'test-doc',
      citations: [
        { doi: '10.1000/test.doi', text: 'Test citation' }
      ]
    })

    expect(citations[0].verified).toBe(true)
  })

  it('should cache API responses', async () => {
    const doi = '10.1000/test.doi'
    
    // First call - should hit API
    const start1 = Date.now()
    await cachedCrossrefLookup(doi)
    const time1 = Date.now() - start1

    // Second call - should hit cache
    const start2 = Date.now()
    await cachedCrossrefLookup(doi)
    const time2 = Date.now() - start2

    expect(time2).toBeLessThan(time1 / 10) // 10x faster from cache
  })
})
```

**Performance Testing:**
```typescript
// tests/performance/api-performance.test.ts

describe('API Performance', () => {
  it('should handle 100 concurrent DOI lookups', async () => {
    const dois = Array.from({ length: 100 }, (_, i) => `10.1000/test.${i}`)

    const start = Date.now()
    await Promise.all(dois.map(doi => cachedCrossrefLookup(doi)))
    const time = Date.now() - start

    expect(time).toBeLessThan(5000) // Should complete in 5 seconds
  })

  it('should process PDF in under 10 seconds', async () => {
    const pdfBuffer = await fs.readFile('test/sample.pdf')

    const start = Date.now()
    await grobidClient.processFulltext(pdfBuffer)
    const time = Date.now() - start

    expect(time).toBeLessThan(10000)
  })
})
```

**Documentation Updates:**
```markdown
# API Integration Guide

## Crossref API

Setup:
1. Register at https://www.crossref.org/
2. Add email to .env: CROSSREF_EMAIL=your@email.com
3. Test with: npm run test:crossref

Usage:
```typescript
import { crossrefClient } from '@/lib/citations/crossref-client'

// Resolve DOI
const work = await crossrefClient.resolveDOI('10.1000/test.doi')

// Search
const results = await crossrefClient.search('machine learning', 20)
```

## OpenAlex API

Setup:
1. No API key required
2. Add email to .env: OPENALEX_EMAIL=your@email.com
3. Test with: npm run test:openalex

## GROBID

Setup:
1. Start with: docker-compose up grobid
2. Verify: curl http://localhost:8070/api/isalive
3. Test with: npm run test:grobid
```

**Tasks:**
- [ ] Write integration tests (30+ tests)
- [ ] Write performance tests (10+ tests)
- [ ] Load testing (simulate 100 users)
- [ ] Cache performance validation
- [ ] API rate limit testing
- [ ] Error handling verification
- [ ] Update all documentation
- [ ] Create setup guide
- [ ] Create troubleshooting guide
- [ ] Create API reference docs

**Deliverable:** Fully integrated and tested system  
**Success Metric:** All 250+ tests passing, 95%+ cache hit rate  
**Estimated Effort:** 5-6 days  

### Phase 13 Summary

**Total Duration:** 6 weeks  
**Total Deliverables:**
- ✅ 100% test pass rate (201/201 tests)
- ✅ Real Crossref API integration
- ✅ Real OpenAlex API integration
- ✅ Real Semantic Scholar API integration
- ✅ GROBID PDF processing
- ✅ LanguageTool grammar checking
- ✅ Redis caching layer
- ✅ 250+ total tests passing
- ✅ Comprehensive documentation

**Success Criteria:**
- [x] All tests passing
- [x] 95%+ citation resolution rate
- [x] 90%+ PDF metadata extraction accuracy
- [x] 95%+ cache hit rate
- [x] <2s average API response time
- [x] All documentation updated

---

## Phase 14: Compliance & Quality

**Duration:** 6 weeks  
**Goal:** FERPA compliance, production readiness  
**Priority:** CRITICAL for institutional deployment  

*(Continued in separate sections below)*

### Week 7-8: FERPA Compliance Implementation

#### Sprint 14.1: Legal & Security Compliance

**FERPA Requirements Analysis:**

1. **Data Protection**
   - Encryption at rest (database level)
   - Encryption in transit (HTTPS only)
   - Secure data storage
   - Access controls

2. **Student Rights**
   - Right to access data
   - Right to correct data
   - Right to delete data
   - Right to export data

3. **Institutional Controls**
   - Admin oversight
   - Audit logging
   - Data retention policies
   - Breach notification

4. **Consent Management**
   - Explicit consent for data collection
   - Consent for third-party integrations
   - Consent withdrawal

**Implementation Tasks:**

```typescript
// lib/compliance/ferpa.ts

export class FERPACompliance {
  /**
   * Export all student data (FERPA requirement)
   */
  async exportStudentData(userId: string): Promise<StudentDataExport> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const documents = await prisma.document.findMany({ where: { userId } })
    const references = await prisma.reference.findMany({ where: { userId } })
    const citations = await prisma.citation.findMany({ where: { userId } })
    const auditLogs = await prisma.auditLog.findMany({ where: { userId } })

    return {
      user,
      documents,
      references,
      citations,
      auditLogs,
      exportDate: new Date(),
      format: 'JSON'
    }
  }

  /**
   * Delete all student data (right to be forgotten)
   */
  async deleteStudentData(userId: string, reason: string): Promise<void> {
    // Log deletion request
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DATA_DELETION_REQUEST',
        details: JSON.stringify({ reason }),
        severity: 'CRITICAL'
      }
    })

    // Export data before deletion (backup)
    const backup = await this.exportStudentData(userId)
    await this.archiveData(backup)

    // Delete all user data (cascade will handle relations)
    await prisma.user.delete({ where: { id: userId } })

    // Log completion
    await prisma.auditLog.create({
      data: {
        action: 'DATA_DELETION_COMPLETE',
        resource: 'user',
        resourceId: userId,
        details: JSON.stringify({ reason }),
        severity: 'CRITICAL'
      }
    })
  }

  /**
   * Check for data breaches
   */
  async checkDataBreach(userId: string): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: {
          in: ['UNAUTHORIZED_ACCESS', 'FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    // Analyze patterns for potential breach
    return this.analyzeBreachPatterns(logs)
  }

  private async archiveData(data: StudentDataExport): Promise<void> {
    // Store in secure, encrypted archive
  }

  private analyzeBreachPatterns(logs: AuditLog[]): boolean {
    // Implement breach detection logic
    return false
  }
}
```

**Database Encryption:**

```typescript
// prisma/encryption.ts

import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // 32-byte key
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted,
    authTag: authTag.toString('hex')
  })
}

export function decrypt(encryptedData: string): string {
  const { iv, data, authTag } = JSON.parse(encryptedData)
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Update Prisma middleware to auto-encrypt sensitive fields
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'create') {
    if (params.args.data.email) {
      params.args.data.email = encrypt(params.args.data.email)
    }
  }

  if (params.model === 'User' && params.action === 'findUnique') {
    const result = await next(params)
    if (result && result.email) {
      result.email = decrypt(result.email)
    }
    return result
  }

  return next(params)
})
```

**Tasks Week 7-8:**
- [ ] Legal consultation with FERPA expert
- [ ] Document compliance requirements
- [ ] Implement data encryption at rest
- [ ] Implement data export functionality
- [ ] Implement data deletion functionality
- [ ] Add consent management system
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Implement breach detection
- [ ] Create compliance audit checklist
- [ ] Write compliance tests (20+ tests)
- [ ] Third-party compliance audit
- [ ] Update documentation

**Deliverable:** FERPA-compliant platform  
**Success Metric:** Pass third-party compliance audit  
**Estimated Effort:** 2 weeks  

### Week 9-10: Advanced Statistics & Database Migration

*(Details for remaining Phase 14 sprints...)*

---

## Phase 15: Advanced Features & Production Launch

**Duration:** 8 weeks  
**Goal:** Real-time collaboration, production deployment  

*(Complete implementation details...)*

---

## Resource Requirements Summary

### Engineering Team (6 months)

**Phase 13 (Weeks 1-6):**
- 1 Backend Engineer (APIs, PDF)
- 1 Frontend Engineer (UI integration)
- 0.5 DevOps Engineer (infrastructure)
- 0.5 QA Engineer (testing)

**Phase 14 (Weeks 7-12):**
- 1 Backend Engineer (compliance, database)
- 0.5 Frontend Engineer (UI updates)
- 0.5 DevOps Engineer (PostgreSQL migration)
- 0.5 QA Engineer (testing)
- 0.25 Legal Consultant (FERPA)

**Phase 15 (Weeks 13-24):**
- 1.5 Backend Engineers (collaboration, WebSocket)
- 1 Frontend Engineer (real-time UI)
- 1 DevOps Engineer (production deployment)
- 0.5 QA Engineer (production testing)

### Infrastructure Costs (6 months)

**Development/Staging:**
- PostgreSQL (AWS RDS): $100/month
- Redis (AWS ElastiCache): $50/month
- Docker hosting (GROBID, LanguageTool): $50/month
- **Subtotal:** $200/month

**Production (from Month 4):**
- PostgreSQL (production): $300/month
- Redis (production): $100/month
- Load balancers: $100/month
- CDN (Cloudflare): $50/month
- Monitoring (Sentry, DataDog): $100/month
- **Subtotal:** $650/month

**API Costs:**
- Crossref: Free
- OpenAlex: Free
- Semantic Scholar: Free
- LanguageTool (self-hosted): $0
- **Subtotal:** $0/month

**Total 6-Month Infrastructure Cost:**
- Months 1-3: $200/month × 3 = $600
- Months 4-6: $850/month × 3 = $2,550
- **Total:** $3,150

### Timeline & Milestones

```
Month 1-2 (Phase 13 Part 1):
├── Week 1: Test fixes, API setup
├── Week 2: Crossref integration
├── Week 3: OpenAlex & Semantic Scholar
└── Week 4: PDF processing
    └── Milestone: Core APIs functional

Month 2-3 (Phase 13 Part 2):
├── Week 5: Grammar API, caching
├── Week 6: Integration & testing
└── Milestone: Phase 13 complete
    └── Deliverable: Real citation system

Month 3-4 (Phase 14):
├── Week 7-8: FERPA compliance
├── Week 9-10: Statistics, database migration
├── Week 11-12: Testing, quality
└── Milestone: Production-ready platform
    └── Deliverable: FERPA-compliant system

Month 5-6 (Phase 15):
├── Week 13-16: Real-time collaboration
├── Week 17-20: Reference manager sync
├── Week 21-22: Production deployment
├── Week 23-24: Pilot program launch
└── Milestone: 100% completion
    └── Deliverable: Live production system
```

---

## Success Criteria & KPIs

### Phase 13 Success Criteria
- [ ] 100% test pass rate (250+ tests)
- [ ] 95%+ citation resolution success rate
- [ ] 90%+ PDF metadata extraction accuracy
- [ ] 95%+ cache hit rate for API responses
- [ ] <2s average API response time
- [ ] <10s PDF processing time
- [ ] 0 critical security vulnerabilities
- [ ] All documentation updated

### Phase 14 Success Criteria
- [ ] Pass FERPA compliance audit
- [ ] 100% data encryption coverage
- [ ] Data export in <30 seconds
- [ ] Data deletion in <1 minute
- [ ] 80%+ test coverage
- [ ] PostgreSQL migration complete
- [ ] All statistics functions implemented
- [ ] Linting issues reduced to <50

### Phase 15 Success Criteria
- [ ] Real-time collaboration functional
- [ ] <100ms collaboration latency
- [ ] Zotero sync working
- [ ] 99.9% uptime in production
- [ ] <2s page load time
- [ ] 5 pilot institutions onboarded
- [ ] 100+ active users
- [ ] 90%+ user satisfaction (NPS > 50)

---

## Risk Mitigation Strategies

### Technical Risks

**Risk:** API rate limit exceeded
- **Mitigation:** Aggressive caching, rate limiting on our side, monitor usage
- **Backup:** Multiple API providers, graceful degradation

**Risk:** GROBID processing too slow
- **Mitigation:** Scale horizontally with multiple instances, queue system
- **Backup:** Alternative PDF libraries, async processing

**Risk:** Database migration data loss
- **Mitigation:** Comprehensive backups, staging testing, rollback plan
- **Backup:** Keep SQLite as fallback for 1 month

### Business Risks

**Risk:** FERPA audit failure
- **Mitigation:** Early legal review, third-party pre-audit, iterative compliance
- **Backup:** Delay institutional launch, focus on individual users first

**Risk:** Low pilot institution interest
- **Mitigation:** Beta program, free pilot period, strong ROI messaging
- **Backup:** Focus on individual student market first

---

## Conclusion

This detailed development plan provides a clear path from 78% to 100% completion over 6 months. The plan is aggressive but achievable with the right resources and focus. Key priorities are:

1. **Phase 13:** Real API integrations (game-changer for citations)
2. **Phase 14:** FERPA compliance (unlock institutional market)
3. **Phase 15:** Real-time collaboration (competitive advantage)

By following this plan, Vibe University will be production-ready for institutional deployment by May 2026.

---

**Document Owner:** Engineering Leadership  
**Last Updated:** November 15, 2025  
**Next Review:** Start of Phase 13  
**Status:** APPROVED FOR EXECUTION
