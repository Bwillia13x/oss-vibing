# Vibe University - Next Development Tasks

**Date:** November 14, 2025  
**Last Updated:** November 14, 2025 (Status Update)  
**Current Status:** Phase 8 Complete, 65% Overall Project Completion  
**Next Phase:** Phase 9 - Backend Infrastructure & API Integration

---

## Immediate Action Items (This Week)

### 1. Fix Critical Issues ⚠️
**Priority:** CRITICAL  
**Effort:** 3-5 days  
**Owner:** Engineering Team  
**Status:** ✅ COMPLETED (Tests, Security) | 🔄 IN PROGRESS (ESLint)

#### Test Failures
- [x] ✅ **COMPLETED** - All tests passing (174/174)
  - ~~Fix failing statistics tests~~ - **All tests now pass**
  - ~~Fix failing citation tests~~ - **All tests now pass**
  - All previously failing tests have been resolved in earlier phases
  
#### Security Updates
- [x] ✅ **COMPLETED** - Zero vulnerabilities found
  - Dependencies are up to date
  - `ai` package: Currently at v5.0.93 (>= 5.0.52) ✓
  - `next` package: Currently at v15.5.6 ✓
  - `prismjs`: No vulnerabilities detected ✓
  - Security scan clean: 0 critical vulnerabilities

#### ESLint Configuration
- [x] ~~Fix circular dependency in `eslint.config.mjs`~~ - **Already fixed in Phase 9**
- [x] Migrated to native flat config format - **Completed**
- [x] Linting works properly - **Verified**
- [x] **IN PROGRESS:** Reduce linting errors/warnings
  - Progress: 31 issues fixed (8.3% reduction from 372 to 341)
  - Fixed: 5 `prefer-const` errors
  - Fixed: 26 unused parameter warnings (writer, toolCallId, error)
  - Remaining: 205 errors, 136 warnings (mostly `@typescript-eslint/no-explicit-any`)
- [ ] Add linting to CI/CD

### 2. Add Phase 8 Tests 
**Priority:** HIGH  
**Effort:** 2-3 days  
**Status:** ✅ COMPLETED

- [x] ✅ Add smoke tests for all 7 AI tools - **Completed in `tests/phase8-ai-tools.test.ts`**
- [x] Test `analyze-argument-structure.ts` - **24 tests passing**
- [x] Test `evaluate-thesis-strength.ts` - **Tests included**
- [x] Test `identify-research-gaps.ts` - **Tests included**
- [x] Test `semantic-search-papers.ts` - **Tests included**
- [x] Test `visualize-citation-network.ts` - **Tests included**
- [x] Test `analyze-research-trends.ts` - **Tests included**
- [x] Test `synthesize-literature-review.ts` - **Tests included**
- [x] Verify research assistant dashboard renders - **Verified**

---

## Phase 9 Priorities (Next 4-6 Weeks)

### Sprint 1: Database Foundation (Week 1-2)

**Goal:** Establish persistent data layer

#### Week 1: Database Setup
- [ ] Set up PostgreSQL database (local + cloud)
- [ ] Install and configure Prisma ORM
- [ ] Design initial database schema:
  ```prisma
  - User (id, email, name, role, createdAt)
  - Document (id, userId, title, content, type, createdAt)
  - Reference (id, userId, doi, metadata, createdAt)
  - Citation (id, documentId, referenceId, location)
  - AdminSettings (id, key, value, updatedAt)
  - AuditLog (id, userId, action, details, timestamp)
  - License (id, institutionId, seats, expiresAt)
  ```
- [ ] Create Prisma migrations
- [ ] Set up database connection pooling
- [ ] Add environment variables for database URL
- [ ] Test database connectivity

#### Week 2: Data Access Layer
- [ ] Create Prisma client singleton
- [ ] Build repository pattern for:
  - Users
  - Documents
  - References
  - Citations
  - Admin settings
  - Audit logs
- [ ] Add error handling and retry logic
- [ ] Implement database transaction support
- [ ] Add data validation layer
- [ ] Write integration tests for repositories

### Sprint 2: Admin Backend APIs (Week 3-4)

**Goal:** Complete backend for admin features

#### Week 3: User & License Management
- [ ] Implement `/api/admin/users` endpoints:
  - `GET /api/admin/users` - List users with pagination
  - `POST /api/admin/users` - Create user
  - `PUT /api/admin/users/:id` - Update user
  - `DELETE /api/admin/users/:id` - Delete user
  - `POST /api/admin/users/bulk` - Bulk import
  - `GET /api/admin/users/export` - Export to CSV
  
