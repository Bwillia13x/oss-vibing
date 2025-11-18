# Phase 5: Production Readiness & Core Integrations

**Date:** November 13, 2025  
**Status:** 🚀 Starting  
**Version:** 5.0.0  
**Timeline:** 3-4 Months

---

## Executive Summary

Phase 5 represents a strategic shift toward **production readiness** and **core functionality completion**. With Phases 1-4 having established the foundation and advanced features, Phase 5 focuses on completing critical missing pieces from Phase 1 that are essential for a production-ready academic platform.

**Strategic Goals:**
1. Complete critical Phase 1 infrastructure (API integrations, statistics, exports)
2. Establish comprehensive testing and quality assurance
3. Implement production monitoring and observability
4. Ensure security and compliance readiness
5. Complete documentation for users and developers

**Why Now?**
- Phase 4 advanced features require robust Phase 1 foundation
- Production deployment requires completed core features
- Institutional adoption needs complete export and citation systems
- Academic integrity depends on real API integrations

---

## Phase 5 Objectives

### Primary Goals
1. ✅ **Academic API Integration** - Connect to real citation databases
2. ✅ **Statistical Analysis** - Implement real statistics engine
3. ✅ **Export System** - Complete PDF/DOCX/PPTX/XLSX export
4. ✅ **Citation Management** - Full APA/MLA/Chicago formatting
5. ✅ **Testing Infrastructure** - 80%+ test coverage
6. ✅ **Production Monitoring** - Error tracking and performance monitoring

### Success Metrics
- [ ] 95%+ citation resolution rate from real APIs
- [ ] Statistical accuracy matching R/Python outputs
- [ ] 95%+ format preservation in exports
- [ ] 80%+ automated test coverage
- [ ] <2s average API response time
- [ ] Zero critical security vulnerabilities

---

## 5.1 Academic API Integration (Priority: 🔴 Critical)

**Goal:** Replace stub implementations with real academic database APIs

### 5.1.1 Citation Database APIs

**Crossref API Integration**
- **Purpose:** DOI resolution and citation metadata
- **Features:**
  - DOI lookup and validation
  - Citation metadata retrieval
  - Author information
  - Journal details
  - Publication dates
  - Abstract and keywords
- **Implementation:**
  - Create `/lib/api/crossref.ts` client
  - Add rate limiting (50 req/sec free tier)
  - Implement caching strategy
  - Add fallback error handling
- **API Endpoint:** https://api.crossref.org
- **Documentation:** https://www.crossref.org/documentation/retrieve-metadata/rest-api/

**OpenAlex API Integration**
- **Purpose:** Comprehensive academic literature search
- **Features:**
  - Paper search by title, author, topic
  - Citation count tracking
  - Author profiles and h-index
  - Institution affiliations
  - Concept tagging
  - Related work recommendations
- **Implementation:**
  - Create `/lib/api/openalex.ts` client
  - Support advanced query syntax
  - Implement pagination (max 200 results per page)
  - Add result filtering and sorting
- **API Endpoint:** https://api.openalex.org
- **Documentation:** https://docs.openalex.org

**Semantic Scholar API Integration**
- **Purpose:** Citation networks and paper relationships
- **Features:**
  - Citation graph data
  - Influential citations
  - Paper recommendations
  - Author networks
  - Research field classification
  - Abstract embeddings
- **Implementation:**
  - Create `/lib/api/semantic-scholar.ts` client
  - Rate limiting (100 req/5min with API key)
  - Citation network visualization support
  - Batch paper lookup
- **API Endpoint:** https://api.semanticscholar.org
- **Documentation:** https://api.semanticscholar.org/api-docs/

**Unpaywall API Integration**
- **Purpose:** Open access PDF discovery
- **Features:**
  - Open access PDF location
  - License information
  - Green/Gold OA detection
  - Repository links
- **Implementation:**
  - Create `/lib/api/unpaywall.ts` client
  - Email-based rate limiting
  - PDF download capability
  - License validation
- **API Endpoint:** https://api.unpaywall.org
- **Documentation:** https://unpaywall.org/products/api

**API Aggregation Layer**
- **Purpose:** Unified interface for all citation APIs
- **Features:**
  - Automatic provider selection
  - Failover between providers
  - Response caching (Redis in production)
  - Request deduplication
  - Performance tracking
