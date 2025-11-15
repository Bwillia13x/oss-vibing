# Phase 13: Real API Integrations - Implementation Guide

**Status:** ✅ Core Implementation Complete  
**Date:** November 15, 2025  
**Version:** 1.0.0

## Overview

Phase 13 implements real API integrations for academic citation management, PDF processing, and caching infrastructure. This phase replaces mock data with production-ready integrations to Crossref, OpenAlex, Semantic Scholar, and GROBID.

## Implemented Features

### 1. Citation APIs

#### Crossref API Client (`lib/citations/crossref-client.ts`)
- **DOI Resolution**: Resolve DOIs to full citation metadata
- **Search**: Full-text search across millions of scholarly works
- **Author Search**: Find works by specific authors
- **CSL-JSON Conversion**: Convert to standard citation format
- **Features**:
  - Polite pool with email identification
  - In-memory caching
  - Rate limit compliance (50 req/sec)
  - Error handling with graceful degradation

**Example Usage:**
```typescript
import { crossrefClient } from '@/lib/citations/crossref-client'

// Resolve a DOI
const work = await crossrefClient.resolveDOI('10.1038/nature12373')
console.log(work.title[0]) // "Global biodiversity..."

// Search for papers
const results = await crossrefClient.search('climate change', 20)

// Convert to CSL-JSON
const csl = crossrefClient.toCSL(work)
```

#### OpenAlex API Client (`lib/citations/openalex-client.ts`)
- **Work Search**: Search across 200M+ scholarly works
- **Author Search**: Find papers by author name
- **Citation Analysis**: Get citing and related works
- **Open Access Filtering**: Filter for open access papers
- **Features**:
  - No API key required
  - 100,000 requests/day rate limit
  - Abstract reconstruction from inverted index
  - Comprehensive metadata including concepts and topics

**Example Usage:**
```typescript
import { openAlexClient } from '@/lib/citations/openalex-client'

// Search for works
const works = await openAlexClient.searchWorks('machine learning', {
  limit: 10,
  yearRange: { start: 2020, end: 2024 },
  openAccessOnly: true
})

// Get a specific work
const work = await openAlexClient.getWork('W2741809807')

// Get citing works
const citations = await openAlexClient.getCitingWorks('W2741809807', 50)
```

#### Semantic Scholar API Client (`lib/citations/semantic-scholar-client.ts`)
- **Paper Search**: AI-powered semantic search
- **Citation/Reference Analysis**: Get citations and references
- **Recommendations**: Get paper recommendations
- **Author Information**: Fetch author h-index and statistics
- **Features**:
  - Optional API key for higher rate limits
  - TL;DR summaries
  - Influential citation counts
  - Open access PDF links

**Example Usage:**
```typescript
import { semanticScholarClient } from '@/lib/citations/semantic-scholar-client'

// Search for papers
const papers = await semanticScholarClient.searchPapers('neural networks', {
  limit: 10,
  yearRange: { start: 2020, end: 2024 }
})

// Get paper by DOI
const paper = await semanticScholarClient.getPaper('DOI:10.1038/nature12373')

// Get recommendations
const recs = await semanticScholarClient.getRecommendations(paper.paperId, {
  limit: 10
})
```

### 2. PDF Processing

#### GROBID Client (`lib/pdf/grobid-client.ts`)
- **Full-text Processing**: Extract complete metadata and citations
- **Header Processing**: Fast metadata extraction from PDF headers
- **Citation Extraction**: Extract bibliographic references
- **TEI XML Parsing**: Parse structured TEI XML output
- **Features**:
  - Docker-based deployment
  - Health check monitoring
  - Comprehensive metadata extraction
  - Citation enrichment support

