# Phase 13 Development Instructions

**Created:** November 17, 2025  
**Purpose:** Complete real API integrations and critical backend features  
**Estimated Duration:** 6-8 weeks  
**Prerequisites:** Build issues resolved, all tests passing for existing features

---

## Overview

Phase 13 focuses on replacing mock data with real API integrations and implementing missing backend features critical for production deployment to educational institutions.

**Current Status:**
- ✅ Build system functional
- ✅ 0 security vulnerabilities
- ✅ 556 tests passing
- ⚠️ 21 E2E tests failing (expected - unimplemented features)
- ⚠️ Using mock data for citations
- ⚠️ No database persistence for admin features

---

## Batch 1: Real Citation APIs Integration (3-4 weeks)

### Priority: CRITICAL
**Why:** Core feature currently uses mock data, blocking real academic use

### 1.1 Crossref API Integration (Week 1)

**Goal:** Enable real DOI resolution and metadata retrieval

**Tasks:**
1. **Setup Crossref Client** (`lib/api/crossref.ts`)
   - Already exists, verify current implementation
   - Add proper error handling and rate limiting
   - Implement response caching (use existing cache service)
   
2. **Update Citation Tools**
   ```typescript
   // Files to modify:
   - ai/tools/find-sources.ts
   - ai/tools/verify-citations.ts
   - lib/citations.ts
   ```
   
3. **Testing**
   ```bash
   # Create tests
   tests/integrations/crossref-api.test.ts
   
   # Test cases:
   - DOI lookup (valid, invalid, malformed)
   - Rate limiting (ensure respects 50 req/sec limit)
   - Error handling (network errors, API errors)
   - Caching (verify cache hits/misses)
   ```

4. **Environment Setup**
   ```env
   # Add to .env.example and document in README
   CROSSREF_EMAIL=your_email@institution.edu
   CROSSREF_RATE_LIMIT=50  # requests per second
   ```

**Success Criteria:**
- [ ] Can resolve DOIs to full citation metadata
- [ ] Rate limiting prevents API abuse
- [ ] Responses cached for 24 hours
- [ ] Tests achieve 90%+ coverage
- [ ] Documentation updated with API usage examples

---

### 1.2 OpenAlex API Integration (Week 2)

**Goal:** Enable comprehensive academic paper search

**Tasks:**
1. **Create OpenAlex Client** (`lib/api/openalex.ts`)
   ```typescript
   // Key functions:
   - searchPapers(query: string, filters?: SearchFilters)
   - getPaperByDOI(doi: string)
   - getPaperById(openAlexId: string)
   - getAuthor(authorId: string)
   - getInstitution(institutionId: string)
   ```

2. **Implement Search Features**
   - Full-text search
   - Filter by year, venue, author
   - Sort by relevance, citation count, publication date
   - Pagination support (max 200 results per page)

3. **Update Research Tools**
   ```typescript
   // Files to modify:
   - ai/tools/semantic-search-papers.ts
   - ai/tools/visualize-citation-network.ts
   - ai/tools/analyze-research-trends.ts
   ```

4. **Testing**
   ```bash
   tests/integrations/openalex-api.test.ts
   ```

**OpenAlex API Notes:**
- No API key required (polite pool)
- Rate limit: 100,000 requests/day
- mailto parameter recommended for higher limits
- Free and open access

**Success Criteria:**
- [ ] Search returns relevant papers with metadata
- [ ] Citation network data available
- [ ] Author and institution lookups work
- [ ] Pagination handles large result sets
- [ ] 90%+ test coverage

---

### 1.3 Semantic Scholar API Integration (Week 3)

**Goal:** Enable advanced citation network analysis

**Tasks:**
1. **Create Semantic Scholar Client** (`lib/api/semantic-scholar.ts`)
   ```typescript
   // Key functions:
   - getPaper(paperId: string)
   - searchPapers(query: string)
   - getCitations(paperId: string)
   - getReferences(paperId: string)
   - getRecommendations(paperId: string)
   - getBatch(paperIds: string[])  // Up to 500 papers
   ```