- **Implementation:**
  - Create `/lib/citation-api-client.ts`
  - Implement provider strategy pattern
  - Add circuit breaker for failing APIs
  - Cache responses in-memory (dev) and Redis (prod)

### 5.1.2 PDF Processing

**GROBID Integration**
- **Purpose:** Extract structured metadata from PDFs
- **Features:**
  - Author extraction
  - Title and abstract
  - References and citations
  - Section structure
  - Table and figure detection
- **Implementation:**
  - Deploy GROBID service (Docker)
  - Create `/lib/pdf/grobid-client.ts`
  - Handle PDF upload and processing
  - Parse GROBID XML output
- **Setup:** Docker container or hosted service
- **Documentation:** https://grobid.readthedocs.io

**PDF.js Integration**
- **Purpose:** Client-side PDF text extraction
- **Features:**
  - Text extraction
  - Page rendering
  - Annotation support
  - Search functionality
- **Implementation:**
  - Install `pdfjs-dist` package
  - Create `/lib/pdf/pdf-parser.ts`
  - Support server-side and client-side parsing
  - Handle encrypted PDFs
- **Package:** `pdfjs-dist`
- **Documentation:** https://mozilla.github.io/pdf.js/

**PDF Citation Extraction**
- **Purpose:** Extract citations from PDF papers
- **Features:**
  - Reference section detection
  - Citation parsing
  - DOI extraction
  - Author and year parsing
- **Implementation:**
  - Combine GROBID + PDF.js
  - Regex patterns for citation formats
  - Confidence scoring
  - Manual review interface

**PDF Storage Strategy**
- **Purpose:** Efficient PDF storage and retrieval
- **Features:**
  - Local storage (development)
  - S3/R2 storage (production)
  - CDN distribution
  - Access control
- **Implementation:**
  - Create `/lib/storage/pdf-storage.ts`
  - Support multiple storage backends
  - Implement signed URLs
  - Add expiration policies

---

## 5.2 Statistical Analysis Engine (Priority: 🔴 Critical)

**Goal:** Replace stub statistics with production-ready analytics

### 5.2.1 Core Statistics Library

**simple-statistics.js Integration**
- **Features:**
  - Descriptive statistics (mean, median, mode, std dev, variance)
  - Correlation (Pearson, Spearman)
  - Linear regression (slope, intercept, R²)
  - t-tests (one-sample, two-sample, paired)
  - Chi-square tests
  - ANOVA (one-way)
  - Confidence intervals
  - Z-scores and percentiles
- **Implementation:**
  - Install `simple-statistics` package
  - Create `/lib/statistics/core.ts` wrapper
  - Add input validation
  - Handle edge cases (empty data, outliers)
- **Package:** `simple-statistics`
- **Documentation:** https://simplestatistics.org

**Statistical Functions**
```typescript
// Descriptive statistics
mean(data: number[]): number
median(data: number[]): number
mode(data: number[]): number
standardDeviation(data: number[]): number
variance(data: number[]): number
quantile(data: number[], p: number): number

// Correlation and regression
pearsonCorrelation(x: number[], y: number[]): number
spearmanRank(x: number[], y: number[]): number
linearRegression(data: [number, number][]): { m: number, b: number, r2: number }

// Hypothesis testing
tTest(sample1: number[], sample2: number[]): { t: number, p: number, df: number }
chiSquareTest(observed: number[], expected: number[]): { chi2: number, p: number }
anova(groups: number[][]): { F: number, p: number }

// Distribution
zScore(x: number, mean: number, std: number): number
percentile(data: number[], value: number): number
confidenceInterval(data: number[], confidence: number): [number, number]
```

**Statistical Reports**
- **Purpose:** Generate formatted statistical output
- **Features:**
  - Summary statistics tables
  - Hypothesis test results
  - Significance indicators
  - Effect sizes
  - Interpretation guidance
- **Implementation:**
  - Create `/lib/statistics/reports.ts`
  - Support multiple output formats (JSON, Markdown, HTML)
  - Include visualizations

### 5.2.2 Data Visualization

**Chart.js Integration**
- **Features:**
  - Line charts (time series, trends)
  - Bar charts (comparisons, distributions)
  - Scatter plots (correlations)
  - Pie charts (proportions)
  - Histograms (distributions)
  - Box plots (quartiles, outliers)
- **Implementation:**
  - Install `chart.js` and `react-chartjs-2`
  - Create chart components in `/components/charts/`
  - Support responsive design
  - Add export to PNG/SVG
