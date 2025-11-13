/**
 * Type definitions for Phase 4.2 Institutional Features
 * Includes Admin Dashboard and Instructor Tools types
 */

// User roles for institutional features
export type UserRole = 'student' | 'instructor' | 'admin' | 'institution_admin'

// User with institutional metadata
export interface InstitutionalUser {
  id: string
  email: string
  name: string
  role: UserRole
  institutionId?: string
  department?: string
  createdAt: Date
  lastActiveAt: Date
}

// License management
export interface License {
  id: string
  institutionId: string
  type: 'free' | 'premium' | 'institutional'
  maxSeats: number
  usedSeats: number
  features: string[]
  validUntil: Date
  createdAt: Date
}

// Usage analytics
export interface UsageAnalytics {
  userId: string
  date: Date
  documentsCreated: number
  sheetsCreated: number
  decksCreated: number
  citationsInserted: number
  toolsUsed: Record<string, number>
  timeSpentMinutes: number
  exportCount: number
}

// Aggregated institutional analytics
export interface InstitutionAnalytics {
  institutionId: string
  period: 'day' | 'week' | 'month' | 'year'
  startDate: Date
  endDate: Date
  totalUsers: number
  activeUsers: number
  totalDocuments: number
  totalCitations: number
  toolUsage: Record<string, number>
  popularFeatures: Array<{ feature: string; count: number }>
  averageSessionTime: number
}

// Student progress tracking
export interface StudentProgress {
  studentId: string
  courseId?: string
  assignmentId?: string
  documentsCompleted: number
  citationsAdded: number
  integrityScore: number // 0-100, based on citation coverage and plagiarism checks
  lastActivity: Date
  milestones: Array<{
    name: string
    completedAt: Date
    description: string
  }>
}

// Plagiarism report aggregation
export interface PlagiarismReport {
  id: string
  documentId: string
  studentId: string
  courseId?: string
  assignmentId?: string
  similarityScore: number // 0-100
  sources: Array<{
    url: string
    title: string
    matchPercentage: number
  }>
  checkedAt: Date
  status: 'clean' | 'warning' | 'flagged'
  reviewedBy?: string
  reviewedAt?: Date
  notes?: string
}

// Assignment for instructor tools
export interface Assignment {
  id: string
  courseId: string
  instructorId: string
  title: string
  description: string
  dueDate: Date
  points: number
  rubric?: Rubric
  type: 'essay' | 'report' | 'presentation' | 'spreadsheet' | 'mixed'
  requirements: {
    minWords?: number
    minCitations?: number
    citationStyle?: 'APA' | 'MLA' | 'Chicago'
    plagiarismCheckRequired: boolean
  }
  status: 'draft' | 'published' | 'closed'
  createdAt: Date
  updatedAt: Date
}

// Rubric for grading
export interface Rubric {
  id: string
  name: string
  criteria: Array<{
    id: string
    name: string
    description: string
    points: number
    levels: Array<{
      name: string // e.g., "Excellent", "Good", "Fair", "Poor"
      points: number
      description: string
    }>
  }>
  totalPoints: number
}

// Submission from students
export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  documentId: string
  submittedAt: Date
  status: 'submitted' | 'graded' | 'returned' | 'late'
  grade?: number
  rubricScores?: Record<string, number> // criterion id -> score
  feedback?: string
  plagiarismReport?: PlagiarismReport
  peerReviews?: PeerReview[]
}

// Peer review workflow
export interface PeerReview {
  id: string
  submissionId: string
  reviewerId: string
  assignmentId: string
  status: 'pending' | 'in_progress' | 'completed'
  feedback: string
  rubricScores?: Record<string, number>
  reviewedAt?: Date
  isAnonymous: boolean
}

// Course for class analytics
export interface Course {
  id: string
  institutionId: string
  instructorId: string
  name: string
  code: string
  term: string
  year: number
  enrollmentCount: number
  students: string[] // student IDs
  assignments: string[] // assignment IDs
  createdAt: Date
}

// Class analytics
export interface ClassAnalytics {
  courseId: string
  period: 'week' | 'month' | 'term'
  startDate: Date
  endDate: Date
  totalStudents: number
  activeStudents: number
  averageIntegrityScore: number
  averageGrade: number
  assignmentSubmissionRate: number
  plagiarismIncidents: number
  toolUsage: Record<string, number>
  studentEngagement: Array<{
    studentId: string
    activeMinutes: number
    assignmentsCompleted: number
    lastActive: Date
  }>
}

// Bulk user provisioning
export interface BulkUserProvisionRequest {
  institutionId: string
  users: Array<{
    email: string
    name: string
    role: UserRole
    department?: string
  }>
  licenseType: 'free' | 'premium' | 'institutional'
  sendWelcomeEmail: boolean
}

export interface BulkUserProvisionResult {
  total: number
  successful: number
  failed: number
  errors: Array<{
    email: string
    error: string
  }>
  createdUsers: Array<{
    id: string
    email: string
    name: string
  }>
}

// Custom branding
export interface InstitutionBranding {
  institutionId: string
  logo?: string // URL or base64
  primaryColor: string
  secondaryColor: string
  customDomain?: string
  customWelcomeMessage?: string
  supportEmail: string
  supportUrl?: string
}