2. **Implement Citation Network Features**
   - Build citation graphs
   - Calculate influence metrics
   - Find related papers
   - Track citation paths

3. **Update Citation Network Tool**
   ```typescript
   // File: ai/tools/visualize-citation-network.ts
   - Replace mock data with real API calls
   - Implement graph algorithms (PageRank, clustering)
   - Cache network data to minimize API calls
   ```

4. **Environment Setup**
   ```env
   SEMANTIC_SCHOLAR_API_KEY=your_api_key  # Optional, for higher limits
   ```

**Rate Limits:**
- Without key: 100 requests per 5 minutes
- With key: 1 request per second (contact for higher)

**Success Criteria:**
- [ ] Citation networks built from real data
- [ ] Influence scores calculated accurately
- [ ] Batch requests optimize API usage
- [ ] Cache prevents redundant API calls
- [ ] 85%+ test coverage

---

### 1.4 Integration & Testing (Week 4)

**Goal:** Unified citation system using all APIs

**Tasks:**
1. **Create Unified Citation Interface**
   ```typescript
   // File: lib/citation-unified.ts
   
   export class UnifiedCitationService {
     // Try multiple sources in order of preference
     async resolveCitation(identifier: string): Promise<Citation>
     
     // Search across all sources
     async searchPapers(query: string): Promise<SearchResults>
     
     // Get best available metadata
     async getEnrichedMetadata(paperId: string): Promise<EnrichedMetadata>
   }
   ```

2. **Implement Fallback Strategy**
   ```typescript
   // Priority order:
   1. Try Crossref (if DOI available)
   2. Try OpenAlex (comprehensive metadata)
   3. Try Semantic Scholar (citation network data)
   4. Fallback to cached/mock data
   ```

3. **Update All Citation Tools**
   - Replace individual API calls with unified service
   - Ensure seamless user experience
   - Add loading indicators for API calls

4. **Comprehensive Testing**
   ```bash
   npm run test:integration -- citation
   npm run e2e -- citation
   ```

**Success Criteria:**
- [ ] All citation tools use real APIs
- [ ] Fallback prevents failures
- [ ] User experience smooth with loading states
- [ ] All citation E2E tests pass
- [ ] Performance within 2-3 second target

---

## Batch 2: Database Backend for Admin Features (3-4 weeks)

### Priority: CRITICAL
**Why:** Admin features non-functional without persistence

### 2.1 Database Schema Completion (Week 5)

**Goal:** Complete Prisma schema for all admin features

**Current State:**
- ✅ Basic schema exists (`prisma/schema.prisma`)
- ✅ User, Document, Reference models defined
- ⚠️ Some admin models incomplete

**Tasks:**
1. **Review and Complete Schema**
   ```prisma
   // Verify these models in schema.prisma:
   - AdminSettings (✅ exists)
   - License (✅ exists)
   - AuditLog (✅ exists)
   - UsageMetric (✅ exists)
   - Assignment (⚠️ check completeness)
   - Submission (⚠️ check completeness)
   - Grade (⚠️ add if missing)
   ```

2. **Add Missing Models**
   ```prisma
   // If not complete, add:
   
   model Assignment {
     id              String   @id @default(cuid())
     title           String
     description     String?
     courseId        String
     instructorId    String
     dueDate         DateTime
     maxPoints       Int
     rubric          Json?
     requirements    Json?
     published       Boolean  @default(false)
     submissions     Submission[]
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
   }
   
   model Submission {
     id              String   @id @default(cuid())
     assignmentId    String
     assignment      Assignment @relation(fields: [assignmentId], references: [id])
     studentId       String
     content         String
     submittedAt     DateTime @default(now())
     grade           Grade?
     plagiarismCheck Json?
     status          String   @default("submitted")
   }
   
   model Grade {
     id              String   @id @default(cuid())
     submissionId    String   @unique
     submission      Submission @relation(fields: [submissionId], references: [id])
     instructorId    String
     score           Int
     maxPoints       Int
     feedback        Json?
     rubricScores    Json?
     gradedAt        DateTime @default(now())
   }
   ```