**Example Usage:**
```typescript
import { grobidClient } from '@/lib/pdf/grobid-client'
import fs from 'fs/promises'

// Check if GROBID is running
const isAlive = await grobidClient.isAlive()

// Process PDF
const pdfBuffer = await fs.readFile('paper.pdf')
const metadata = await grobidClient.processFulltext(pdfBuffer)

console.log(`Title: ${metadata.title}`)
console.log(`Authors: ${metadata.authors.length}`)
console.log(`Citations: ${metadata.citations.length}`)

// Process header only (faster)
const headerMetadata = await grobidClient.processHeader(pdfBuffer)
```

**PDF Upload API (`app/api/pdf/upload/route.ts`)**
```bash
# Upload a PDF for processing
curl -X POST http://localhost:3000/api/pdf/upload \
  -F "file=@paper.pdf"

# Response includes:
# - Extracted metadata (title, authors, abstract, DOI)
# - Extracted citations
# - Citations enriched with Crossref data
# - Processing statistics
```

### 3. Caching Infrastructure

#### Redis Cache Client (`lib/cache/redis-cache.ts`)
- **Redis Integration**: Production-ready caching with Redis
- **Fallback Cache**: In-memory cache when Redis unavailable
- **TTL Support**: Configurable expiration times
- **Pattern-based Invalidation**: Clear cache by pattern
- **Features**:
  - Automatic reconnection
  - Statistics tracking (hit rate, cache size)
  - JSON serialization
  - Error resilience

**Example Usage:**
```typescript
import { redisCache } from '@/lib/cache/redis-cache'

// Set value with 1-hour TTL
await redisCache.set('key', { data: 'value' }, 3600)

// Get value
const value = await redisCache.get('key')

// Check cache statistics
const stats = redisCache.getStats()
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`)

// Clear by pattern
await redisCache.clear('crossref:*')
```

#### Cached API Wrappers (`lib/cache/api-cache.ts`)
Pre-configured caching for all API calls:

```typescript
import {
  cachedCrossrefLookup,
  cachedCrossrefSearch,
  cachedOpenAlexSearch,
  cachedSemanticScholarSearch,
} from '@/lib/cache/api-cache'

// All API calls are automatically cached
const work = await cachedCrossrefLookup('10.1038/nature12373') // 7-day cache
const results = await cachedCrossrefSearch('climate change') // 1-hour cache
```

**Cache TTL Configuration:**
- Crossref DOI: 7 days (metadata rarely changes)
- Crossref Search: 1 hour (results update frequently)
- OpenAlex Work: 7 days
- OpenAlex Search: 1 hour
- Semantic Scholar Paper: 7 days
- Semantic Scholar Search: 2 hours

### 4. Unified Search API

**Unified Citation Search (`app/api/citations/search/route.ts`)**

Search across all citation APIs with a single endpoint:

```bash
# Search all providers
curl "http://localhost:3000/api/citations/search?query=machine%20learning&limit=10"

# Search specific provider
curl "http://localhost:3000/api/citations/search?query=neural%20networks&provider=crossref"

# Filter by year range
curl "http://localhost:3000/api/citations/search?query=AI&yearStart=2020&yearEnd=2024"

# Open access only
curl "http://localhost:3000/api/citations/search?query=climate&openAccessOnly=true"
```

**Response Format:**
```json
{
  "query": "machine learning",
  "total": 20,
  "providers": ["Crossref", "OpenAlex", "SemanticScholar"],
  "results": [
    {
      "id": "10.1234/example",
      "doi": "10.1234/example",
      "title": "Example Paper Title",
      "authors": ["Author One", "Author Two"],
      "year": 2023,
      "journal": "Nature",
      "citationCount": 150,
      "isOpenAccess": true,
      "source": "OpenAlex"
    }
  ],
  "cached": true
}
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# API Configuration
CROSSREF_EMAIL=your@email.edu
OPENALEX_EMAIL=your@email.edu
SEMANTIC_SCHOLAR_API_KEY=your_api_key  # Optional

# GROBID Service
GROBID_URL=http://localhost:8070/api

# Redis Cache (Optional)
REDIS_URL=redis://localhost:6379
```

### 2. Start Docker Services

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d grobid redis

# Check service health
docker-compose ps
```

