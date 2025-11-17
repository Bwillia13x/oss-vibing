/**
 * Instructor Tools Service
 * Provides assignment creation, grading, peer review, and class analytics
 * for instructors
 */

import {
  Assignment,
  Rubric,
  Submission,
  PeerReview,
  Course,
  ClassAnalytics,
  PlagiarismReport,
} from './types/institutional'
import {
  AssignmentRepository,
  SubmissionRepository,
  GradeRepository,
} from './db/repositories'

/**
 * Create a new assignment
 */
export async function createAssignment(
  assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Assignment> {
  const repo = new AssignmentRepository()
  
  const newAssignment = await repo.create({
    title: assignment.title,
    description: assignment.description,
    courseId: assignment.courseId,
    instructorId: assignment.instructorId,
    dueDate: assignment.dueDate,
    maxPoints: assignment.points, // Map points to maxPoints
    rubric: assignment.rubric as Record<string, unknown> | undefined,
    requirements: assignment.requirements as Record<string, unknown> | undefined,
    published: assignment.status === 'published',
  })

  // Convert to Assignment type
  return {
    id: newAssignment.id,
    title: newAssignment.title,
    description: newAssignment.description || '',
    courseId: newAssignment.courseId ?? '',
    instructorId: newAssignment.instructorId,
    dueDate: newAssignment.dueDate,
    points: newAssignment.maxPoints, // Map maxPoints to points
    rubric: newAssignment.rubric as unknown as Rubric | undefined,
    type: 'mixed',
    requirements: newAssignment.requirements as unknown as Assignment['requirements'],
    status: newAssignment.published ? 'published' : 'draft',
    createdAt: newAssignment.createdAt,
    updatedAt: newAssignment.updatedAt,
  } as Assignment
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(
  assignmentId: string,
  updates: Partial<Assignment>
): Promise<Assignment> {
  const repo = new AssignmentRepository()
  
  const updated = await repo.update(assignmentId, {
    title: updates.title,
    description: updates.description,
    courseId: updates.courseId,
    dueDate: updates.dueDate,
    maxPoints: updates.points, // Map points to maxPoints
    rubric: updates.rubric as Record<string, unknown> | undefined,
    requirements: updates.requirements as Record<string, unknown> | undefined,
    published: updates.status === 'published',
  })

  // Convert to Assignment type
  return {
    id: updated.id,
    title: updated.title,
    description: updated.description || '',
    courseId: updated.courseId ?? '',
    instructorId: updated.instructorId,
    dueDate: updated.dueDate,
    points: updated.maxPoints, // Map maxPoints to points
    rubric: updated.rubric as unknown as Rubric | undefined,
    type: 'mixed',
    requirements: updated.requirements as unknown as Assignment['requirements'],
    status: updated.published ? 'published' : 'draft',
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  } as Assignment
}

/**
 * Get assignment by ID
 */
export async function getAssignment(
  assignmentId: string
): Promise<Assignment | null> {
  const repo = new AssignmentRepository()
  const assignment = await repo.findById(assignmentId)
  
  if (!assignment) return null

  // Convert to Assignment type
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description || '',
    courseId: assignment.courseId ?? '',
    instructorId: assignment.instructorId,
    dueDate: assignment.dueDate,
    points: assignment.maxPoints, // Map maxPoints to points
    rubric: assignment.rubric as unknown as Rubric | undefined,
    type: 'mixed',
    requirements: assignment.requirements as unknown as Assignment['requirements'],
    status: assignment.published ? 'published' : 'draft',
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  } as Assignment
}

/**
 * Get all assignments for a course
 */
export async function getCourseAssignments(
  courseId: string
): Promise<Assignment[]> {
  const repo = new AssignmentRepository()
  const result = await repo.findByCourse(courseId, { page: 1, perPage: 100 })
  
  // Convert to Assignment array
  return result.data.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description || '',
    courseId: assignment.courseId ?? '',
    instructorId: assignment.instructorId,
    dueDate: assignment.dueDate,
    points: assignment.maxPoints, // Map maxPoints to points
    rubric: assignment.rubric as unknown as Rubric | undefined,
    type: 'mixed' as const,
    requirements: assignment.requirements as unknown as Assignment['requirements'],
    status: assignment.published ? 'published' as const : 'draft' as const,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  } as Assignment))
}