- **Packages:** `chart.js`, `react-chartjs-2`

**Chart Components**
```typescript
// Line chart for time series
<LineChart data={data} options={options} />

// Bar chart for categories
<BarChart data={data} horizontal={true} />

// Scatter plot for correlation
<ScatterPlot xData={x} yData={y} showTrendline={true} />

// Histogram for distribution
<Histogram data={data} bins={20} />

// Box plot for quartiles
<BoxPlot data={data} showOutliers={true} />
```

**Chart Export**
- **Purpose:** Save charts as images
- **Features:**
  - PNG export (high resolution)
  - SVG export (vector graphics)
  - PDF embedding support
  - Clipboard copy
- **Implementation:**
  - Use Chart.js `toBase64Image()` method
  - Add download functionality
  - Support batch export

---

## 5.3 Citation Management System (Priority: 🔴 Critical)

**Goal:** Complete citation formatting and verification

### 5.3.1 Citation Formatting

**citation-js Integration**
- **Purpose:** Industry-standard citation formatting
- **Styles Supported:**
  - APA 7th edition (American Psychological Association)
  - MLA 9th edition (Modern Language Association)
  - Chicago 17th edition (Manual of Style)
  - IEEE (Institute of Electrical and Electronics Engineers)
  - Harvard (author-date system)
  - Vancouver (numbered system)
- **Implementation:**
  - Install `@citation-js/core` and style plugins
  - Create `/lib/citations/formatter.ts`
  - Support custom CSL styles
  - Cache formatted citations
- **Package:** `@citation-js/core`
- **Documentation:** https://citation.js.org

**Citation Builder**
```typescript
interface CitationInput {
  type: 'article' | 'book' | 'chapter' | 'website' | 'thesis'
  authors: { given: string, family: string }[]
  title: string
  year: number
  doi?: string
  url?: string
  publisher?: string
  journal?: string
  volume?: string
  pages?: string
  // ... other fields
}

function formatCitation(
  input: CitationInput,
  style: 'apa' | 'mla' | 'chicago',
  type: 'in-text' | 'bibliography'
): string
```

**In-Text Citation**
- **APA:** (Smith, 2023) or (Smith & Jones, 2023)
- **MLA:** (Smith 45) or (Smith and Jones 45)
- **Chicago:** (Smith 2023, 45) or superscript¹

**Bibliography Generation**
- **Purpose:** Auto-generate reference lists
- **Features:**
  - Alphabetical sorting
  - Hanging indent formatting
  - DOI/URL inclusion
  - Duplicate detection
  - Citation grouping
- **Implementation:**
  - Scan document for citations
  - Extract unique references
  - Sort and format
  - Insert at end of document

### 5.3.2 Citation Verification

**Citation Coverage Analyzer**
- **Purpose:** Ensure all claims are cited
- **Features:**
  - Identify factual claims
  - Check for supporting citations
  - Calculate coverage percentage
  - Highlight uncited claims
- **Implementation:**
  - NLP analysis for claims detection
  - Citation proximity checking
  - Severity scoring
  - Recommendation generation

**Quote-to-Source Verification**
- **Purpose:** Verify quotes match sources
- **Features:**
  - Extract quoted text
  - Look up source document
  - Compare quote accuracy
  - Check page numbers
- **Implementation:**
  - Parse quote syntax ("..." or '...')
  - Retrieve source from API or PDF
  - Fuzzy string matching
  - Report discrepancies

**Stale Citation Detection**
- **Purpose:** Find outdated or broken citations
- **Features:**
  - Check DOI/URL validity
  - Detect broken links
  - Identify retracted papers
  - Flag old sources (>10 years)
- **Implementation:**
  - HTTP requests to URLs
  - Crossref API for retractions
  - Date analysis
  - Automatic re-check

**Fabrication Detection**
- **Purpose:** Flag suspicious citations
- **Features:**
  - Verify DOI exists
  - Check author/title match
  - Detect impossible dates
  - Flag generic titles
- **Implementation:**
  - API lookup validation
  - Pattern matching for fakes
  - Confidence scoring
  - Manual review interface

---

## 5.4 File Export System (Priority: 🟡 High)

**Goal:** Enable export to standard academic formats

### 5.4.1 PDF Export