3. **Create Migration**
   ```bash
   npx prisma migrate dev --name add-instructor-features
   npx prisma generate
   ```

4. **Seed Test Data**
   ```typescript
   // File: prisma/seed.ts
   - Create sample instructors
   - Create sample assignments
   - Create sample submissions
   - Create sample grades
   ```

**Success Criteria:**
- [ ] All admin models defined
- [ ] Migrations run successfully
- [ ] Seed data populates database
- [ ] Prisma client generated without errors

---

### 2.2 Admin Repository Implementation (Week 6)

**Goal:** Complete database repositories for admin features

**Tasks:**
1. **Assignment Repository** (`lib/db/repositories/assignment-repository.ts`)
   ```typescript
   export class AssignmentRepository extends BaseRepository {
     async create(data: CreateAssignmentData): Promise<Assignment>
     async findById(id: string): Promise<Assignment | null>
     async findByCourse(courseId: string): Promise<Assignment[]>
     async findByInstructor(instructorId: string): Promise<Assignment[]>
     async update(id: string, data: UpdateAssignmentData): Promise<Assignment>
     async delete(id: string): Promise<void>
     async publish(id: string): Promise<Assignment>
   }
   ```

2. **Submission Repository** (`lib/db/repositories/submission-repository.ts`)
   ```typescript
   export class SubmissionRepository extends BaseRepository {
     async create(data: CreateSubmissionData): Promise<Submission>
     async findById(id: string): Promise<Submission | null>
     async findByAssignment(assignmentId: string): Promise<Submission[]>
     async findByStudent(studentId: string): Promise<Submission[]>
     async findLateSubmissions(assignmentId: string): Promise<Submission[]>
   }
   ```

3. **Grade Repository** (`lib/db/repositories/grade-repository.ts`)
   ```typescript
   export class GradeRepository extends BaseRepository {
     async create(data: CreateGradeData): Promise<Grade>
     async findBySubmission(submissionId: string): Promise<Grade | null>
     async findByInstructor(instructorId: string): Promise<Grade[]>
     async updateFeedback(gradeId: string, feedback: Json): Promise<Grade>
   }
   ```

4. **Testing**
   ```bash
   # Create comprehensive tests
   tests/db/assignment-repository.test.ts
   tests/db/submission-repository.test.ts
   tests/db/grade-repository.test.ts
   ```

**Success Criteria:**
- [ ] All CRUD operations work
- [ ] Relationships properly loaded
- [ ] Error handling comprehensive
- [ ] 90%+ test coverage
- [ ] All repository tests pass

---

### 2.3 Admin API Implementation (Week 7)

**Goal:** Wire up API routes to repositories

**Tasks:**
1. **Assignment APIs**
   ```typescript
   // Update files:
   - app/api/instructor/assignments/route.ts
   - app/api/instructor/assignments/[id]/route.ts
   
   // Implement:
   GET    /api/instructor/assignments       // List
   POST   /api/instructor/assignments       // Create
   GET    /api/instructor/assignments/[id]  // Get one
   PUT    /api/instructor/assignments/[id]  // Update
   DELETE /api/instructor/assignments/[id]  // Delete
   POST   /api/instructor/assignments/[id]/publish
   ```

2. **Grading APIs**
   ```typescript
   // Update file: app/api/instructor/grading/route.ts
   
   GET  /api/instructor/grading                    // List pending
   POST /api/instructor/grading/[submissionId]     // Grade submission
   PUT  /api/instructor/grading/[submissionId]     // Update grade
   ```

3. **Replace Mock Data**
   - Remove all TODO comments about database
   - Replace in-memory storage with repository calls
   - Add proper error handling
   - Add input validation with Zod

4. **Testing**
   ```bash
   # API integration tests
   tests/api/instructor-assignments.test.ts
   tests/api/instructor-grading.test.ts
   ```

