# Next Session Work Instructions - Phase 13 Week 8

**Generated:** November 17, 2025  
**Session Type:** Phase 13 Development - Batch 2 Week 8  
**Current Branch:** `copilot/implement-admin-api-implementation`

---

## Executive Summary

Phase 13 Week 7 is **COMPLETE** ✅. All instructor APIs have been successfully wired to the repository layer with full validation. The next session (Week 8) will focus on testing, documentation, error handling improvements, and addressing remaining test failures.

---

## Current Status Summary

### ✅ Completed in Week 7 Session (Just Finished)

1. **API Validation Layer** - COMPLETE ✅
   - ✅ Added Zod validation schemas for Assignment, Submission, and Grade
   - ✅ All POST/PATCH endpoints validate input before processing
   - ✅ Proper error responses with field-level validation details

2. **Repository Integration** - COMPLETE ✅
   - ✅ Replaced all mock implementations in `lib/instructor-tools.ts`
   - ✅ `createAssignment`, `updateAssignment`, `getAssignment`, `getCourseAssignments` use AssignmentRepository
   - ✅ `gradeSubmission`, `getAssignmentSubmissions`, `getStudentSubmissions` use SubmissionRepository/GradeRepository
   - ✅ Proper type mapping between DB schema (`maxPoints`) and domain model (`points`)

3. **Dynamic API Routes** - COMPLETE ✅
   - ✅ `/api/instructor/assignments/[id]/route.ts` - GET, PATCH, DELETE
   - ✅ `/api/instructor/assignments/[id]/publish/route.ts` - POST
   - ✅ `/api/instructor/grading/[id]/route.ts` - GET, POST, PATCH
   - ✅ All routes include: rate limiting, auth checks, validated inputs, monitoring

4. **Code Quality** - COMPLETE ✅
   - ✅ Build succeeds with no TypeScript errors
   - ✅ No new linting issues introduced
   - ✅ All new code follows existing patterns
   - ✅ Proper error handling with HTTP status codes (400/404/409/500)

### 📊 Current Test Status

- **Test Pass Rate:** 99.1% (572/577 passing)
- **Improvement:** +1 test fixed from Week 6 (was 571/577)
- **Failing Tests:** 5 (all expected, unrelated to instructor API work)
  - 5 student workflow tests (citations, collaboration features not yet implemented)

### 🎯 Week 7 Success Criteria - ALL MET ✅

- ✅ All instructor assignment API endpoints functional
- ✅ All grading API endpoints functional  
- ✅ Input validation with Zod on all POST/PATCH routes
- ✅ All mock data replaced with repository calls
- ✅ E2E tests for instructor workflow still passing (21/21)
- ✅ Build succeeds with no errors
- ✅ No new security vulnerabilities
- ✅ Test pass rate ≥ 99%

---

## Next Session Focus: Batch 2, Week 8 - Testing & Polish

### Priority: MEDIUM
**Goal:** Add comprehensive API tests, improve error handling, and create documentation

### Estimated Time: 4-6 hours

---

## Tasks for Week 8

### 1. Create API Unit Tests (2-3 hours)

**Files to Create:**
- `tests/api/instructor/assignments.test.ts`
- `tests/api/instructor/grading.test.ts`

**Test Coverage Needed:**

#### Assignment API Tests
```typescript
describe('Assignment API', () => {
  describe('POST /api/instructor/assignments', () => {
    it('should create assignment with valid data')
    it('should reject invalid dueDate format')
    it('should reject maxPoints > 1000')
    it('should reject missing instructorId')
    it('should enforce rate limiting')
    it('should require authentication')
  })
  
  describe('GET /api/instructor/assignments/[id]', () => {
    it('should return assignment by id')
    it('should return 404 for non-existent assignment')
    it('should include submissions when requested')
  })
  
  describe('PATCH /api/instructor/assignments/[id]', () => {
    it('should update assignment fields')
    it('should validate partial updates')
    it('should return 404 for non-existent assignment')
  })
  
  describe('POST /api/instructor/assignments/[id]/publish', () => {
    it('should publish unpublished assignment')
    it('should handle already published assignment')
    it('should return 404 for non-existent assignment')
  })
  
  describe('DELETE /api/instructor/assignments/[id]', () => {
    it('should delete assignment')
    it('should return 404 for non-existent assignment')
  })
})
```