**jsPDF Integration**
- **Purpose:** Generate PDF documents from markdown
- **Features:**
  - Text formatting (bold, italic, headings)
  - Images and figures
  - Tables
  - Headers and footers
  - Page numbers
  - Table of contents
  - Hyperlinks
- **Implementation:**
  - Install `jspdf` and `jspdf-autotable`
  - Create `/lib/export/pdf-generator.ts`
  - Convert markdown to PDF layout
  - Support custom styling
- **Package:** `jspdf`

**PDF Features**
- **Formatting:**
  - Multiple font families
  - Font sizes and weights
  - Line spacing
  - Margins and padding
- **Academic Features:**
  - Running headers
  - Page numbers (Roman/Arabic)
  - Section breaks
  - Bibliography formatting
- **Export Options:**
  - Letter/A4 paper size
  - Portrait/Landscape orientation
  - Single/Double spacing
  - Margin customization

### 5.4.2 DOCX Export

**docx.js Integration**
- **Purpose:** Generate Microsoft Word documents
- **Features:**
  - Paragraph styles
  - Heading hierarchy
  - Lists (bullet, numbered)
  - Tables
  - Images
  - Citations and bibliography
  - Comments and track changes
- **Implementation:**
  - Install `docx` package
  - Create `/lib/export/docx-generator.ts`
  - Map markdown to Word styles
  - Preserve formatting
- **Package:** `docx`

**DOCX Features**
- **Styles:**
  - Heading 1-6
  - Normal text
  - Block quotes
  - Code blocks
  - Captions
- **Elements:**
  - Tables with styling
  - Inline images
  - Hyperlinks
  - Footnotes
  - Page breaks
- **Academic:**
  - Title page
  - Abstract
  - Table of contents
  - Reference list
  - Appendices

### 5.4.3 PPTX Export

**pptxgenjs Integration**
- **Purpose:** Generate PowerPoint presentations
- **Features:**
  - Slides with layouts
  - Title and content slides
  - Bullet lists
  - Images and charts
  - Speaker notes
  - Master slides
- **Implementation:**
  - Install `pptxgenjs` package
  - Create `/lib/export/pptx-generator.ts`
  - Convert deck JSON to slides
  - Apply themes
- **Package:** `pptxgenjs`

**PPTX Features**
- **Slide Types:**
  - Title slide
  - Section header
  - Content (text/images)
  - Two-column layout
  - Comparison
  - Blank
- **Elements:**
  - Text boxes with formatting
  - Images with positioning
  - Charts (from Chart.js)
  - Tables
  - Shapes and arrows
- **Design:**
  - Theme colors
  - Fonts
  - Backgrounds
  - Layouts

### 5.4.4 XLSX Export

**xlsx.js Integration**
- **Purpose:** Generate Excel spreadsheets
- **Features:**
  - Multiple sheets
  - Cell formatting
  - Formulas
  - Charts
  - Conditional formatting
  - Data validation
- **Implementation:**
  - Install `xlsx` package
  - Create `/lib/export/xlsx-generator.ts`
  - Convert sheet JSON to Excel
  - Preserve formulas and formatting
- **Package:** `xlsx`

**XLSX Features**
- **Data:**
  - Numbers with precision
  - Dates and times
  - Currency formatting
  - Percentages
- **Formulas:**
  - Statistical functions
  - Mathematical operations
  - Cell references
  - Named ranges
- **Visualization:**
  - Embedded charts
  - Conditional colors
  - Data bars
  - Icon sets

---

## 5.5 Testing & Quality Assurance (Priority: 🔴 Critical)

**Goal:** Achieve 80%+ test coverage and ensure reliability

### 5.5.1 Unit Testing

**Vitest Setup**
- **Purpose:** Fast unit testing framework
- **Features:**
  - Component testing
  - Function testing
  - Snapshot testing
  - Mock support
- **Implementation:**
  - Install `vitest` and `@testing-library/react`
  - Configure `vitest.config.ts`
  - Create `tests/` directory structure
  - Add npm scripts
- **Package:** `vitest`

**Test Coverage Goals**
- **Core Functions:** 90%+ coverage
  - Citation formatting
  - Statistical calculations
  - PDF parsing
  - Export generation
- **API Routes:** 80%+ coverage
  - All endpoints tested
  - Error handling verified
  - Authentication checked
- **UI Components:** 70%+ coverage
  - Critical user flows
  - Interactive elements
  - State management

