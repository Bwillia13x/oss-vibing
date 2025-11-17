# Next Session Work Instructions - Phase 13 Week 9

**Generated:** November 17, 2025  
**Session Type:** Phase 13 Development - Batch 2 Week 9  
**Current Branch:** `copilot/complete-week-8-work`

---

## Executive Summary

Phase 13 Week 8 is **COMPLETE** ✅. All instructor APIs now have comprehensive test coverage, standardized error handling, complete documentation, and enhanced observability. The next session (Week 9) will focus on completing the admin APIs with the same level of quality and addressing remaining test failures.

---

## Current Status Summary

### ✅ Completed in Week 8 Session (Just Finished)

1. **API Unit Tests** - COMPLETE ✅
   - ✅ Created `tests/api/instructor/assignments.test.ts` with 14 comprehensive tests
   - ✅ Created `tests/api/instructor/grading.test.ts` with 12 comprehensive tests
   - ✅ All 26 new tests passing (100% pass rate for new tests)
   - ✅ Total test coverage: 598/603 (99.2%)

2. **Custom Error Handling** - COMPLETE ✅
   - ✅ Created `lib/errors/api-errors.ts` with 8 custom error classes
   - ✅ NotFoundError, ValidationError, ConflictError, RateLimitError, etc.
   - ✅ Standardized error responses across all instructor routes
   - ✅ Proper HTTP status codes (400/401/403/404/409/429/500)
   - ✅ Helper functions: `isApiError()`, `formatErrorResponse()`

3. **API Documentation** - COMPLETE ✅
   - ✅ Created `docs/api/instructor-apis.md` (772 lines)
   - ✅ Documented all 6 assignment endpoints with examples
   - ✅ Documented all 3 grading endpoints with examples
   - ✅ Request/response examples, error codes, authentication requirements
   - ✅ Best practices and complete workflow examples

4. **Structured Logging & Observability** - COMPLETE ✅
   - ✅ Added unique request IDs (UUID) for distributed tracing
   - ✅ Structured log format: `[requestId] METHOD /path - Status (duration)`
   - ✅ Enhanced monitoring metrics with success/error status
   - ✅ Contextual logging for validation failures, auth failures, not-found errors
   - ✅ Performance monitoring with duration tracking

### 📊 Current Test Status

- **Test Pass Rate:** 99.2% (598/603 passing)
- **Improvement:** +27 tests from Week 7 (was 571/577)
- **Failing Tests:** 5 (all expected, unrelated to instructor API work)
  - 5 student workflow tests (citations, collaboration features not yet implemented)

### 🎯 Week 8 Success Criteria - ALL MET ✅

- ✅ API unit tests created and passing (26+ tests)
- ✅ Custom error types implemented and used in all routes
- ✅ API documentation created with examples
- ✅ Enhanced logging added to all endpoints
- ✅ All existing tests still passing (598/603)
- ✅ Build succeeds with no errors
- ✅ No new linting issues

---

## Next Session Focus: Batch 2, Week 9 - Admin API Enhancement

### Priority: HIGH
**Goal:** Apply the same quality improvements to admin APIs that were done for instructor APIs

### Estimated Time: 4-6 hours

---

## Tasks for Week 9

### 1. Create Admin API Unit Tests (2-3 hours)

**Files to Create:**
- `tests/api/admin/users.test.ts`
- `tests/api/admin/licenses.test.ts`
- `tests/api/admin/audit-logs.test.ts`

**Test Coverage Needed:**

#### User Management API Tests
```typescript
describe('Admin User API', () => {
  describe('POST /api/admin/users', () => {
    it('should create user with valid data')
    it('should validate email format')
    it('should reject invalid role')
    it('should handle duplicate email')
  })
  
  describe('GET /api/admin/users/[id]', () => {
    it('should return user by id')
    it('should return 404 for non-existent user')
  })
  
  describe('PATCH /api/admin/users/[id]', () => {
    it('should update user fields')
    it('should handle status changes (ACTIVE/SUSPENDED/DELETED)')
    it('should return 404 for non-existent user')
  })
  
  describe('DELETE /api/admin/users/[id]', () => {
    it('should soft delete user')
    it('should update status to DELETED')
    it('should return 404 for non-existent user')
  })
})
```