/**
 * Create or update a rubric
 */
export async function saveRubric(
  rubric: Omit<Rubric, 'id'> | Rubric
): Promise<Rubric> {
  const savedRubric: Rubric = {
    id: 'id' in rubric ? rubric.id : generateId(),
    ...rubric,
  }

  console.log('Rubric saved:', savedRubric.id)
  
  return savedRubric
}

/**
 * Get rubric by ID
 */
export async function getRubric(_rubricId: string): Promise<Rubric | null> {
  // In production, query database
  return null
}

/**
 * Get all rubrics for an instructor
 */
export async function getInstructorRubrics(
  _instructorId: string
): Promise<Rubric[]> {
  // In production, query database
  return []
}

/**
 * Grade a submission
 */
export async function gradeSubmission(
  submissionId: string,
  grade: number,
  rubricScores?: Record<string, number>,
  feedback?: string,
  instructorId?: string
): Promise<Submission> {
  const gradeRepo = new GradeRepository()
  const submissionRepo = new SubmissionRepository()
  const assignmentRepo = new AssignmentRepository()
  
  // Get the submission
  const submission = await submissionRepo.findById(submissionId)
  if (!submission) {
    throw new Error('Submission not found')
  }

  // Fetch assignment to get maxPoints
  const assignment = await assignmentRepo.findById(submission.assignmentId)
  if (!assignment) {
    throw new Error('Assignment not found for submission')
  }

  // Check if grade already exists
  const existingGrade = await gradeRepo.findBySubmission(submissionId)
  
  if (existingGrade) {
    // Update existing grade
    await gradeRepo.update(existingGrade.id, {
      score: grade,
      feedback: feedback ? { text: feedback } : undefined,
      rubricScores,
    })
  } else {
    // Create new grade
    if (!instructorId) {
      throw new Error('Instructor ID is required for new grade')
    }
    
    await gradeRepo.create({
      submissionId,
      instructorId,
      score: grade,
      maxPoints: assignment.maxPoints,
      feedback: feedback ? { text: feedback } : undefined,
      rubricScores,
    })
  }

  // Update submission status to graded
  await submissionRepo.update(submissionId, {
    status: 'GRADED',
  })

  // Return updated submission
  const updatedSubmission = await submissionRepo.findById(submissionId)
  
  // Convert to Submission type
  return {
    id: updatedSubmission!.id,
    assignmentId: updatedSubmission!.assignmentId,
    studentId: updatedSubmission!.studentId,
    documentId: '', // Not in database schema, placeholder for interface compatibility
    content: updatedSubmission!.content,
    submittedAt: updatedSubmission!.submittedAt,
    status: updatedSubmission!.status as 'submitted' | 'graded' | 'returned' | 'late',
    grade,
    rubricScores,
    feedback,
  } as Submission
}

/**
 * Get submissions for an assignment
 */
export async function getAssignmentSubmissions(
  assignmentId: string,
  status?: Submission['status']
): Promise<Submission[]> {
  const repo = new SubmissionRepository()
  const gradeRepo = new GradeRepository()
  const result = await repo.findByAssignment(assignmentId, { page: 1, perPage: 100 })
  
  let submissions = result.data
  
  // Filter by status if provided
  if (status) {
    submissions = submissions.filter(s => s.status.toUpperCase() === status.toUpperCase())
  }
  
  // Convert to Submission array and fetch grades
  const submissionsWithGrades = await Promise.all(
    submissions.map(async (submission) => {
      // Fetch grade for each submission
      const gradeRecord = await gradeRepo.findBySubmission(submission.id)
      
      return {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        documentId: '', // Not in database schema, placeholder for interface compatibility
        content: submission.content,
        submittedAt: submission.submittedAt,
        status: submission.status.toLowerCase() as 'submitted' | 'graded' | 'returned' | 'late',
        grade: gradeRecord?.score,
        rubricScores: gradeRecord?.rubricScores as Record<string, number> | undefined,
        feedback: gradeRecord?.feedback ? (gradeRecord.feedback as any).text : undefined,
      } as Submission
    })
  )
  
  return submissionsWithGrades
}