**Test Structure**
```typescript
// tests/unit/citations.test.ts
describe('Citation Formatting', () => {
  it('formats APA citation correctly', () => {
    const citation = formatCitation(input, 'apa', 'in-text')
    expect(citation).toBe('(Smith, 2023)')
  })

  it('handles multiple authors', () => {
    const citation = formatCitation(multiAuthorInput, 'apa', 'in-text')
    expect(citation).toBe('(Smith & Jones, 2023)')
  })

  it('uses et al. for 3+ authors', () => {
    const citation = formatCitation(manyAuthorsInput, 'apa', 'in-text')
    expect(citation).toBe('(Smith et al., 2023)')
  })
})
```

### 5.5.2 Integration Testing

**API Testing**
- **Purpose:** Test API endpoint integration
- **Features:**
  - Request/response validation
  - Authentication testing
  - Error scenarios
  - Rate limiting
- **Implementation:**
  - Use Vitest with `@testing-library/react`
  - Mock external APIs
  - Test database operations
  - Verify monitoring

**Database Testing**
- **Purpose:** Verify data persistence
- **Features:**
  - CRUD operations
  - Transactions
  - Constraints
  - Migrations
- **Implementation:**
  - Use in-memory SQLite for tests
  - Seed test data
  - Clean up after tests
  - Test rollback scenarios

### 5.5.3 End-to-End Testing

**Playwright Setup**
- **Purpose:** User flow testing
- **Features:**
  - Full user workflows
  - Multi-page scenarios
  - Form submissions
  - File uploads/downloads
- **Implementation:**
  - Install `@playwright/test`
  - Create `e2e/` directory
  - Define test scenarios
  - Add CI/CD integration
- **Package:** `@playwright/test`

**E2E Test Scenarios**
```typescript
// e2e/research-workflow.spec.ts
test('complete research paper workflow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'student@edu')
  await page.click('button[type="submit"]')

  // Create document
  await page.click('text=New Document')
  await page.fill('[name="title"]', 'Research Paper')

  // Add citation
  await page.click('text=Insert Citation')
  await page.fill('[name="doi"]', '10.1000/xyz')
  await page.click('text=Insert')

  // Export to PDF
  await page.click('text=Export')
  await page.click('text=PDF')
  await expect(page.locator('text=Export successful')).toBeVisible()
})
```

### 5.5.4 Security Testing

**CodeQL Analysis**
- **Purpose:** Static code analysis for vulnerabilities
- **Features:**
  - SQL injection detection
  - XSS vulnerabilities
  - Authentication issues
  - Data leakage
- **Implementation:**
  - GitHub Actions integration
  - Weekly scans
  - Automated alerts
  - Remediation tracking

**Dependency Scanning**
- **Purpose:** Detect vulnerable dependencies
- **Tools:**
  - `npm audit`
  - Snyk
  - Dependabot
- **Process:**
  - Daily scans
  - Automatic updates
  - Security advisories
  - Version pinning

**Penetration Testing**
- **Purpose:** Identify security weaknesses
- **Areas:**
  - Authentication bypass
  - Authorization flaws
  - Input validation
  - API security
- **Schedule:**
  - Quarterly external audits
  - Monthly internal testing

---

## 5.6 Production Monitoring (Priority: 🔴 Critical)

**Goal:** Comprehensive observability and error tracking

### 5.6.1 Error Tracking

**Sentry Integration**
- **Purpose:** Real-time error monitoring
- **Features:**
  - Error grouping
  - Stack traces
  - User context
  - Release tracking
  - Performance monitoring
- **Implementation:**
  - Install `@sentry/nextjs`
  - Configure `sentry.client.config.ts`
  - Add source maps
  - Set up alerts
- **Package:** `@sentry/nextjs`

**Error Categories**
```typescript
// API errors
logError('API_ERROR', { endpoint, status, message })

// Database errors
logError('DB_ERROR', { query, error })

// External API errors
logError('EXTERNAL_API_ERROR', { provider, endpoint, error })

// User errors
logError('USER_ERROR', { action, context })
```

### 5.6.2 Performance Monitoring

**Application Performance Monitoring (APM)**
- **Purpose:** Track application performance
- **Metrics:**
  - API response time
  - Database query time
  - External API latency
  - Page load time
  - First contentful paint
  - Time to interactive