**Success Criteria:**
- [ ] All API endpoints functional
- [ ] Data persisted to database
- [ ] Input validation prevents errors
- [ ] Authentication/authorization enforced
- [ ] API tests achieve 85%+ coverage

---

### 2.4 E2E Test Fixes (Week 8)

**Goal:** Fix all failing E2E tests for instructor/student workflows

**Tasks:**
1. **Fix Instructor Workflow Tests**
   ```bash
   # File: tests/e2e/instructor-workflow.test.ts
   # Currently 13 failing tests
   
   - Assignment creation (3 tests)
   - Student work review (3 tests)
   - Grading and feedback (3 tests)
   - Plagiarism detection (2 tests)
   - Instructor collaboration (2 tests)
   ```

2. **Fix Student Workflow Tests**
   ```bash
   # File: tests/e2e/student-workflow.test.ts
   # Currently 8 failing tests
   
   - Citation management (3 tests)
   - Document export (1 test)
   - Collaboration features (1 test)
   - FERPA compliance (1 test)
   - Document organization (2 tests)
   ```

3. **Update Test Database Setup**
   ```typescript
   // Better fixtures and cleanup
   beforeEach(async () => {
     await cleanDatabase()
     await seedTestUser()
     await seedTestAssignments()
     await seedTestSubmissions()
   })
   ```

4. **Run Full Test Suite**
   ```bash
   npm run test:run
   # Target: 577/577 tests passing (100%)
   ```

**Success Criteria:**
- [ ] All 21 failing E2E tests now pass
- [ ] Test pass rate: 100%
- [ ] Test execution time < 30 seconds
- [ ] CI/CD pipeline green

---

## Batch 3: PDF Processing with GROBID (2-3 weeks)

### Priority: HIGH
**Why:** Required to process academic papers

### 3.1 GROBID Setup (Week 9, Days 1-2)

**Goal:** Deploy GROBID service

**Tasks:**
1. **Docker Setup**
   ```yaml
   # Add to docker-compose.yml
   grobid:
     image: lfoppiano/grobid:0.8.0
     ports:
       - "8070:8070"
     environment:
       - JAVA_OPTS=-Xmx4g
     volumes:
       - ./grobid-data:/opt/grobid/data
   ```

2. **Start Service**
   ```bash
   docker-compose up -d grobid
   # Verify: curl http://localhost:8070/api/isalive
   ```

3. **Environment Configuration**
   ```env
   GROBID_URL=http://localhost:8070/api
   GROBID_TIMEOUT=30000  # 30 seconds
   ```

---

### 3.2 GROBID Client Implementation (Week 9, Days 3-5)

**Goal:** Create client for GROBID API

**Tasks:**
1. **Create GROBID Client** (`lib/pdf/grobid-client.ts`)
   ```typescript
   export class GROBIDClient {
     // Extract metadata from PDF
     async processHeader(pdfBuffer: Buffer): Promise<Metadata>
     
     // Extract full text with structure
     async processFullText(pdfBuffer: Buffer): Promise<TEI>
     
     // Extract references/citations
     async processReferences(pdfBuffer: Buffer): Promise<Reference[]>
     
     // Process PDF in parts (for large files)
     async processPDF(
       pdfBuffer: Buffer,
       options: ProcessOptions
     ): Promise<ProcessedPDF>
   }
   ```

2. **Implement TEI Parser** (`lib/pdf/tei-parser.ts`)
   ```typescript
   // Parse GROBID's TEI XML output
   export class TEIParser {
     parseMetadata(teiXml: string): Metadata
     parseAuthors(teiXml: string): Author[]
     parseAbstract(teiXml: string): string
     parseReferences(teiXml: string): Reference[]
     parseSections(teiXml: string): Section[]
   }
   ```

3. **Testing**
   ```bash
   tests/pdf/grobid-client.test.ts
   tests/pdf/tei-parser.test.ts
   ```

**Success Criteria:**
- [ ] Can process PDF files < 10MB
- [ ] Metadata extraction accurate
- [ ] References parsed correctly
- [ ] Tests use sample PDFs
- [ ] Error handling for malformed PDFs