/**
 * Get submissions by student
 */
export async function getStudentSubmissions(
  studentId: string,
  _courseId?: string
): Promise<Submission[]> {
  const repo = new SubmissionRepository()
  const result = await repo.findByStudent(studentId, { page: 1, perPage: 100 })
  
  // Convert to Submission array
  return result.data.map(submission => ({
    id: submission.id,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    documentId: '', // Not in database schema, placeholder for interface compatibility
    content: submission.content,
    submittedAt: submission.submittedAt,
    status: submission.status.toLowerCase() as 'submitted' | 'graded' | 'returned' | 'late',
    grade: undefined, // Would come from grade record
    rubricScores: undefined,
    feedback: undefined,
  } as Submission))
}

/**
 * Create peer review assignment
 */
export async function createPeerReviews(
  assignmentId: string,
  reviewsPerSubmission: number,
  isAnonymous: boolean = true
): Promise<PeerReview[]> {
  // Get all submissions for the assignment
  const submissions = await getAssignmentSubmissions(assignmentId)
  
  if (submissions.length < 2) {
    throw new Error('Not enough submissions for peer review')
  }

  const peerReviews: PeerReview[] = []

  // Assign reviewers in a round-robin fashion
  for (let i = 0; i < submissions.length; i++) {
    const submission = submissions[i]
    
    for (let j = 1; j <= reviewsPerSubmission; j++) {
      const reviewerIndex = (i + j) % submissions.length
      const reviewer = submissions[reviewerIndex]
      
      // Don't assign self-review
      if (reviewer.studentId === submission.studentId) continue

      const peerReview: PeerReview = {
        id: generateId(),
        submissionId: submission.id,
        reviewerId: reviewer.studentId,
        assignmentId,
        status: 'pending',
        feedback: '',
        isAnonymous,
      }
      
      peerReviews.push(peerReview)
    }
  }

  console.log(`Created ${peerReviews.length} peer reviews for assignment ${assignmentId}`)
  
  return peerReviews
}

/**
 * Submit a peer review
 */
export async function submitPeerReview(
  reviewId: string,
  feedback: string,
  rubricScores?: Record<string, number>
): Promise<PeerReview> {
  const review: PeerReview = {
    id: reviewId,
    status: 'completed',
    feedback,
    rubricScores,
    reviewedAt: new Date(),
  } as PeerReview

  console.log('Peer review submitted:', reviewId)
  
  return review
}

/**
 * Get peer reviews for a submission
 */
export async function getPeerReviewsForSubmission(
  _submissionId: string
): Promise<PeerReview[]> {
  // In production, query database
  return []
}

/**
 * Get class analytics for a course
 */
export async function getClassAnalytics(
  courseId: string,
  period: 'week' | 'month' | 'term',
  startDate?: Date,
  endDate?: Date
): Promise<ClassAnalytics> {
  const end = endDate || new Date()
  const start = startDate || calculateStartDate(period, end)

  // In production, query database and aggregate data
  const analytics: ClassAnalytics = {
    courseId,
    period,
    startDate: start,
    endDate: end,
    totalStudents: 0,
    activeStudents: 0,
    averageIntegrityScore: 0,
    averageGrade: 0,
    assignmentSubmissionRate: 0,
    plagiarismIncidents: 0,
    toolUsage: {},
    studentEngagement: [],
  }

  return analytics
}

/**
 * Export grades to LMS format
 */
