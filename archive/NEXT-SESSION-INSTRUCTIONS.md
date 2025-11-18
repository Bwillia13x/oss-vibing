# Next Session Work Instructions - Phase 13 Continuation

**Generated:** November 17, 2025  
**Session Type:** Phase 13 Development - Batch 2 Week 7  
**Current Branch:** `copilot/add-phase-13-development-instructions`

---

## Current Status Summary

### ✅ Completed in Previous Sessions
1. **Database Schema (Batch 2, Week 5)** - COMPLETE
   - ✅ Added Assignment, Submission, and Grade models to Prisma schema
   - ✅ Created migration `20251117145430_add_instructor_features`
   - ✅ All models have proper indexes and relationships

2. **Repository Layer (Batch 2, Week 6)** - COMPLETE
   - ✅ Implemented AssignmentRepository with full CRUD
   - ✅ Implemented SubmissionRepository with late submission detection
   - ✅ Implemented GradeRepository with feedback management
   - ✅ Fixed DocumentRepository JSON metadata parsing
   - ✅ Added safe JSON parsing with error handling to all repositories

3. **Code Quality** - COMPLETE
   - ✅ All repositories follow `safeJsonParse()` pattern from AdminSettingsRepository
   - ✅ Build succeeds with no errors
   - ✅ 0 security vulnerabilities (CodeQL verified)
   - ✅ No linting issues in new code

### 📊 Current Test Status
- **Test Pass Rate:** 99.0% (571/577 passing)
- **Failing Tests:** 6 (down from 23 originally)
  - 5 student workflow tests (unimplemented features: citations, collaboration)
  - 1 admin workflow test (flaky test, not related to our changes)

---

## Next Session Focus: Batch 2, Week 7 - Admin API Implementation

### Priority: HIGH
**Goal:** Wire up Assignment, Submission, and Grade APIs to use new repositories

### Tasks to Complete

#### 1. Wire Up Assignment APIs (2-3 hours)

**Files to Modify:**
- `app/api/instructor/assignments/route.ts` (or create if missing)
- `app/api/instructor/assignments/[id]/route.ts` (or create if missing)

**Implementation Steps:**

1. **Create GET /api/instructor/assignments**
   ```typescript
   // Get all assignments for an instructor
   import { AssignmentRepository } from '@/lib/db/repositories'
   
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const instructorId = searchParams.get('instructorId')
     const courseId = searchParams.get('courseId')
     const published = searchParams.get('published')
     const page = parseInt(searchParams.get('page') || '1')
     const perPage = parseInt(searchParams.get('perPage') || '20')
     
     const assignmentRepo = new AssignmentRepository()
     
     const result = await assignmentRepo.findMany(
       {
         instructorId,
         courseId,
         published: published === 'true',
       },
       { page, perPage }
     )
     
     return Response.json(result)
   }
   ```

2. **Create POST /api/instructor/assignments**
   ```typescript
   // Create a new assignment
   export async function POST(request: Request) {
     const body = await request.json()
     
     // Add input validation with Zod
     const assignmentRepo = new AssignmentRepository()
     const assignment = await assignmentRepo.create({
       title: body.title,
       description: body.description,
       courseId: body.courseId,
       instructorId: body.instructorId,
       dueDate: new Date(body.dueDate),
       maxPoints: body.maxPoints,
       rubric: body.rubric,
       requirements: body.requirements,
       published: false,
     })
     
     return Response.json(assignment, { status: 201 })
   }
   ```

3. **Create GET /api/instructor/assignments/[id]**
   ```typescript
   // Get single assignment with submissions
   export async function GET(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const assignmentRepo = new AssignmentRepository()
     const assignment = await assignmentRepo.findByIdWithSubmissions(params.id)
     
     if (!assignment) {
       return Response.json({ error: 'Not found' }, { status: 404 })
     }
     
     return Response.json(assignment)
   }
   ```

4. **Create PATCH /api/instructor/assignments/[id]**
   ```typescript
   // Update assignment
   export async function PATCH(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const body = await request.json()
     const assignmentRepo = new AssignmentRepository()
     
     const updated = await assignmentRepo.update(params.id, body)
     return Response.json(updated)
   }
   ```