#### License Management API Tests
```typescript
describe('Admin License API', () => {
  describe('POST /api/admin/licenses', () => {
    it('should create license with valid data')
    it('should validate seats > 0')
    it('should validate expiration date in future')
    it('should validate institution ID')
  })
  
  describe('GET /api/admin/licenses/[id]', () => {
    it('should return license by id')
    it('should return 404 for non-existent license')
  })
  
  describe('PATCH /api/admin/licenses/[id]', () => {
    it('should update license fields')
    it('should handle status changes')
    it('should validate usedSeats <= seats')
  })
})
```

#### Audit Log API Tests
```typescript
describe('Admin Audit Log API', () => {
  describe('GET /api/admin/audit-logs', () => {
    it('should return paginated audit logs')
    it('should filter by userId')
    it('should filter by action')
    it('should filter by severity')
    it('should filter by date range')
  })
  
  describe('POST /api/admin/audit-logs', () => {
    it('should create audit log entry')
    it('should validate required fields')
    it('should capture IP address and user agent')
  })
})
```

**Implementation Pattern:**
```typescript
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../lib/db/client'
import { UserRepository, LicenseRepository, AuditLogRepository } from '../../../lib/db/repositories'

describe('Admin User API Tests', () => {
  const userRepo = new UserRepository()
  let testUserId: string

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  it('should create user with valid data', async () => {
    const userData = {
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
    }

    const user = await userRepo.create(userData)

    expect(user).toBeDefined()
    expect(user.email).toBe('admin@test.com')
    expect(user.role).toBe('ADMIN')
    expect(user.status).toBe('ACTIVE')
  })
})
```

---

### 2. Apply Error Handling to Admin APIs (1-2 hours)

**Files to Modify:**
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/licenses/[id]/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/branding/[institutionId]/route.ts`

**Refactoring Pattern:**

Use the existing `lib/errors/api-errors.ts` custom error classes:

```typescript
// Before
if (!user) {
  return NextResponse.json(
    { error: 'User not found' },
    { status: 404 }
  )
}

// After
import { NotFoundError, formatErrorResponse } from '@/lib/errors/api-errors'

if (!user) {
  throw new NotFoundError('User', params.id)
}

// In catch block
catch (error) {
  const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
  return NextResponse.json(
    { 
      success: false,
      error: errorMessage,
      ...(details && { details }),
    },
    { status: statusCode }
  )
}
```

**Expected Changes:**
- Replace all inline error responses with custom error throws
- Use `formatErrorResponse()` in all catch blocks
- Add proper error types for all failure scenarios
- Maintain consistent error response structure

---

### 3. Add Admin API Documentation (1 hour)

**File to Create:**
- `docs/api/admin-apis.md`

**Documentation Structure:**

```markdown
# Admin API Documentation