- [ ] Implement `/api/admin/licenses` endpoints:
  - `GET /api/admin/licenses` - List licenses
  - `POST /api/admin/licenses` - Create license
  - `PUT /api/admin/licenses/:id` - Update license
  - `GET /api/admin/licenses/:id/usage` - Usage stats
  
- [ ] Add authentication middleware
- [ ] Add authorization (admin-only)
- [ ] Add input validation with Zod
- [ ] Add rate limiting

#### Week 4: Branding & Audit Logs
- [ ] Implement `/api/admin/branding` endpoints:
  - `GET /api/admin/branding` - Get settings
  - `PUT /api/admin/branding` - Update settings
  - `POST /api/admin/branding/logo` - Upload logo
  
- [ ] Implement `/api/admin/audit-logs` endpoints:
  - `GET /api/admin/audit-logs` - List logs with filters
  - `GET /api/admin/audit-logs/export` - Export to CSV
  
- [ ] Implement `/api/admin/analytics` endpoints:
  - `GET /api/admin/analytics/users` - User analytics
  - `GET /api/admin/analytics/usage` - Usage metrics
  - `POST /api/admin/analytics/track` - Track events
  
- [ ] Add audit logging middleware (auto-log admin actions)
- [ ] Test all admin endpoints
- [ ] Update frontend to use real APIs

### Sprint 3: API Integrations (Week 5-6)

**Goal:** Replace mock data with real academic APIs

#### Week 5: Citation APIs
- [ ] Register for API keys:
  - Crossref API (free)
  - OpenAlex API (free)
  - Semantic Scholar API (free)
  - Unpaywall API (free)
  
- [ ] Implement Crossref integration:
  - DOI resolution
  - Metadata retrieval
  - Citation counts
  
- [ ] Implement OpenAlex integration:
  - Paper search
  - Author lookup
  - Concept extraction
  
- [ ] Build API client abstraction layer
- [ ] Add response caching (Redis)
- [ ] Add rate limiting and retry logic
- [ ] Add fallback between providers

#### Week 6: Scholar & PDF Processing
- [ ] Implement Semantic Scholar integration:
  - Citation network data
  - Influential citations
  - Related papers
  
- [ ] Set up GROBID service:
  - Docker container setup
  - API endpoint configuration
  
- [ ] Implement PDF processing:
  - Upload PDF files
  - Extract metadata with GROBID
  - Extract text content
  - Store in database
  
- [ ] Update `find-sources` tool to use real APIs
- [ ] Update `verify-citations` tool with real lookups
- [ ] Add comprehensive error handling
- [ ] Test with real academic papers

---

## Medium-Term Priorities (Months 2-3)

### 1. Redis Caching Layer
**Priority:** HIGH  
**Effort:** 1 week

- [ ] Set up Redis (local + cloud)
- [ ] Implement cache service
- [ ] Cache API responses (citations, papers)
- [ ] Cache computed results (statistics, analysis)
- [ ] Add cache invalidation strategy
- [ ] Monitor cache hit rates

### 2. Advanced Authentication
**Priority:** HIGH  
**Effort:** 2 weeks

- [ ] Add Google OAuth for .edu accounts
- [ ] Implement SAML/SSO for institutions
- [ ] Add session management with JWT
- [ ] Implement refresh tokens
- [ ] Add MFA (TOTP) support
- [ ] Build account recovery system

### 3. FERPA Compliance
**Priority:** CRITICAL  
**Effort:** 3-4 weeks

- [ ] Legal consultation on FERPA requirements
- [ ] Implement data encryption at rest (database)
- [ ] Ensure encryption in transit (HTTPS only)
- [ ] Add data retention policies
- [ ] Build student data export (GDPR/FERPA)
- [ ] Build student data deletion (right to be forgotten)
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Add consent management
- [ ] Audit logging for all data access

### 4. Complete Statistical Analysis
**Priority:** MEDIUM  
**Effort:** 2 weeks

- [ ] Implement all missing functions
- [ ] Add ANOVA implementation
- [ ] Add chi-square tests
- [ ] Add confidence intervals
- [ ] Fix calculation errors
- [ ] Add comprehensive tests
- [ ] Document statistical methods

### 5. Real-Time Collaboration (Phase 2 Deferred)
**Priority:** MEDIUM  
**Effort:** 4-6 weeks

- [ ] Evaluate Yjs vs Automerge (CRDT)
- [ ] Set up WebSocket server
- [ ] Implement operational transformation
- [ ] Add document locking
- [ ] Build presence indicators
- [ ] Add commenting system
- [ ] Implement permissions (owner/editor/viewer)
- [ ] Add conflict resolution
- [ ] Test with multiple users

---