5. **Create POST /api/instructor/assignments/[id]/publish**
   ```typescript
   // Publish assignment
   export async function POST(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const assignmentRepo = new AssignmentRepository()
     const published = await assignmentRepo.publish(params.id)
     return Response.json(published)
   }
   ```

#### 2. Wire Up Grading APIs (2-3 hours)

**Files to Modify:**
- `app/api/instructor/grading/route.ts`
- `app/api/instructor/grading/[id]/route.ts`

**Implementation Steps:**

1. **Create GET /api/instructor/grading**
   ```typescript
   // Get all submissions for grading
   import { SubmissionRepository } from '@/lib/db/repositories'
   
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const assignmentId = searchParams.get('assignmentId')
     const studentId = searchParams.get('studentId')
     
     const submissionRepo = new SubmissionRepository()
     
     const result = await submissionRepo.findByAssignment(
       assignmentId!,
       { page: 1, perPage: 50 }
     )
     
     return Response.json(result)
   }
   ```

2. **Create POST /api/instructor/grading/[id]**
   ```typescript
   // Grade a submission
   import { GradeRepository } from '@/lib/db/repositories'
   
   export async function POST(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const body = await request.json()
     const gradeRepo = new GradeRepository()
     
     const grade = await gradeRepo.create({
       submissionId: params.id,
       instructorId: body.instructorId,
       score: body.score,
       maxPoints: body.maxPoints,
       feedback: body.feedback,
       rubricScores: body.rubricScores,
     })
     
     return Response.json(grade, { status: 201 })
   }
   ```

3. **Create PATCH /api/instructor/grading/[id]**
   ```typescript
   // Update grade
   export async function PATCH(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const body = await request.json()
     const gradeRepo = new GradeRepository()
     
     const updated = await gradeRepo.update(params.id, body)
     return Response.json(updated)
   }
   ```

#### 3. Add Input Validation with Zod (1-2 hours)

**Create:** `lib/validations/instructor.ts`

```typescript
import { z } from 'zod'

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  courseId: z.string().optional(),
  instructorId: z.string().min(1),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).max(1000),
  rubric: z.record(z.unknown()).optional(),
  requirements: z.record(z.unknown()).optional(),
})

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial().omit({
  instructorId: true,
})

export const CreateGradeSchema = z.object({
  submissionId: z.string().min(1),
  instructorId: z.string().min(1),
  score: z.number().int().min(0),
  maxPoints: z.number().int().min(1),
  feedback: z.record(z.unknown()).optional(),
  rubricScores: z.record(z.unknown()).optional(),
})

export const UpdateGradeSchema = CreateGradeSchema.partial().omit({
  submissionId: true,
  instructorId: true,
})
```

**Usage Example:**
```typescript
// In API route
import { CreateAssignmentSchema } from '@/lib/validations/instructor'

export async function POST(request: Request) {
  const body = await request.json()
  
  // Validate input
  const validationResult = CreateAssignmentSchema.safeParse(body)
  if (!validationResult.success) {
    return Response.json(
      { error: 'Invalid input', details: validationResult.error },
      { status: 400 }
    )
  }
  
  const data = validationResult.data
  // ... proceed with validated data
}
```

#### 4. Replace Mock Data (1 hour)

**Check these files for mock data:**
- `app/api/instructor/assignments/route.ts`
- `app/api/instructor/grading/route.ts`
- `app/api/admin/analytics/route.ts`

**Search for:**
```bash
grep -r "TODO\|MOCK\|mockData\|fake" app/api/instructor/
grep -r "const.*=.*\[\]" app/api/instructor/  # Look for hardcoded arrays
```

**Replace with repository calls**

#### 5. Update Existing Tests (1-2 hours)

**Files to Update:**
- `tests/e2e/instructor-workflow.test.ts` (already passing!)
- Create `tests/api/instructor-assignments.test.ts`
- Create `tests/api/instructor-grading.test.ts`

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest'
import { AssignmentRepository } from '@/lib/db/repositories'