- **Tools:**
  - Vercel Analytics (built-in)
  - New Relic or Datadog (optional)
- **Implementation:**
  - Add performance tracking middleware
  - Instrument slow queries
  - Track user actions
  - Set SLO thresholds

**Custom Metrics**
```typescript
// Track tool usage
trackMetric('tool.execution', {
  toolName: 'find_sources',
  duration: 1234,
  success: true
})

// Track API calls
trackMetric('api.citation', {
  provider: 'crossref',
  duration: 456,
  cached: false
})

// Track exports
trackMetric('export.pdf', {
  pages: 10,
  duration: 2000,
  size: 524288
})
```

### 5.6.3 Analytics

**Usage Analytics**
- **Purpose:** Understand user behavior
- **Metrics:**
  - Daily/monthly active users
  - Feature adoption
  - Tool usage frequency
  - Retention rate
  - Conversion funnel
- **Tools:**
  - Vercel Analytics
  - Plausible (privacy-focused)
- **Implementation:**
  - Track page views
  - Track button clicks
  - Track tool invocations
  - Respect user privacy (GDPR)

**Academic Analytics**
- **Purpose:** Track academic workflow metrics
- **Metrics:**
  - Citations per document
  - Document completion rate
  - Export frequency
  - Integrity score
  - Tool effectiveness
- **Dashboard:**
  - Real-time metrics
  - Historical trends
  - User cohorts
  - A/B test results

---

## 5.7 Documentation (Priority: 🟡 High)

**Goal:** Comprehensive documentation for all audiences

### 5.7.1 User Documentation

**User Guide**
- **Sections:**
  - Getting started
  - Creating documents
  - Using AI tools
  - Managing citations
  - Exporting work
  - Keyboard shortcuts
- **Format:** Markdown + interactive demos
- **Location:** `/docs/user-guide/`

**Video Tutorials**
- **Topics:**
  - 5-minute quickstart
  - Research paper workflow
  - Data analysis tutorial
  - Citation management
  - Export and submission
- **Platform:** YouTube + in-app embedding

**FAQ**
- **Categories:**
  - General questions
  - Academic integrity
  - Citation help
  - Export troubleshooting
  - Account management
- **Location:** `/docs/faq.md`

### 5.7.2 Developer Documentation

**API Reference**
- **Content:**
  - All endpoints documented
  - Request/response examples
  - Authentication guide
  - Rate limiting
  - Error codes
- **Tool:** OpenAPI/Swagger
- **Location:** `/docs/api/`

**Plugin Development Guide**
- **Content:**
  - Plugin architecture
  - Getting started
  - API reference
  - Best practices
  - Publishing guide
- **Location:** `/docs/PLUGIN-DEVELOPMENT-GUIDE.md` (already created)

**Architecture Documentation**
- **Content:**
  - System architecture
  - Data flow diagrams
  - Database schema
  - Tech stack overview
  - Deployment guide
- **Location:** `/docs/architecture/`

### 5.7.3 Contribution Guide

**CONTRIBUTING.md**
- **Sections:**
  - Code of conduct
  - How to contribute
  - Development setup
  - Pull request process
  - Coding standards
  - Testing requirements

**CODE_OF_CONDUCT.md**
- **Purpose:** Community guidelines
- **Based on:** Contributor Covenant

**SECURITY.md**
- **Purpose:** Security policy and reporting
- **Content:**
  - Supported versions
  - Reporting vulnerabilities
  - Security best practices

---

## 5.8 Phase 5 Timeline

### Week 1-2: Academic API Integration
- [ ] Set up API clients (Crossref, OpenAlex, Semantic Scholar, Unpaywall)
- [ ] Implement caching and rate limiting
- [ ] Add fallback logic
- [ ] Test API integrations

### Week 3-4: PDF Processing
- [ ] Deploy GROBID service
- [ ] Implement PDF parsing
- [ ] Add citation extraction
- [ ] Set up PDF storage

### Week 5-6: Statistical Analysis
- [ ] Integrate simple-statistics.js
- [ ] Implement core statistical functions
- [ ] Add Chart.js visualizations
- [ ] Create statistical reports

### Week 7-8: Citation Management
- [ ] Integrate citation-js
- [ ] Implement APA/MLA/Chicago formatting
- [ ] Build citation verification
- [ ] Add bibliography generation