#### Grading API Tests
```typescript
describe('Grading API', () => {
  describe('POST /api/instructor/grading/[id]', () => {
    it('should create grade for submission')
    it('should reject duplicate grades (409)')
    it('should validate score <= maxPoints')
    it('should update submission status to GRADED')
    it('should return 404 for non-existent submission')
  })
  
  describe('PATCH /api/instructor/grading/[id]', () => {
    it('should update existing grade')
    it('should return 404 if grade does not exist')
  })
  
  describe('GET /api/instructor/grading/[id]', () => {
    it('should return grade by submission id')
    it('should return 404 if grade not found')
  })
})
```

**Implementation Pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET, PATCH } from '@/app/api/instructor/assignments/[id]/route'
import { AssignmentRepository } from '@/lib/db/repositories'

describe('Assignment [id] API', () => {
  beforeEach(async () => {
    // Clean test data
  })

  it('should validate required fields', async () => {
    const req = new NextRequest('http://localhost/api/instructor/assignments', {
      method: 'POST',
      body: JSON.stringify({
        title: '', // Invalid
        instructorId: 'test-instructor',
      }),
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
    expect(data.details.title).toBeDefined()
  })
})
```

---

### 2. Improve Error Handling (1-2 hours)

**Add Custom Error Types**

Create `lib/errors/api-errors.ts`:
```typescript
export class NotFoundError extends Error {
  statusCode = 404
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  statusCode = 400
  details: Record<string, string[]>
  constructor(message: string, details: Record<string, string[]>) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class ConflictError extends Error {
  statusCode = 409
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class AuthorizationError extends Error {
  statusCode = 403
  constructor(message: string = 'Not authorized to perform this action') {
    super(message)
    this.name = 'AuthorizationError'
  }
}
```

**Refactor Route Handlers to Use Custom Errors**

Example for `assignments/[id]/route.ts`:
```typescript
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // ... auth checks ...
    
    const assignment = await assignmentRepo.findById(params.id)
    if (!assignment) {
      throw new NotFoundError('Assignment', params.id)
    }
    
    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    // ... other error types ...
    
    // Unknown error
    monitoring.trackError(error as Error, { endpoint: '/api/instructor/assignments/[id]' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 3. Add API Documentation (1 hour)

**Create API Documentation File**

Create `docs/api/instructor-apis.md`:
```markdown
# Instructor API Documentation

## Assignment Management

### Create Assignment
`POST /api/instructor/assignments`

**Request Body:**
```json
{
  "title": "Essay Assignment",
  "description": "Write about climate change",
  "instructorId": "user_123",
  "courseId": "course_456",
  "dueDate": "2025-12-31T23:59:59Z",
  "maxPoints": 100,
  "rubric": { "criteria1": 40, "criteria2": 60 },
  "requirements": { "minWords": 1000 },
  "published": false
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "assignment_789",
    "title": "Essay Assignment",
    ...
  }
}
```

**Validation Errors:** `400 Bad Request`
```json
{
  "error": "Invalid input",
  "details": {
    "title": ["String must contain at least 1 character(s)"],
    "maxPoints": ["Number must be less than or equal to 1000"]
  }
}
```

[Continue for all endpoints...]
```

---

### 4. Add Logging & Observability (1 hour)

**Enhance Monitoring**

Update routes to log key events:
```typescript
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    console.log(`[${requestId}] POST /api/instructor/assignments - Start`)
    
    // ... existing logic ...
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/instructor/assignments - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/instructor/assignments',
      method: 'POST',
      status: 'success',
    })
    
    return NextResponse.json({ success: true, data: assignment }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/instructor/assignments - Error (${duration}ms)`, error)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/instructor/assignments',
      method: 'POST',
      status: 'error',
    })
    
    // ... error handling ...
  }
}
```

---

### 5. Optional: Performance Optimization (30 min - 1 hour)

**Add Request Caching for GET endpoints**

Example for assignments:
```typescript
import { cache } from '@/lib/cache'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  
  // Check cache first
  const cacheKey = `assignment:${params.id}`
  const cached = await cache.get(cacheKey)
  if (cached) {
    return NextResponse.json({ success: true, data: JSON.parse(cached) })
  }
  
  // Fetch from database
  const assignment = await assignmentRepo.findById(params.id)
  
  // Cache for 5 minutes
  if (assignment) {
    await cache.set(cacheKey, JSON.stringify(assignment), 300)
  }
  
  // ... rest of logic ...
}
```

**Add Database Query Optimization**

Check for N+1 queries in repositories and add `include` statements where needed.

---

## Testing Strategy

### Run Tests After Each Task
```bash
# Run specific test file
npm run test -- tests/api/instructor/assignments.test.ts