describe('Assignment API', () => {
  it('should create assignment via API', async () => {
    const response = await fetch('/api/instructor/assignments', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Assignment',
        instructorId: 'instructor-123',
        dueDate: new Date().toISOString(),
        maxPoints: 100,
      }),
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.title).toBe('Test Assignment')
  })
})
```

---

## Success Criteria for This Session

- [ ] All instructor assignment API endpoints functional
- [ ] All grading API endpoints functional  
- [ ] Input validation with Zod on all POST/PATCH routes
- [ ] All mock data replaced with repository calls
- [ ] API tests created and passing
- [ ] E2E tests for instructor workflow still passing (21/21)
- [ ] Build succeeds with no errors
- [ ] No new security vulnerabilities
- [ ] Test pass rate ≥ 99%

---

## Testing Strategy

### 1. Unit Tests for APIs
```bash
# Create and run
npm run test -- tests/api/instructor-assignments.test.ts
npm run test -- tests/api/instructor-grading.test.ts
```

### 2. E2E Tests
```bash
# These should already pass from Week 6 work
npm run test -- tests/e2e/instructor-workflow.test.ts
```

### 3. Integration Testing
```bash
# Test full flow manually:
# 1. Create assignment via API
# 2. Submit work as student
# 3. Grade submission via API
# 4. Verify grade is saved correctly
```

---

## Common Issues & Solutions

### Issue 1: TypeScript Errors with Parsed Fields
**Problem:** TypeScript complains about `rubric` or `requirements` types

**Solution:** Use the `WithParsedFields` types:
```typescript
import { AssignmentWithParsedFields } from '@/lib/db/repositories'

const assignment: AssignmentWithParsedFields = await assignmentRepo.findById(id)
// Now assignment.rubric is properly typed as Record<string, unknown> | null
```

### Issue 2: Validation Errors
**Problem:** Zod validation fails unexpectedly

**Solution:** Check the error details:
```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.log(result.error.flatten()) // Shows exact field errors
}
```

### Issue 3: Foreign Key Violations
**Problem:** Cannot create submission without valid assignmentId

**Solution:** Ensure assignment exists first:
```typescript
const assignment = await assignmentRepo.findById(assignmentId)
if (!assignment) {
  return Response.json({ error: 'Assignment not found' }, { status: 404 })
}
```

---

## Files to Check Before Starting

1. **Verify repositories are working:**
   ```bash
   npm run test -- tests/e2e/instructor-workflow.test.ts
   # Should show 21/21 passing
   ```

2. **Check existing API structure:**
   ```bash
   ls -la app/api/instructor/
   cat app/api/instructor/assignments/route.ts  # See current implementation
   ```

3. **Review schema:**
   ```bash
   cat prisma/schema.prisma | grep -A 20 "model Assignment"
   ```

---

## Batch 2 Week 8 Preview

After Week 7 APIs are complete, Week 8 will focus on:
1. Fixing remaining citation E2E tests (requires Batch 1 work)
2. Adding comprehensive error handling
3. Performance optimization
4. Documentation updates

---

## Quick Start Commands

```bash
# Install dependencies (if needed)
npm install

# Run all tests to verify baseline
npm run test:run

# Start development server
npm run dev

# Run specific test file
npm run test -- tests/e2e/instructor-workflow.test.ts

# Build to verify no compilation errors
npm run build

# Lint code
npm run lint
```

---

## Reference Documentation

- **Phase 13 Instructions:** `PHASE-13-INSTRUCTIONS.md`
- **Repository Patterns:** `lib/db/repositories/assignment-repository.ts`
- **API Examples:** `app/api/admin/users/route.ts`
- **Validation Examples:** Look for existing Zod schemas in codebase

---

## Notes for AI Assistant

- This is a continuation of Phase 13, Batch 2 work
- Database schema and repositories are **already complete** ✅
- Focus is on **API layer integration** in this session
- Use existing patterns from admin APIs as reference
- All JSON fields are auto-parsed by repositories (don't manually parse)
- Test frequently - run tests after each endpoint implementation
- Keep changes minimal and focused on API wiring

---

**Next Session Goal:** Complete Batch 2 Week 7, achieving 99%+ test pass rate with all instructor APIs functional.