## Table of Contents
- [User Management](#user-management)
- [License Management](#license-management)
- [Audit Logs](#audit-logs)
- [Branding Configuration](#branding-configuration)
- [Analytics](#analytics)

## User Management

### Create User
`POST /api/admin/users`

**Authentication Required:** Yes (Admin or Institution Admin)
**Rate Limiting:** Yes

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "status": "ACTIVE"
}
```

**Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2025-11-17T10:00:00.000Z"
  }
}
```

[Continue for all endpoints...]
```

**Include:**
- All user management endpoints (CRUD)
- All license management endpoints
- All audit log endpoints
- Branding configuration endpoints
- Error response documentation
- Authentication and authorization details
- Rate limiting information

---

### 4. Add Logging & Observability to Admin APIs (1 hour)

**Files to Modify:**
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/licenses/[id]/route.ts`
- `app/api/admin/audit-logs/route.ts`
- All other admin API routes

**Enhancement Pattern:**

```typescript
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/users/${params.id} - Request started`)
    
    // ... existing auth and rate limiting ...
    
    console.log(`[${requestId}] Fetching user: ${params.id}`)
    
    const user = await userRepo.findById(params.id)
    
    if (!user) {
      console.warn(`[${requestId}] User not found: ${params.id}`)
      throw new NotFoundError('User', params.id)
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/users/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${params.id}`,
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/users/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/admin/users/${params.id}`,
      method: 'GET',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${params.id}`,
      method: 'GET',
      status: 'error',
      requestId,
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { success: false, error: errorMessage, ...(details && { details }) },
      { status: statusCode }
    )
  }
}
```

**Add to All Routes:**
- Request ID generation (UUID)
- Request start logging
- Operation logging (fetch, update, delete, etc.)
- Success/error logging with duration
- Enhanced monitoring metrics with requestId and status
- Contextual logging for validation failures, not found, conflicts

---

### 5. Address Remaining Test Failures (Optional - 1-2 hours)

**Current Failing Tests:**
- 5 student workflow tests (citations, collaboration features)

These are features that haven't been implemented yet. If time permits:

**Option A: Stub Out Features**
Create minimal implementations to make tests pass:
- Add basic citation management
- Add basic collaboration features

**Option B: Skip Tests**
Mark tests as skipped with proper documentation:
```typescript
it.skip('should add citations to document', async () => {
  // TODO: Implement citation management feature
  // Related to Phase X, Week Y
})
```

**Option C: Document as Known Issues**
Update README or create KNOWN_ISSUES.md to track these as future work.

---

## Testing Strategy

### Run Tests After Each Task

```bash
# Run specific test file
npm run test -- tests/api/admin/users.test.ts

# Run all admin API tests
npm run test -- tests/api/admin/

# Run all tests
npm run test:run

# Run instructor E2E tests (should still pass)
npm run test -- tests/e2e/instructor-workflow.test.ts

# Build to verify no TypeScript errors
npm run build

# Lint to check code quality
npm run lint
```

### Expected Results After Week 9
- Test pass rate: 99%+ (20+ new admin API tests)
- All admin APIs using custom error handling
- Complete admin API documentation
- Enhanced logging on all admin endpoints
- Build: Successful
- Lint: No new issues

---

## Success Criteria for Week 9

- [ ] Admin API unit tests created and passing (20+ tests)
- [ ] Custom error handling applied to all admin routes
- [ ] Admin API documentation created with examples
- [ ] Enhanced logging added to all admin endpoints
- [ ] All existing tests still passing (598/603 or better)
- [ ] Build succeeds with no errors
- [ ] No new linting issues
- [ ] Optional: Reduced failing tests (from 5 to fewer)

---

## Files Expected to be Modified/Created in Week 9

**New Files:**
- `tests/api/admin/users.test.ts` (~300 lines)
- `tests/api/admin/licenses.test.ts` (~250 lines)
- `tests/api/admin/audit-logs.test.ts` (~200 lines)
- `docs/api/admin-apis.md` (~800 lines)

**Modified Files:**
- `app/api/admin/users/[id]/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/licenses/[id]/route.ts`
- `app/api/admin/licenses/route.ts`
- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/branding/[institutionId]/route.ts`
- `app/api/admin/analytics/route.ts`

**Total Estimated Changes:** ~1,500-2,000 lines added/modified

---

## Quick Start Commands

```bash
# Start development
npm run dev

# Run all tests
npm run test:run

# Run specific test file
npm run test -- tests/api/admin/users.test.ts

# Build
npm run build

# Lint
npm run lint

# Check test coverage (optional)
npm run test -- --coverage
```

---

## Context for AI Assistant

This is Week 9 of Phase 13 development. Week 8 successfully added comprehensive testing, error handling, documentation, and observability to instructor APIs. Week 9 should apply the same patterns to admin APIs to maintain consistency and quality across the entire API surface.

All code should follow patterns established in Week 8:
- Use existing custom error classes from `lib/errors/api-errors.ts`
- Use repository pattern for all database operations
- Include rate limiting, auth, and monitoring in all routes
- Follow Next.js 15 patterns (async params)
- Use structured logging with request IDs
- Document all endpoints with request/response examples

The goal is to have production-ready, well-tested, documented admin APIs by the end of Week 9, matching the quality level achieved for instructor APIs in Week 8.

---

## Notes

- The custom error handling infrastructure is already in place from Week 8
- Follow the same testing patterns used for instructor APIs
- Documentation structure should mirror `docs/api/instructor-apis.md`
- Logging format should be identical to instructor APIs for consistency
- All admin endpoints require higher-level permissions (admin or institution-admin)
- Focus on maintaining the 99%+ test pass rate achieved in Week 8

---

## Alternative Focus Areas (If Admin APIs are Lower Priority)

If admin API enhancement is not the highest priority, alternative Week 9 focus areas could include:

### Option A: Student API Enhancement
- Create student-facing APIs for submissions
- Add student dashboard endpoints
- Document student workflows

### Option B: Performance Optimization
- Add caching to GET endpoints (Redis/in-memory)
- Optimize database queries with proper indexes
- Add connection pooling configuration
- Performance testing and benchmarking

### Option C: Integration Testing
- Add integration tests for complete workflows
- Test instructor → student → grading flow
- Test admin → license → user flow
- Add API client library

### Option D: Security Hardening
- Add rate limiting per user (not just IP)
- Implement API key authentication
- Add CORS configuration
- Security audit of all endpoints
- Add request signing/validation

Choose the option that best aligns with project priorities and timeline.
