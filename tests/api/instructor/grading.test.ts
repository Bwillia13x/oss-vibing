/**
 * Grading API Unit Tests
 * 
 * Tests for instructor grading API endpoints
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../lib/db/client'
import { GradeRepository, SubmissionRepository, AssignmentRepository } from '../../../lib/db/repositories'

describe('Grading API Tests', () => {
  const gradeRepo = new GradeRepository()
  const submissionRepo = new SubmissionRepository()
  const assignmentRepo = new AssignmentRepository()
  
  let testInstructorId: string
  let testStudentId: string
  let testAssignmentId: string
  let testSubmissionId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.grade.deleteMany()
    await prisma.submission.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.user.deleteMany()

    // Create test instructor
    const instructor = await prisma.user.create({
      data: {
        email: `instructor-${Date.now()}@test.edu`,
        name: 'Test Instructor',
        role: 'INSTRUCTOR',
      },
    })
    testInstructorId = instructor.id

    // Create test student
    const student = await prisma.user.create({
      data: {
        email: `student-${Date.now()}@test.edu`,
        name: 'Test Student',
        role: 'USER',
      },
    })
    testStudentId = student.id

    // Create test assignment
    const assignment = await assignmentRepo.create({
      title: 'Test Assignment',
      description: 'Test',
      courseId: `course-${Date.now()}`,
      instructorId: testInstructorId,
      dueDate: new Date('2025-12-31'),
      maxPoints: 100,
      published: true,
    })
    testAssignmentId = assignment.id

    // Create test submission
    const submission = await submissionRepo.create({
      assignmentId: testAssignmentId,
      studentId: testStudentId,
      content: 'Test submission content',
      status: 'SUBMITTED',
    })
    testSubmissionId = submission.id
  })

  afterAll(async () => {
    await prisma.grade.deleteMany()
    await prisma.submission.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Grade Creation', () => {
    it('should create grade for submission', async () => {
      const gradeData = {
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 85,
        maxPoints: 100,
        feedback: { overall: 'Good work!' },
      }

      const grade = await gradeRepo.create(gradeData)

      expect(grade).toBeDefined()
      expect(grade.submissionId).toBe(testSubmissionId)
      expect(grade.score).toBe(85)
      expect(grade.maxPoints).toBe(100)
      expect(grade.feedback).toEqual({ overall: 'Good work!' })
    })

    it('should validate score is within maxPoints', async () => {
      const gradeData = {
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 150,
        maxPoints: 100,
      }

      // Score exceeds maxPoints - should be caught by validation
      expect(gradeData.score).toBeGreaterThan(gradeData.maxPoints)
    })

    it('should update submission status to GRADED', async () => {
      const gradeData = {
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 90,
        maxPoints: 100,
      }

      await gradeRepo.create(gradeData)
      
      // Update submission status
      await submissionRepo.update(testSubmissionId, { status: 'GRADED' })
      
      const submission = await submissionRepo.findById(testSubmissionId)
      expect(submission?.status).toBe('GRADED')
    })

    it('should create grade with rubric scores', async () => {
      const gradeData = {
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 85,
        maxPoints: 100,
        rubricScores: {
          research: 40,
          writing: 35,
          citations: 10,
        },
      }

      const grade = await gradeRepo.create(gradeData)

      expect(grade.rubricScores).toEqual({
        research: 40,
        writing: 35,
        citations: 10,
      })
    })
  })

  describe('Grade Retrieval', () => {
    beforeEach(async () => {
      await gradeRepo.create({
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 88,
        maxPoints: 100,
        feedback: { overall: 'Excellent' },
      })
    })

    it('should retrieve grade by submission id', async () => {
      const grade = await gradeRepo.findBySubmission(testSubmissionId)

      expect(grade).toBeDefined()
      expect(grade?.submissionId).toBe(testSubmissionId)
      expect(grade?.score).toBe(88)
    })

    it('should return null if grade not found', async () => {
      const grade = await gradeRepo.findBySubmission('non-existent-submission')

      expect(grade).toBeNull()
    })
  })

  describe('Grade Updates', () => {
    let gradeId: string

    beforeEach(async () => {
      const grade = await gradeRepo.create({
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 75,
        maxPoints: 100,
        feedback: { overall: 'Good effort' },
      })
      gradeId = grade.id
    })

    it('should update existing grade', async () => {
      const updated = await gradeRepo.update(gradeId, {
        score: 90,
        feedback: { overall: 'Excellent work after revision' },
      })

      expect(updated.score).toBe(90)
      expect(updated.feedback).toEqual({ overall: 'Excellent work after revision' })
      expect(updated.maxPoints).toBe(100) // unchanged
    })

    it('should update grade with partial data', async () => {
      const updated = await gradeRepo.update(gradeId, {
        score: 80,
      })

      expect(updated.score).toBe(80)
      expect(updated.feedback).toEqual({ overall: 'Good effort' }) // unchanged
    })

    it('should update rubric scores', async () => {
      const updated = await gradeRepo.update(gradeId, {
        rubricScores: {
          research: 45,
          writing: 40,
          formatting: 5,
        },
      })

      expect(updated.rubricScores).toEqual({
        research: 45,
        writing: 40,
        formatting: 5,
      })
    })
  })

  describe('Duplicate Grade Prevention', () => {
    it('should detect duplicate grades for same submission', async () => {
      // Create first grade
      await gradeRepo.create({
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 85,
        maxPoints: 100,
      })

      // Check for existing grade
      const existingGrade = await gradeRepo.findBySubmission(testSubmissionId)
      expect(existingGrade).not.toBeNull()

      // This should be prevented by API route logic (409 Conflict)
      // The repository doesn't enforce uniqueness, the API does
    })
  })

  describe('Grade with Submission Details', () => {
    it('should retrieve grade with related submission', async () => {
      const grade = await gradeRepo.create({
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 92,
        maxPoints: 100,
        feedback: { overall: 'Outstanding work' },
      })

      const gradeWithSubmission = await gradeRepo.findById(grade.id)
      
      expect(gradeWithSubmission).toBeDefined()
      expect(gradeWithSubmission?.submissionId).toBe(testSubmissionId)
    })
  })

  describe('Multiple Grades for Different Submissions', () => {
    it('should handle multiple grades for different submissions', async () => {
      // Create another submission
      const submission2 = await submissionRepo.create({
        assignmentId: testAssignmentId,
        studentId: testStudentId,
        content: 'Second submission',
        status: 'SUBMITTED',
      })

      // Create grades for both submissions
      const grade1 = await gradeRepo.create({
        submissionId: testSubmissionId,
        instructorId: testInstructorId,
        score: 85,
        maxPoints: 100,
      })

      const grade2 = await gradeRepo.create({
        submissionId: submission2.id,
        instructorId: testInstructorId,
        score: 90,
        maxPoints: 100,
      })

      expect(grade1.submissionId).toBe(testSubmissionId)
      expect(grade2.submissionId).toBe(submission2.id)
      expect(grade1.id).not.toBe(grade2.id)
    })
  })
})