---

### 3.3 PDF Upload Integration (Week 10)

**Goal:** Enable PDF uploads and processing

**Tasks:**
1. **Update PDF Upload API** (`app/api/pdf/upload/route.ts`)
   ```typescript
   POST /api/pdf/upload
   - Accept PDF file (max 10MB)
   - Validate file type
   - Process with GROBID
   - Extract metadata and references
   - Store in database
   - Return processed data
   ```

2. **Create PDF Processing Queue**
   ```typescript
   // For larger files or batch processing
   // File: lib/pdf/processing-queue.ts
   
   export class PDFProcessingQueue {
     async enqueue(pdfId: string): Promise<void>
     async process(pdfId: string): Promise<void>
     async getStatus(pdfId: string): Promise<QueueStatus>
   }
   ```

3. **Update UI Components**
   ```typescript
   // File: components/pdf-upload.tsx
   - Add file upload with drag-and-drop
   - Show processing progress
   - Display extracted metadata
   - Allow editing before saving
   ```

4. **Testing**
   ```bash
   tests/api/pdf-upload.test.ts
   tests/e2e/pdf-workflow.test.ts
   ```

**Success Criteria:**
- [ ] PDF upload works smoothly
- [ ] Processing completes in < 30 seconds
- [ ] Metadata accuracy > 90%
- [ ] UI shows clear progress
- [ ] Integration tests pass

---

## Batch 4: Database Migration to PostgreSQL (1-2 weeks)

### Priority: MEDIUM
**Why:** SQLite not suitable for production

### 4.1 Migration Planning (Week 11, Days 1-2)

**Goal:** Plan migration strategy

**Tasks:**
1. **Document Current Schema**
   ```bash
   npx prisma db pull --schema=./prisma/schema-sqlite.prisma
   ```

2. **Plan Migration Steps**
   ```markdown
   # Migration Checklist
   - [ ] Set up PostgreSQL database
   - [ ] Update Prisma schema
   - [ ] Create migration scripts
   - [ ] Test in staging environment
   - [ ] Plan backup strategy
   - [ ] Plan rollback procedure
   - [ ] Schedule downtime (if needed)
   ```

3. **Create Migration Guide**
   ```markdown
   # File: docs/POSTGRESQL-MIGRATION.md
   - Prerequisites
   - Step-by-step instructions
   - Troubleshooting
   - Rollback procedures
   ```

---

### 4.2 PostgreSQL Setup (Week 11, Days 3-4)

**Goal:** Configure PostgreSQL

**Tasks:**
1. **Docker Setup**
   ```yaml
   # Add to docker-compose.yml
   postgres:
     image: postgres:16-alpine
     ports:
       - "5432:5432"
     environment:
       POSTGRES_DB: vibeuniversity
       POSTGRES_USER: vibeuser
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
     volumes:
       - postgres-data:/var/lib/postgresql/data
   
   volumes:
     postgres-data:
   ```

2. **Environment Configuration**
   ```env
   # Update .env.example
   DATABASE_URL="postgresql://vibeuser:password@localhost:5432/vibeuniversity"
   ```

3. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

---

### 4.3 Migration Execution (Week 11, Day 5)

**Goal:** Migrate data to PostgreSQL

**Tasks:**
1. **Create Initial Migration**
   ```bash
   npx prisma migrate dev --name init-postgresql
   ```

2. **Data Migration Script** (`scripts/migrate-to-postgres.ts`)
   ```typescript
   // Export from SQLite
   // Transform data if needed
   // Import to PostgreSQL
   // Verify data integrity
   ```

3. **Test Migration**
   ```bash
   # In staging environment
   npm run migrate:test
   npm run test:run
   npm run build
   ```

**Success Criteria:**
- [ ] All data migrated successfully
- [ ] No data loss
- [ ] All tests pass with PostgreSQL
- [ ] Application runs without errors
- [ ] Performance acceptable

---

## Batch 5: FERPA Compliance Implementation (3-4 weeks)