**Services:**
- **GROBID**: PDF processing (port 8070)
- **Redis**: Caching layer (port 6379)
- **LanguageTool**: Grammar checking (port 8081) - Optional

### 3. Verify Setup

```bash
# Check GROBID health
curl http://localhost:8070/api/isalive

# Check Redis
docker exec vibe-redis redis-cli ping

# Check API endpoint
curl "http://localhost:3000/api/citations/search?query=test"
```

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test lib/citations/crossref-client.test.ts

# Run with coverage
npm run test:coverage
```

### Integration Tests

Test real API endpoints (requires internet connection):

```typescript
// Test Crossref
const work = await crossrefClient.resolveDOI('10.1038/nature12373')
expect(work).toBeDefined()
expect(work.DOI).toBe('10.1038/nature12373')

// Test OpenAlex
const works = await openAlexClient.searchWorks('test', { limit: 5 })
expect(works.length).toBeGreaterThan(0)

// Test Semantic Scholar
const papers = await semanticScholarClient.searchPapers('test', { limit: 5 })
expect(papers.length).toBeGreaterThan(0)
```

### Manual Testing

```bash
# Test PDF upload
curl -X POST http://localhost:3000/api/pdf/upload \
  -F "file=@test.pdf" | jq

# Test citation search
curl "http://localhost:3000/api/citations/search?query=machine%20learning&limit=5" | jq

# Check cache stats
# (Add endpoint or check Redis directly)
docker exec vibe-redis redis-cli INFO stats
```

## Performance Metrics

**Expected Performance:**
- DOI resolution: < 500ms (first call), < 10ms (cached)
- Search queries: < 1s (first call), < 50ms (cached)
- PDF processing: < 10s for typical paper (5-20 pages)
- Cache hit rate: > 95% for production workloads

**Rate Limits:**
- Crossref: 50 requests/second (polite pool)
- OpenAlex: 100,000 requests/day
- Semantic Scholar: 100 requests/second (with key), 1/second (without)
- GROBID: Limited by hardware (typically 1-2 PDFs/second)

## Troubleshooting

### GROBID Not Responding

```bash
# Check if GROBID is running
docker-compose ps grobid

# View GROBID logs
docker-compose logs grobid

# Restart GROBID
docker-compose restart grobid

# Check health endpoint
curl http://localhost:8070/api/isalive
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# Test connection
docker exec vibe-redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

### API Rate Limits

- **Crossref**: Use polite pool (set CROSSREF_EMAIL)
- **Semantic Scholar**: Get API key for higher limits
- **OpenAlex**: Monitor daily usage (100k/day limit)

### Cache Issues

```bash
# Clear all caches
docker exec vibe-redis redis-cli FLUSHALL

# Clear specific pattern
docker exec vibe-redis redis-cli KEYS "crossref:*" | xargs docker exec vibe-redis redis-cli DEL
```

## Next Steps

### Immediate (Phase 13.2)
- [ ] Add comprehensive unit tests for all clients
- [ ] Add integration tests
- [ ] Performance benchmarking
- [ ] Update AI tools to use new APIs

### Short-term (Phase 13.3-13.6)
- [ ] Implement LanguageTool grammar checking
- [ ] Add batch processing for PDFs
- [ ] Implement citation network visualization
- [ ] Add analytics dashboard for API usage

### Long-term (Phase 14+)
- [ ] PostgreSQL migration
- [ ] FERPA compliance implementation
- [ ] Real-time collaboration features
- [ ] Production deployment

## API Documentation

Full API documentation available at:
- Crossref: https://www.crossref.org/documentation/
- OpenAlex: https://docs.openalex.org/
- Semantic Scholar: https://api.semanticscholar.org/
- GROBID: https://grobid.readthedocs.io/

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation
3. Check Docker logs
4. File an issue in the repository

## License

MIT License - See LICENSE file for details
