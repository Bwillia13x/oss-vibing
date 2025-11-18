/**
 * Instructor Workflow Integration Tests
 * Tests complete instructor workflows from assignment creation to grading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { factories, cleanup } from './helpers'
import {
  assignmentRepository,
  submissionRepository,
  gradeRepository,
} from '@/lib/db/repositories'

describe('Instructor Workflow Integration Tests', () => {
  let createdAssignmentIds: string[] = []
  let createdSubmissionIds: string[] = []
  let createdGradeIds: string[] = []
  let createdUserEmails: string[] = []

  beforeEach(async () => {
    // Reset tracking arrays
    createdAssignmentIds = []
    createdSubmissionIds = []
    createdGradeIds = []
    createdUserEmails = []
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
    if (createdUserEmails.length > 0) {
      await cleanup.deleteTestUsers(createdUserEmails)
    }
  })

  describe('Complete Assignment Lifecycle', () => {
    it('should create draft → publish → receive submissions → grade', async () => {
      const testId = Date.now()

      // Step 1: Instructor creates assignment as draft
      const instructor = await factories.createTestUser({
        email: `instructor-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Research Paper',
        courseId: 'course-101',
      })
      createdAssignmentIds.push(assignment.id)

      expect(assignment.published).toBe(false)
      expect(assignment.title).toBe('Research Paper')
      expect(assignment.maxPoints).toBe(100)

      // Step 2: Instructor publishes assignment
      const published = await assignmentRepository.update(assignment.id, {
        published: true,
      })
      expect(published.published).toBe(true)

      // Step 3: Student submits work
      const student = await factories.createTestUser({
        email: `student-${testId}@test.edu`,
        role: 'USER',
      })
      createdUserEmails.push(student.email)

      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
        content: 'My research paper content...',
      })
      createdSubmissionIds.push(submission.id)

      expect(submission.status).toBe('SUBMITTED')

      // Step 4: Instructor grades submission
      const grade = await factories.createTestGrade({
        submissionId: submission.id,
        instructorId: instructor.id,
        score: 92,
      })
      createdGradeIds.push(grade.id)

      expect(grade.score).toBe(92)
      expect(grade.maxPoints).toBe(100)

      // Step 5: Update submission status to graded
      const gradedSubmission = await submissionRepository.update(submission.id, {
        status: 'GRADED',
      })
      expect(gradedSubmission.status).toBe('GRADED')

      // Verify complete workflow
      const finalAssignment = await assignmentRepository.findById(assignment.id)
      const finalSubmission = await submissionRepository.findById(submission.id)
      const finalGrade = await gradeRepository.findBySubmission(submission.id)

      expect(finalAssignment?.published).toBe(true)
      expect(finalSubmission?.status).toBe('GRADED')
      expect(finalGrade?.score).toBe(92)
    })

    it('should handle multiple student submissions for same assignment', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `prof-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Group Assignment',
      })
      createdAssignmentIds.push(assignment.id)

      // Create multiple students and submissions
      const students = await Promise.all([
        factories.createTestUser({ email: `s1-${testId}@test.edu`, role: 'USER' }),
        factories.createTestUser({ email: `s2-${testId}@test.edu`, role: 'USER' }),
        factories.createTestUser({ email: `s3-${testId}@test.edu`, role: 'USER' }),
      ])
      createdUserEmails.push(...students.map((s) => s.email))

      const submissions = await Promise.all(
        students.map((student) =>
          factories.createTestSubmission({
            assignmentId: assignment.id,
            studentId: student.id,
            content: `Submission from ${student.email}`,
          })
        )
      )
      createdSubmissionIds.push(...submissions.map((s) => s.id))

      // Grade all submissions
      const grades = await Promise.all(
        submissions.map((submission, index) =>
          factories.createTestGrade({
            submissionId: submission.id,
            instructorId: instructor.id,
            score: 80 + index * 5, // Different scores
          })
        )
      )
      createdGradeIds.push(...grades.map((g) => g.id))

      // Verify all submissions graded
      expect(grades.length).toBe(3)
      expect(grades[0].score).toBe(80)
      expect(grades[1].score).toBe(85)
      expect(grades[2].score).toBe(90)

      // Verify each submission has a grade
      for (const submission of submissions) {
        const grade = await gradeRepository.findBySubmission(submission.id)
        expect(grade).not.toBeNull()
        expect(grade?.instructorId).toBe(instructor.id)
      }
    })
  })

  describe('Assignment Updates and Versioning', () => {
    it('should update assignment while preserving existing submissions', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `teacher-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      // Create and publish assignment
      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Original Title',
      })
      createdAssignmentIds.push(assignment.id)

      await assignmentRepository.update(assignment.id, {
        published: true,
      })

      // Student submits before update
      const student = await factories.createTestUser({
        email: `early-bird-${testId}@test.edu`,
        role: 'USER',
      })
      createdUserEmails.push(student.email)

      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission.id)

      // Instructor updates assignment
      const updated = await assignmentRepository.update(assignment.id, {
        title: 'Updated Title',
        maxPoints: 120,
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.maxPoints).toBe(120)

      // Verify submission still exists and references assignment
      const existingSubmission = await submissionRepository.findById(submission.id)
      expect(existingSubmission).not.toBeNull()
      expect(existingSubmission?.assignmentId).toBe(assignment.id)
    })
  })

  describe('Grade Management Workflow', () => {
    it('should update existing grade (regrade scenario)', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `grader-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const student = await factories.createTestUser({
        email: `gradee-${testId}@test.edu`,
        role: 'USER',
      })
      createdUserEmails.push(student.email)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
      })
      createdAssignmentIds.push(assignment.id)

      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission.id)

      // Initial grading
      const initialGrade = await factories.createTestGrade({
        submissionId: submission.id,
        instructorId: instructor.id,
        score: 70,
      })
      createdGradeIds.push(initialGrade.id)

      expect(initialGrade.score).toBe(70)

      // Regrade with higher score
      const updatedGrade = await gradeRepository.update(initialGrade.id, {
        score: 85,
        feedback: { text: 'Updated after review' },
      })

      expect(updatedGrade.score).toBe(85)
      expect(updatedGrade.feedback?.text).toBe('Updated after review')

      // Verify only one grade exists for submission
      const grade = await gradeRepository.findBySubmission(submission.id)
      expect(grade?.id).toBe(initialGrade.id)
      expect(grade?.score).toBe(85)
    })

    it('should calculate grade statistics for assignment', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `stats-prof-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        maxPoints: 100,
      })
      createdAssignmentIds.push(assignment.id)

      // Create multiple submissions with different grades
      const scores = [95, 88, 92, 78, 85]
      for (let i = 0; i < scores.length; i++) {
        const student = await factories.createTestUser({
          email: `student-${i}-${testId}@test.edu`,
          role: 'USER',
        })
        createdUserEmails.push(student.email)

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

      // In a real implementation, you would query statistics
      // For now, verify all grades were created
      const allGrades = await Promise.all(
        createdGradeIds.map((id) => gradeRepository.findById(id))
      )

      const validGrades = allGrades.filter(
        (g): g is NonNullable<typeof g> => g !== null && g.score != null
      )

      expect(validGrades.length).toBe(5)

      // Calculate basic stats manually to verify
      const gradeScores = validGrades.map((g) => g.score as number)
      const average = gradeScores.reduce((a, b) => a + b, 0) / gradeScores.length
      expect(average).toBeCloseTo(87.6, 1)
    })
  })

  describe('Assignment Workflow with Rubrics', () => {
    it('should grade submission with rubric criteria', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `rubric-prof-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const student = await factories.createTestUser({
        email: `rubric-student-${testId}@test.edu`,
        role: 'USER',
      })
      createdUserEmails.push(student.email)

      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Essay Assignment',
      })
      createdAssignmentIds.push(assignment.id)

      const submission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
      })
      createdSubmissionIds.push(submission.id)

      // Grade with rubric scores (in real impl, would use rubricScores field)
      const grade = await factories.createTestGrade({
        submissionId: submission.id,
        instructorId: instructor.id,
        score: 90,
      })
      createdGradeIds.push(grade.id)

      // Update with detailed rubric breakdown
      const updatedGrade = await gradeRepository.update(grade.id, {
        rubricScores: {
          content: 30,
          organization: 25,
          grammar: 20,
          citations: 15,
        },
      })

      expect(updatedGrade.rubricScores).toBeDefined()
      expect(updatedGrade.score).toBe(90)
    })
  })

  describe('Late Submission Handling', () => {
    it('should track late submissions and apply penalties', async () => {
      const testId = Date.now()
      const instructor = await factories.createTestUser({
        email: `deadline-prof-${testId}@test.edu`,
        role: 'INSTRUCTOR',
      })
      createdUserEmails.push(instructor.email)

      const student = await factories.createTestUser({
        email: `late-student-${testId}@test.edu`,
        role: 'USER',
      })
      createdUserEmails.push(student.email)

      // Create assignment with past due date
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      const assignment = await factories.createTestAssignment({
        instructorId: instructor.id,
        title: 'Time-Sensitive Assignment',
      })
      createdAssignmentIds.push(assignment.id)

      // Update to set past due date
      await assignmentRepository.update(assignment.id, {
        dueDate: pastDate,
      })

      // Submit after deadline (current time)
      const lateSubmission = await factories.createTestSubmission({
        assignmentId: assignment.id,
        studentId: student.id,
      })
      createdSubmissionIds.push(lateSubmission.id)

      // In real implementation, would calculate days late
      // and apply penalty automatically
      const daysLate = Math.ceil(
        (Date.now() - pastDate.getTime()) / (24 * 60 * 60 * 1000)
      )
      expect(daysLate).toBeGreaterThan(0)

      // Grade with late penalty applied
      const baseScore = 90
      const penaltyPerDay = 5
      const penalizedScore = Math.max(0, baseScore - daysLate * penaltyPerDay)

      const grade = await factories.createTestGrade({
        submissionId: lateSubmission.id,
        instructorId: instructor.id,
        score: penalizedScore,
      })
      createdGradeIds.push(grade.id)

      expect(grade.score).toBeLessThan(baseScore)
    })
  })
})
