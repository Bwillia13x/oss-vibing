/**
 * Student Workflow Integration Tests
 * Tests complete student workflows from viewing assignments to receiving grades
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { factories, cleanup } from './helpers'
import {
  assignmentRepository,
  submissionRepository,
  gradeRepository,
} from '@/lib/db/repositories'

describe('Student Workflow Integration Tests', () => {
  let createdAssignmentIds: string[] = []
  let createdSubmissionIds: string[] = []
  let createdGradeIds: string[] = []
  let createdUserIds: string[] = []

  beforeEach(async () => {
    // Reset tracking arrays
    createdAssignmentIds = []
    createdSubmissionIds = []
    createdGradeIds = []
    createdUserIds = []
  })

  afterEach(async () => {
    // Cleanup in reverse order of dependencies
    if (createdGradeIds.length > 0) {
      await cleanup.deleteTestGrades(createdGradeIds)
    }
    if (createdSubmissionIds.length > 0) {
      await cleanup.deleteTestSubmissions(createdSubmissionIds)
    }
    if (createdAssignmentIds.length > 0) {
      await cleanup.deleteTestAssignments(createdAssignmentIds)
    }
  })

  describe('Complete Submission Workflow', () => {
    it('should view assignment → submit work → receive grade', async () => {
      // Setup: Instructor creates published assignment
      const instructor = await factories.createTestUser({
        email: 'instructor@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Week 1 Essay',
      })
      createdAssignmentIds.push(assignment.id)

      await assignmentRepository.update(assignment.id, {
        status: 'PUBLISHED',
      })

      // Step 1: Student views assignment
      const student = await factories.createTestUser({
        email: 'student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      const viewedAssignment = await assignmentRepository.findById(assignment.id)
      expect(viewedAssignment).not.toBeNull()
      expect(viewedAssignment?.status).toBe('PUBLISHED')
      expect(viewedAssignment?.title).toBe('Week 1 Essay')

      // Step 2: Student creates submission
      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
        content: 'My well-researched essay...',
      })
      createdSubmissionIds.push(submission.id)

      expect(submission.status).toBe('SUBMITTED')
      expect(submission.content).toBe('My well-researched essay...')

      // Step 3: Instructor grades submission
      const grade = await factories.createTestGrade({
        submissionId: submission.id,
        instructorId: instructor.id,
        score: 88,
      })
      createdGradeIds.push(grade.id)

      await submissionRepository.update(submission.id, {
        status: 'GRADED',
      })

      // Step 4: Student views grade
      const studentGrade = await gradeRepository.findBySubmissionId(submission.id)
      expect(studentGrade).not.toBeNull()
      expect(studentGrade?.score).toBe(88)
      expect(studentGrade?.maxPoints).toBe(100)
      expect(studentGrade?.feedback).toBeDefined()

      // Verify complete workflow
      const finalSubmission = await submissionRepository.findById(submission.id)
      expect(finalSubmission?.status).toBe('GRADED')
    })

    it('should handle draft → submit workflow', async () => {
      const instructor = await factories.createTestUser({
        email: 'prof@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'draft-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
      })
      createdAssignmentIds.push(assignment.id)

      await assignmentRepository.update(assignment.id, {
        status: 'PUBLISHED',
      })

      // Create draft submission
      const draft = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
        content: 'Work in progress...',
      })
      createdSubmissionIds.push(draft.id)

      // Update to draft status
      await submissionRepository.update(draft.id, {
        status: 'DRAFT',
      })

      const draftSubmission = await submissionRepository.findById(draft.id)
      expect(draftSubmission?.status).toBe('DRAFT')

      // Update draft content
      await submissionRepository.update(draft.id, {
        content: 'Final complete version...',
      })

      // Submit final version
      const submitted = await submissionRepository.update(draft.id, {
        status: 'SUBMITTED',
      })

      expect(submitted.status).toBe('SUBMITTED')
      expect(submitted.content).toBe('Final complete version...')
    })
  })

  describe('Multiple Assignment Management', () => {
    it('should track submissions across multiple assignments', async () => {
      const instructor = await factories.createTestUser({
        email: 'multi-prof@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'busy-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      // Create multiple assignments
      const assignments = await Promise.all([
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Assignment 1',
        }),
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Assignment 2',
        }),
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Assignment 3',
        }),
      ])
      createdAssignmentIds.push(...assignments.map((a) => a.id))

      // Publish all assignments
      for (const assignment of assignments) {
        await assignmentRepository.update(assignment.id, {
          status: 'PUBLISHED',
        })
      }

      // Student submits to all assignments
      const submissions = await Promise.all(
        assignments.map((assignment, index) =>
          factories.createTestSubmission({
            assignmentId: assignment.id,
            studentId: student.id,
            content: `Submission ${index + 1}`,
          })
        )
      )
      createdSubmissionIds.push(...submissions.map((s) => s.id))

      // Verify all submissions exist
      expect(submissions.length).toBe(3)

      // Verify each submission links to correct assignment
      for (let i = 0; i < submissions.length; i++) {
        expect(submissions[i].assignmentId).toBe(assignments[i].id)
        expect(submissions[i].studentId).toBe(student.id)
      }

      // Grade all submissions
      const grades = await Promise.all(
        submissions.map((submission, index) =>
          factories.createTestGrade({
            submissionId: submission.id,
            instructorId: instructor.id,
            score: 85 + index * 5,
          })
        )
      )
      createdGradeIds.push(...grades.map((g) => g.id))

      // Verify student can retrieve all their grades
      const allGrades = await Promise.all(
        submissions.map((s) => gradeRepository.findBySubmissionId(s.id))
      )

      expect(allGrades.every((g) => g !== null)).toBe(true)
      expect(allGrades.length).toBe(3)
    })
  })

  describe('Submission Updates and Revisions', () => {
    it('should allow resubmission before deadline', async () => {
      const instructor = await factories.createTestUser({
        email: 'flexible-prof@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'revising-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Essay with Revisions',
      })
      createdAssignmentIds.push(assignment.id)

      await assignmentRepository.update(assignment.id, {
        status: 'PUBLISHED',
        dueDate: futureDate,
      })

      // Initial submission
      const initialSubmission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
        content: 'First draft...',
      })
      createdSubmissionIds.push(initialSubmission.id)

      expect(initialSubmission.content).toBe('First draft...')

      // Student revises before deadline
      const revised = await submissionRepository.update(initialSubmission.id, {
        content: 'Improved second draft...',
      })

      expect(revised.content).toBe('Improved second draft...')
      expect(revised.id).toBe(initialSubmission.id) // Same submission, updated

      // Final revision
      const final = await submissionRepository.update(initialSubmission.id, {
        content: 'Final polished version...',
      })

      expect(final.content).toBe('Final polished version...')

      // Verify only one submission exists
      const submission = await submissionRepository.findById(initialSubmission.id)
      expect(submission?.content).toBe('Final polished version...')
    })
  })

  describe('Grade Viewing and Statistics', () => {
    it('should calculate student GPA and statistics', async () => {
      const instructor = await factories.createTestUser({
        email: 'stats-instructor@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'gpa-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      // Create multiple graded assignments
      const scores = [92, 88, 95, 85, 90]
      for (let i = 0; i < scores.length; i++) {
        const assignment = await factories.createTestAssignment({
          instructorId: instructor.id,
          title: `Assignment ${i + 1}`,
        })
        createdAssignmentIds.push(assignment.id)

        await assignmentRepository.update(assignment.id, {
          status: 'PUBLISHED',
        })

        const submission = await factories.createTestSubmission({
          assignmentId: assignment.id,
          studentId: student.id,
        })
        createdSubmissionIds.push(submission.id)

        const grade = await factories.createTestGrade({
          submissionId: submission.id,
          instructorId: instructor.id,
          score: scores[i],
        })
        createdGradeIds.push(grade.id)
      }

      // Calculate statistics (in real impl, would be repository method)
      const allGrades = await Promise.all(
        createdGradeIds.map((id) => gradeRepository.findById(id))
      )

      const validGrades = allGrades.filter((g) => g !== null)
      expect(validGrades.length).toBe(5)

      const gradeScores = validGrades
        .filter((g) => g?.score !== null && g?.score !== undefined)
        .map((g) => g!.score)
      const average = gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length
      const highest = Math.max(...gradeScores)
      const lowest = Math.min(...gradeScores)

      expect(average).toBeCloseTo(90, 1)
      expect(highest).toBe(95)
      expect(lowest).toBe(85)
    })
  })

  describe('Feedback Viewing', () => {
    it('should retrieve detailed feedback with grade', async () => {
      const instructor = await factories.createTestUser({
        email: 'feedback-prof@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'feedback-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
      })
      createdAssignmentIds.push(assignment.id)

      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission.id)

      // Grade with detailed feedback
      const grade = await factories.createTestGrade({
        submissionId: submission.id,
        instructorId: instructor.id,
        score: 87,
      })
      createdGradeIds.push(grade.id)

      const detailedGrade = await gradeRepository.update(grade.id, {
        feedback:
          'Excellent analysis in section 1. Consider expanding your conclusion. Strong use of citations.',
      })

      expect(detailedGrade.feedback).toContain('Excellent analysis')
      expect(detailedGrade.feedback).toContain('conclusion')
      expect(detailedGrade.score).toBe(87)

      // Student retrieves grade with feedback
      const studentView = await gradeRepository.findBySubmissionId(submission.id)
      expect(studentView?.feedback).toBe(detailedGrade.feedback)
      expect(studentView?.score).toBe(87)
    })
  })

  describe('Assignment Status Tracking', () => {
    it('should track pending, submitted, and graded assignments', async () => {
      const instructor = await factories.createTestUser({
        email: 'tracking-prof@test.edu',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(instructor.id)

      const student = await factories.createTestUser({
        email: 'tracking-student@test.edu',
        role: 'USER',
      })
      createdUserIds.push(student.id)

      // Create assignments in different states
      const assignments = await Promise.all([
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Pending Assignment',
        }),
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Submitted Assignment',
        }),
        factories.createTestAssignment({
          instructorId: instructor.id,
          title: 'Graded Assignment',
        }),
      ])
      createdAssignmentIds.push(...assignments.map((a) => a.id))

      // Publish all
      for (const assignment of assignments) {
        await assignmentRepository.update(assignment.id, {
          status: 'PUBLISHED',
        })
      }

      // Submit to assignment 2 and 3
      const submission2 = await factories.createTestSubmission({
        assignmentId: assignments[1].id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission2.id)

      const submission3 = await factories.createTestSubmission({
        assignmentId: assignments[2].id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission3.id)

      // Grade assignment 3
      const grade = await factories.createTestGrade({
        submissionId: submission3.id,
        instructorId: instructor.id,
        score: 90,
      })
      createdGradeIds.push(grade.id)

      await submissionRepository.update(submission3.id, {
        status: 'GRADED',
      })

      // Verify states
      // Assignment 1: Published but no submission (pending)
      // Assignment 2: Submitted but not graded
      const sub2 = await submissionRepository.findById(submission2.id)
      expect(sub2?.status).toBe('SUBMITTED')

      // Assignment 3: Graded
      const sub3 = await submissionRepository.findById(submission3.id)
      expect(sub3?.status).toBe('GRADED')

      const grade3 = await gradeRepository.findBySubmissionId(submission3.id)
      expect(grade3?.score).toBe(90)
    })
  })
})
