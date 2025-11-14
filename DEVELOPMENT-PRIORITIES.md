# Development Priorities - Quick Reference

**Last Updated:** November 14, 2025

## Current Status
- ✅ Phase 1-10 Complete (Database, APIs, Type Safety, Caching)
- 📊 Project ~75% Complete
- 🎯 Next Focus: Phase 11-15

---

## Top 5 Immediate Priorities

### 1. 🔴 Statistical Analysis Engine (Week 1-2)
**Why:** Core spreadsheet functionality is currently stubbed  
**Impact:** HIGH - Unlocks real data analysis capabilities  
**Files:** `lib/statistics/core.ts`, `lib/statistics/reports.ts`

**Tasks:**
- Implement ANOVA, Chi-Square tests
- Add confidence intervals
- Complete hypothesis testing
- Write comprehensive tests

**Effort:** 5-7 days

---

### 2. 🔴 Admin Frontend Integration (Week 2-3)
**Why:** Admin pages use mock data instead of real APIs  
**Impact:** HIGH - Makes admin features actually functional  
**Files:** `app/admin/*`, `components/admin/*`

**Tasks:**
- Connect user management to APIs
- Connect license management to APIs
- Connect branding to APIs
- Connect audit logs to APIs
- Connect analytics to APIs

**Effort:** 5-7 days

---

### 3. 🟡 Help & Settings Systems (Week 3-4)
**Why:** Currently stubbed with console.log  
**Impact:** MEDIUM - Improves UX and accessibility  
**Files:** `app/header-buttons.tsx`, `components/navigation-header.tsx`

**Tasks:**
- Create help dialog component
- Write help documentation
- Create settings dialog
- Implement user preferences
- Add keyboard shortcut customization

**Effort:** 4-5 days

---

### 4. 🔴 FERPA Compliance (Week 5-8)
**Why:** Required for institutional deployment  
**Impact:** CRITICAL - Legal requirement  
**Files:** New compliance module

**Tasks:**
- Legal consultation
- Implement data encryption at rest
- Add data export/deletion features
- Implement consent management
- Enhanced audit logging
- Security hardening

**Effort:** 15-20 days

---

### 5. 🟢 Google Scholar Integration (Week 9)
**Why:** Currently stubbed (TODO comment)  
**Impact:** MEDIUM - Enhances research capabilities  
**Files:** `lib/research-integrations.ts`

**Tasks:**
- Research API options
- Implement paper search
- Implement citation lookup
- Add rate limiting and caching

**Effort:** 4-5 days

---

## TODO Items Found in Code

### High Priority
- `lib/statistics/core.ts` - ANOVA, Chi-Square, advanced tests
- `app/admin/users/page.tsx` - Connect to real APIs (5 TODOs)
- `components/admin/users-table.tsx` - CRUD operations (4 TODOs)
- `app/header-buttons.tsx` - Help/Settings dialogs (2 TODOs)
- `components/navigation-header.tsx` - Help/Settings dialogs (2 TODOs)

### Medium Priority
- `lib/research-integrations.ts` - Google Scholar API
- `lib/auth/recovery.ts` - Email service integration
- `app/api/auth/google/callback/route.ts` - User database creation
- `app/api/instructor/peer-review/route.ts` - Authentication (2 TODOs)

### Low Priority
- Various export functionality improvements
- Additional LMS integrations (Blackboard, Moodle)

---

## Quick Start Guide

### To Start Phase 11 Sprint 1 (Statistical Analysis):

1. **Setup**
   ```bash
   cd /home/runner/work/oss-vibing/oss-vibing
   npm install
   ```

2. **Review Current Implementation**
   ```bash
   cat lib/statistics/core.ts | grep "export function"
   ```

3. **Run Existing Tests**
   ```bash
   npm run test:run tests/statistics.test.ts
   ```

4. **Create Task Branch**
   ```bash
   git checkout -b feature/statistical-analysis-engine
   ```

5. **Implement Functions**
   - Start with ANOVA
   - Add Chi-Square tests
   - Implement confidence intervals
   - Add hypothesis tests

6. **Test Against Known Data**
   - Compare outputs with R/Python
   - Test edge cases
   - Verify mathematical accuracy

---

## Recommended Development Order

### Month 1
- Week 1-2: Statistical Analysis Engine
- Week 2-3: Admin Frontend Integration
- Week 3-4: Help & Settings Systems

### Month 2
- Week 1-2: Code quality improvements (ESLint)
- Week 2-3: Google Scholar Integration
- Week 3-4: Additional LMS Integrations (Blackboard/Moodle)

### Month 3-4
- Week 1-4: FERPA Compliance Implementation
- Week 5-8: Security hardening and audit

### Month 5-6
- Week 1-6: Real-Time Collaboration System

---

## Key Metrics to Track

- **Tests:** Currently 201 passing (target: maintain 100%)
- **ESLint Issues:** Currently 218 (target: <150)
- **Security:** Currently 0 vulnerabilities (target: maintain)
- **Code Coverage:** Unknown (target: >80%)
- **Features Complete:** ~75% (target: 95% by end of Phase 15)

---

## Resources

- **Full Plan:** See `PHASE-11-DEVELOPMENT-PLAN.md`
- **Current Tasks:** See `NEXT-DEV-TASKS.md`
- **Roadmap:** See `ROADMAP.md`
- **Phase History:** See `PHASE-*-COMPLETION.md` files

---

## Decision Matrix

| Feature | Priority | Impact | Effort | Dependencies | Start Week |
|---------|----------|--------|--------|--------------|------------|
| Statistical Analysis | 🔴 Critical | HIGH | 5-7 days | None | 1 |
| Admin Integration | 🔴 Critical | HIGH | 5-7 days | None | 2 |
| Help/Settings | 🟡 High | MEDIUM | 4-5 days | None | 3 |
| FERPA Compliance | 🔴 Critical | HIGH | 15-20 days | Legal | 5 |
| Google Scholar | 🟢 Medium | MEDIUM | 4-5 days | None | 9 |
| LMS Integrations | 🟢 Medium | MEDIUM | 6-8 days | API Access | 10 |
| Real-Time Collab | 🟢 Medium | HIGH | 20-25 days | Infrastructure | 13 |

---

**Next Action:** Begin Phase 11 Sprint 1 - Statistical Analysis Engine  
**Success Criteria:** All statistical functions implemented, tested, and documented