### Priority: CRITICAL (for institutional deployment)
**Why:** Legal requirement for educational institutions

### 5.1 Legal Review and Requirements (Week 12)

**Goal:** Understand FERPA requirements

**Tasks:**
1. **Review FERPA Requirements**
   ```markdown
   # Create: docs/FERPA-REQUIREMENTS.md
   
   ## Key Requirements:
   - Student consent for data access
   - Parent/guardian access for students < 18
   - Data privacy and security
   - Data retention policies
   - Student data export/deletion rights
   - Audit logging of access
   - Third-party data sharing restrictions
   ```

2. **Consult Legal Counsel**
   - Review requirements with institution's legal team
   - Document compliance obligations
   - Define data handling procedures

3. **Create Compliance Checklist**
   ```markdown
   # File: docs/FERPA-COMPLIANCE-CHECKLIST.md
   - [ ] Consent management
   - [ ] Data encryption at rest
   - [ ] Data encryption in transit
   - [ ] Access controls
   - [ ] Audit logging
   - [ ] Data retention
   - [ ] Data export
   - [ ] Data deletion
   - [ ] Privacy policy
   - [ ] Terms of service
   ```

---

### 5.2 Data Encryption (Week 13)

**Goal:** Implement encryption at rest

**Tasks:**
1. **Field-Level Encryption** (`lib/security/encryption.ts`)
   ```typescript
   export class FieldEncryption {
     // Encrypt sensitive fields
     async encrypt(data: string): Promise<string>
     
     // Decrypt for authorized access
     async decrypt(encrypted: string): Promise<string>
     
     // Key rotation
     async rotateKeys(): Promise<void>
   }
   ```

2. **Update User Model**
   ```prisma
   model User {
     email           String  // Encrypted
     dateOfBirth     String? // Encrypted
     ssn             String? // Encrypted if stored
     // ... other fields
   }
   ```

3. **Environment Setup**
   ```env
   ENCRYPTION_KEY=<64-character-hex-string>
   ENCRYPTION_ALGORITHM=aes-256-gcm
   ```

4. **Testing**
   ```bash
   tests/security/encryption.test.ts
   ```

---

### 5.3 Consent Management (Week 14)

**Goal:** Implement student consent system

**Tasks:**
1. **Create Consent Model**
   ```prisma
   model Consent {
     id           String   @id @default(cuid())
     userId       String
     user         User     @relation(fields: [userId], references: [id])
     type         String   // 'ferpa', 'data-sharing', etc.
     granted      Boolean
     grantedAt    DateTime?
     revokedAt    DateTime?
     metadata     Json?
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt
   }
   ```

2. **Consent API** (`app/api/compliance/consent/route.ts`)
   ```typescript
   GET  /api/compliance/consent          // Get user consents
   POST /api/compliance/consent          // Grant consent
   PUT  /api/compliance/consent/[id]     // Update consent
   DELETE /api/compliance/consent/[id]   // Revoke consent
   ```

3. **Consent UI Components**
   ```typescript
   // components/compliance/consent-dialog.tsx
   - Display clear consent language
   - Explain data usage
   - Allow granular consent
   - Easy revocation
   ```

---

### 5.4 Data Access Controls (Week 15)

**Goal:** Implement proper access controls

**Tasks:**
1. **Update Authorization**
   ```typescript
   // lib/auth/permissions.ts
   
   export const FERPA_PERMISSIONS = {
     VIEW_OWN_DATA: 'student:view-own',
     EXPORT_OWN_DATA: 'student:export-own',
     DELETE_OWN_DATA: 'student:delete-own',
     VIEW_STUDENT_DATA: 'instructor:view-student',
     VIEW_ALL_DATA: 'admin:view-all',
   }
   ```

2. **Audit Logging**
   ```typescript
   // Enhance existing audit log
   - Log all data access
   - Log consent changes
   - Log data exports
   - Log data deletions
   ```

3. **Data Export** (`app/api/compliance/export/route.ts`)
   ```typescript
   GET /api/compliance/export
   - Export all user data
   - Include audit trail
   - Generate PDF/ZIP
   - Email to user
   ```