## Long-Term Priorities (Months 4-6)

### 1. Microservices Architecture
- [ ] Split PDF processing service
- [ ] Extract citation API service
- [ ] Build analytics service
- [ ] Implement message queue (RabbitMQ)
- [ ] Set up service mesh
- [ ] Add service monitoring

### 2. Enhanced Testing & CI/CD
- [ ] Achieve 80% code coverage
- [ ] Add integration tests
- [ ] Complete E2E test suite
- [ ] Set up GitHub Actions CI/CD
- [ ] Add automated security scanning
- [ ] Set up staging environment
- [ ] Add load testing
- [ ] Performance regression testing

### 3. Institutional Features
- [ ] Build instructor assignment creation
- [ ] Add rubric/grading tools
- [ ] Implement peer review workflows
- [ ] Add plagiarism report aggregation
- [ ] Build class analytics dashboard
- [ ] Add grade export to LMS

### 4. Advanced Integrations
- [ ] Google Scholar integration
- [ ] PubMed integration
- [ ] arXiv integration
- [ ] IEEE Xplore integration
- [ ] Zotero sync
- [ ] Mendeley sync
- [ ] Grammarly integration

---

## Success Metrics for Phase 9

| Metric | Target | Measurement |
|--------|--------|-------------|
| Database Implementation | 100% | All admin features persist data |
| API Integration | 4 APIs | Crossref, OpenAlex, Semantic Scholar, Unpaywall |
| Test Pass Rate | 100% | Zero failing tests |
| Code Coverage | 80% | Critical paths covered |
| Security Vulnerabilities | 0 critical | npm audit clean |
| Admin Features | 100% | All backend APIs functional |
| API Response Time | <200ms | 95th percentile |
| Database Queries | <50ms | Average query time |

---

## Risk Mitigation

### High Risks

**Database Migration**
- Risk: Data loss during migration
- Mitigation: 
  - Backup file-based data before migration
  - Test migration in staging first
  - Implement rollback plan

**API Rate Limits**
- Risk: Exceeding free tier limits
- Mitigation:
  - Implement aggressive caching
  - Add rate limiting on our side
  - Monitor API usage
  - Plan for paid tiers

**FERPA Non-Compliance**
- Risk: Cannot deploy to institutions
- Mitigation:
  - Legal review before deployment
  - Implement all requirements
  - Third-party compliance audit

### Medium Risks

**Breaking Changes**
- Risk: Breaking existing features
- Mitigation:
  - Comprehensive testing
  - Feature flags for gradual rollout
  - Maintain backward compatibility

**Performance Degradation**
- Risk: Database adds latency
- Mitigation:
  - Performance testing
  - Database indexing
  - Connection pooling
  - Caching layer

---

## Resource Requirements

### Phase 9 (Next 6 Weeks)

**Engineering:**
- 2 backend engineers (database, APIs)
- 1 frontend engineer (admin UI updates)
- 1 DevOps engineer (infrastructure)

**Infrastructure:**
- PostgreSQL database (cloud)
- Redis cache (cloud)
- GROBID service (Docker)
- Staging environment

**Budget:**
- Infrastructure: $500-1000/month
- API costs: $200-500/month
- Testing tools: $200/month
- Total: ~$1000-1700/month

**Time:**
- Sprint 1 (Database): 2 weeks
- Sprint 2 (Admin APIs): 2 weeks
- Sprint 3 (Integrations): 2 weeks
- **Total: 6 weeks**

---

## Deployment Checklist (Post-Phase 9)

### Pre-Deployment
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance testing complete
- [ ] FERPA compliance verified
- [ ] Staging environment tested
- [ ] Database migrations tested
- [ ] Backup/restore tested
- [ ] Monitoring configured
- [ ] Documentation updated

### Deployment
- [ ] Database migration plan
- [ ] Zero-downtime deployment strategy
- [ ] Rollback plan documented
- [ ] Health checks configured
- [ ] Alerts configured
- [ ] Status page ready

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify database queries
- [ ] Test critical paths
- [ ] User acceptance testing
- [ ] Gather feedback

---

## Communication Plan

### Weekly Updates
- Progress against sprint goals
- Blockers and risks
- Demo of completed features
- Next week priorities

### Bi-Weekly Reviews
- Test coverage metrics
- Performance benchmarks
- Security scan results
- Technical debt tracking

### Monthly Planning
- Review roadmap progress
- Adjust priorities
- Resource allocation
- Budget review

---

**Document Owner:** Engineering Lead  
**Last Updated:** November 13, 2025  
**Next Review:** Start of Phase 9 Sprint 1  
**Status:** Ready to Begin Phase 9