# Run all tests
npm run test:run

# Run instructor E2E tests (should still pass)
npm run test -- tests/e2e/instructor-workflow.test.ts

# Build to verify no TypeScript errors
npm run build

# Lint to check code quality
npm run lint
```

### Expected Results After Week 8
- Test pass rate: 99%+ (same or better than current 572/577)
- New API tests: 20+ tests covering all endpoints
- All instructor E2E tests: 21/21 passing
- Build: Successful
- Lint: No new issues

---

## Success Criteria for Week 8

- [ ] API unit tests created and passing (20+ tests)
- [ ] Custom error types implemented and used in all routes
- [ ] API documentation created with examples
- [ ] Enhanced logging added to all endpoints
- [ ] All existing tests still passing (572/577 or better)
- [ ] Build succeeds with no errors
- [ ] No new linting issues
- [ ] Optional: Caching implemented for GET endpoints

---

## Files Modified in Week 7 (For Reference)

**New Files Created:**
- `app/api/instructor/assignments/[id]/route.ts` - 234 lines
- `app/api/instructor/assignments/[id]/publish/route.ts` - 75 lines
- `app/api/instructor/grading/[id]/route.ts` - 265 lines

**Files Modified:**
- `lib/db/validation/schemas.ts` - Added 56 lines (Assignment/Submission/Grade schemas)
- `lib/instructor-tools.ts` - Refactored 192 lines (replaced mocks with repositories)
- `app/api/instructor/assignments/route.ts` - Added 26 lines (validation)
- `app/api/instructor/grading/route.ts` - Added 1 line (import)

**Total Changes:** 849 lines added, 55 lines removed

---

## Known Issues & Notes

### Current Test Failures (Not Related to Week 7 Work)
All 5 failing tests are in student workflow (citation/collaboration features):
- `tests/e2e/student-workflow.test.ts` - Citation Management (3 tests)
- `tests/e2e/student-workflow.test.ts` - Document Export (1 test)
- `tests/e2e/student-workflow.test.ts` - Collaboration Features (1 test)

These features are part of Batch 1 work and not blocking Week 8 tasks.

### Type Mapping Notes
The Assignment domain model uses `points` but the database schema uses `maxPoints`. This is intentional to align with the existing `Assignment` interface in `lib/types/institutional.ts`. The instructor-tools functions handle the mapping.

---

## Quick Start Commands

```bash
# Start development
npm run dev

# Run all tests
npm run test:run

# Run specific test file
npm run test -- tests/api/instructor/assignments.test.ts

# Build
npm run build

# Lint
npm run lint

# Check test coverage (optional)
npm run test -- --coverage
```

---

## Context for AI Assistant

This is Week 8 of Phase 13 development. Week 7 focused on wiring instructor APIs to repositories with validation, which is now complete. Week 8 should focus on:

1. **Testing** - Add unit tests for all new API endpoints
2. **Error Handling** - Create custom error types and improve error responses
3. **Documentation** - Document API endpoints with request/response examples
4. **Observability** - Add logging and monitoring
5. **Optional Polish** - Caching, performance optimization

All code should follow patterns established in Week 7:
- Use Zod for validation
- Use custom error types for consistent error handling
- Include rate limiting, auth, and monitoring in all routes
- Follow Next.js 15 patterns (async params)
- Use repositories for all database operations

The goal is to have production-ready, well-tested, documented instructor APIs by the end of Week 8.