4. **Data Deletion** (`app/api/compliance/delete/route.ts`)
   ```typescript
   POST /api/compliance/delete
   - Soft delete initially
   - Hard delete after 30 days
   - Preserve audit logs
   - Notify user of completion
   ```

---

## Success Metrics

### Overall Phase 13 Completion Criteria

**Technical:**
- [ ] All API integrations functional and tested
- [ ] Database backend complete with 100% test pass rate
- [ ] PDF processing handles 95%+ of academic papers
- [ ] PostgreSQL migration successful
- [ ] FERPA compliance verified by legal counsel

**Quality:**
- [ ] 0 security vulnerabilities
- [ ] 90%+ code coverage for new features
- [ ] 100% test pass rate (577/577 tests)
- [ ] Build completes in < 30 seconds
- [ ] All documentation updated

**Performance:**
- [ ] API responses < 2 seconds (95th percentile)
- [ ] PDF processing < 30 seconds per file
- [ ] Database queries optimized (< 100ms avg)
- [ ] Page load times < 2 seconds

---

## Risk Mitigation

### High-Risk Items

1. **API Rate Limits**
   - **Risk:** Exceeding free tier limits
   - **Mitigation:** Implement aggressive caching, monitor usage, plan for paid tiers

2. **GROBID Processing Time**
   - **Risk:** Slow processing blocks UI
   - **Mitigation:** Async processing queue, background jobs

3. **PostgreSQL Migration**
   - **Risk:** Data loss during migration
   - **Mitigation:** Multiple backups, dry-run testing, rollback plan

4. **FERPA Non-Compliance**
   - **Risk:** Legal liability, cannot sell to institutions
   - **Mitigation:** Legal review, third-party audit, insurance

---

## Testing Strategy

### Continuous Testing

```bash
# Run after each batch completion
npm run lint
npm run build
npm run test:run
npm run e2e
npm audit
```

### Integration Testing
```bash
# Test API integrations
npm run test:integration -- citation
npm run test:integration -- database
npm run test:integration -- pdf
```

### E2E Testing
```bash
# Test full workflows
npm run e2e -- instructor
npm run e2e -- student
npm run e2e -- admin
```

---

## Documentation Requirements

Each batch must update:
- [ ] README.md (if APIs or setup changes)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagrams (if structure changes)
- [ ] User guides (for new features)
- [ ] Developer guides (for new patterns)
- [ ] CHANGELOG.md (track all changes)

---

## Team Coordination

### Recommended Team Structure

**Batch 1 (Citation APIs):**
- 1 Backend Engineer
- 1 Frontend Engineer (UI updates)
- 0.5 QA Engineer

**Batch 2 (Database Backend):**
- 1 Backend Engineer
- 0.5 DevOps Engineer (PostgreSQL setup)
- 0.5 QA Engineer

**Batch 3 (PDF Processing):**
- 1 Backend Engineer
- 0.5 DevOps Engineer (GROBID setup)

**Batch 4 (PostgreSQL Migration):**
- 1 Backend Engineer
- 1 DevOps Engineer
- 0.5 QA Engineer

**Batch 5 (FERPA):**
- 1 Backend Engineer
- 0.5 Legal Consultant
- 0.5 Security Engineer

---

## Next Steps

1. **Review this document** with development team
2. **Prioritize batches** based on business needs
3. **Assign team members** to each batch
4. **Set sprint schedule** (recommend 2-week sprints)
5. **Begin Batch 1** - Citation APIs integration

---

## Support and Resources

### API Documentation
- Crossref: https://www.crossref.org/documentation/
- OpenAlex: https://docs.openalex.org/
- Semantic Scholar: https://api.semanticscholar.org/

### Tools
- GROBID: https://grobid.readthedocs.io/
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs/

### Compliance
- FERPA Guide: https://www2.ed.gov/policy/gen/guid/fpco/ferpa/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Next Review:** Start of Phase 13