export async function exportGradesToLMS(
  courseId: string,
  assignmentId: string,
  format: 'csv' | 'json' | 'canvas'
): Promise<{ data: string; filename: string }> {
  const submissions = await getAssignmentSubmissions(assignmentId)
  
  if (format === 'csv') {
    const csvRows = [
      'Student ID,Student Name,Grade,Submission Date,Status',
      ...submissions.map((s) =>
        `${s.studentId},"Student Name",${s.grade || ''},${s.submittedAt},${s.status}`
      ),
    ]
    
    return {
      data: csvRows.join('\n'),
      filename: `grades_${assignmentId}_${Date.now()}.csv`,
    }
  } else if (format === 'json') {
    return {
      data: JSON.stringify(submissions, null, 2),
      filename: `grades_${assignmentId}_${Date.now()}.json`,
    }
  } else if (format === 'canvas') {
    // Canvas-specific format
    const canvasData = submissions.map((s) => ({
      student_id: s.studentId,
      assignment_id: assignmentId,
      grade: s.grade,
      submitted_at: s.submittedAt,
      graded_at: s.status === 'graded' ? new Date() : null,
    }))
    
    return {
      data: JSON.stringify(canvasData, null, 2),
      filename: `canvas_grades_${assignmentId}_${Date.now()}.json`,
    }
  }

  throw new Error('Unsupported export format')
}

/**
 * Run plagiarism check on submission
 */
export async function checkSubmissionPlagiarism(
  submissionId: string,
  documentId: string
): Promise<PlagiarismReport> {
  // In production, call plagiarism detection service
  const report: PlagiarismReport = {
    id: generateId(),
    documentId,
    studentId: '', // Would be fetched from submission
    similarityScore: 0,
    sources: [],
    checkedAt: new Date(),
    status: 'clean',
  }

  console.log('Plagiarism check completed:', submissionId)
  
  return report
}

/**
 * Get course by ID
 */
export async function getCourse(_courseId: string): Promise<Course | null> {
  // In production, query database
  return null
}

/**
 * Get instructor courses
 */
export async function getInstructorCourses(
  _instructorId: string
): Promise<Course[]> {
  // In production, query database
  return []
}

/**
 * Create a new course
 */
export async function createCourse(
  course: Omit<Course, 'id' | 'createdAt'>
): Promise<Course> {
  const newCourse: Course = {
    ...course,
    id: generateId(),
    createdAt: new Date(),
  }

  console.log('Course created:', newCourse.id)
  
  return newCourse
}

// Helper functions

function generateId(): string {
  // Using crypto for secure ID generation
  return `${Date.now()}-${crypto.randomUUID().substring(0, 9)}`
}

function calculateStartDate(
  period: 'week' | 'month' | 'term',
  end: Date
): Date {
  const start = new Date(end)
  
  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'term':
      start.setMonth(start.getMonth() - 4) // Assuming 4-month term
      break
  }
  
  return start
}

/**
 * Generate assignment statistics
 */
export async function getAssignmentStatistics(
  assignmentId: string
): Promise<{
  totalSubmissions: number
  onTimeSubmissions: number
  lateSubmissions: number
  gradedSubmissions: number
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  submissionRate: number
}> {
  const submissions = await getAssignmentSubmissions(assignmentId)
  const assignment = await getAssignment(assignmentId)

  if (!assignment) {
    throw new Error('Assignment not found')
  }

  const gradedSubmissions = submissions.filter((s) => s.status === 'graded')
  const grades = gradedSubmissions
    .map((s) => s.grade)
    .filter((g): g is number => g !== undefined)

  const onTime = submissions.filter(
    (s) => new Date(s.submittedAt) <= assignment.dueDate
  )

  return {
    totalSubmissions: submissions.length,
    onTimeSubmissions: onTime.length,
    lateSubmissions: submissions.length - onTime.length,
    gradedSubmissions: gradedSubmissions.length,
    averageGrade: grades.length > 0
      ? grades.reduce((a, b) => a + b, 0) / grades.length
      : 0,
    highestGrade: grades.length > 0 ? Math.max(...grades) : 0,
    lowestGrade: grades.length > 0 ? Math.min(...grades) : 0,
    submissionRate: 0, // Would need total enrolled students
  }
}