### Week 9-10: Export System
- [ ] Implement PDF export (jsPDF)
- [ ] Implement DOCX export (docx.js)
- [ ] Implement PPTX export (pptxgenjs)
- [ ] Implement XLSX export (xlsx.js)

### Week 11-12: Testing Infrastructure
- [ ] Set up Vitest
- [ ] Write unit tests (80% coverage goal)
- [ ] Set up Playwright
- [ ] Write E2E tests for key workflows

### Week 13-14: Production Monitoring
- [ ] Integrate Sentry
- [ ] Set up performance monitoring
- [ ] Add custom metrics
- [ ] Create dashboards

### Week 15-16: Documentation & Polish
- [ ] Complete user documentation
- [ ] Write API reference
- [ ] Create video tutorials
- [ ] Polish UI/UX

---

## Dependencies & Packages

### New Dependencies
```json
{
  "dependencies": {
    "@citation-js/core": "^0.7.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "docx": "^8.5.0",
    "jspdf": "^2.5.0",
    "jspdf-autotable": "^3.8.0",
    "pptxgenjs": "^3.12.0",
    "simple-statistics": "^7.8.0",
    "xlsx": "^0.18.0",
    "pdfjs-dist": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@sentry/nextjs": "^7.80.0",
    "@testing-library/react": "^14.0.0",
    "vitest": "^1.0.0"
  }
}
```

### API Keys Required
- Crossref: No API key (polite pool with email)
- OpenAlex: No API key (free tier)
- Semantic Scholar: API key for higher rate limits
- Unpaywall: Email required
- Sentry: Free tier available

---

## Risks & Mitigations

### Technical Risks

**1. API Rate Limits**
- **Risk:** Exceeding free tier limits
- **Mitigation:** Aggressive caching, user API keys, tiered features
- **Impact:** Medium

**2. PDF Processing Accuracy**
- **Risk:** GROBID may not extract all citations correctly
- **Mitigation:** Manual correction interface, multiple parsers, confidence scoring
- **Impact:** Medium

**3. Export Format Fidelity**
- **Risk:** Complex documents may not export perfectly
- **Mitigation:** Preview before export, format validation, user testing
- **Impact:** Low

### Schedule Risks

**1. Feature Scope Creep**
- **Risk:** Adding features not in Phase 5 scope
- **Mitigation:** Strict scope adherence, defer to Phase 6
- **Impact:** High

**2. External Dependencies**
- **Risk:** API changes or outages
- **Mitigation:** Multiple providers, fallback logic, monitoring
- **Impact:** Medium

---

## Success Criteria

### Technical
- [x] Project builds successfully ✅
- [ ] All new features have tests (80%+ coverage)
- [ ] Zero critical security vulnerabilities
- [ ] <2s average API response time
- [ ] 95%+ uptime

### Functional
- [ ] Citation resolution from real APIs (95%+ success rate)
- [ ] Statistical accuracy matches R/Python
- [ ] Export preserves 95%+ formatting
- [ ] PDF parsing 90%+ accurate

### User Experience
- [ ] Complete user documentation
- [ ] Video tutorials for key workflows
- [ ] API reference documentation
- [ ] <5% support ticket rate

---

## Next Phase Preview: Phase 6

**Tentative Focus:**
- Advanced integrations (Google Scholar, PubMed)
- Enhanced collaboration features
- Institutional admin UI
- Instructor dashboard UI
- Mobile app development
- Premium features and monetization

---

## Conclusion

Phase 5 represents a critical milestone in Vibe University's evolution from prototype to production-ready platform. By completing the foundational Phase 1 items alongside robust testing and monitoring, we ensure the platform can reliably serve students, instructors, and institutions at scale.

**Key Outcomes:**
1. ✅ Real academic API integrations
2. ✅ Production-grade statistical analysis
3. ✅ Complete export system
4. ✅ Comprehensive testing coverage
5. ✅ Production monitoring and observability
6. ✅ Complete documentation

**Timeline:** 16 weeks (4 months)  
**Effort:** 2-3 full-stack engineers  
**Budget:** $150K-200K (engineering + infrastructure)

Upon Phase 5 completion, Vibe University will be ready for beta testing with real students and initial institutional partnerships.

---

**Prepared by:** GitHub Copilot Agent  
**Date:** November 13, 2025  
**Status:** 🚀 Phase 5 Planning Complete  
**Next Step:** Begin 5.1 (Academic API Integration)
