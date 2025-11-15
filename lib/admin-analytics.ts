/**
 * Admin Analytics Service
 * Provides usage analytics, student progress tracking, and reporting
 * for institutional administrators
 */

import {
  InstitutionAnalytics,
  StudentProgress,
  UsageAnalytics,
  PlagiarismReport,
} from './types/institutional'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Mock data storage (in production, this would be a database)
// const ANALYTICS_DIR = join(process.cwd(), 'analytics')
const PROGRESS_DIR = join(process.cwd(), 'progress')
const PLAGIARISM_DIR = join(process.cwd(), 'plagiarism')

/**
 * Get aggregated analytics for an institution
 */
export async function getInstitutionAnalytics(
  institutionId: string,
  period: 'day' | 'week' | 'month' | 'year',
  startDate?: Date,
  endDate?: Date
): Promise<InstitutionAnalytics> {
  // Calculate date range
  const end = endDate || new Date()
  const start = startDate || calculateStartDate(period, end)

  // In production, this would query a database
  // For now, return mock aggregated data
  const analytics: InstitutionAnalytics = {
    institutionId,
    period,
    startDate: start,
    endDate: end,
    totalUsers: 0,
    activeUsers: 0,
    totalDocuments: 0,
    totalCitations: 0,
    toolUsage: {},
    popularFeatures: [],
    averageSessionTime: 0,
  }

  // Aggregate user analytics
  const userAnalytics = await getUserAnalytics(institutionId, start, end)
  
  analytics.totalUsers = userAnalytics.length
  analytics.activeUsers = userAnalytics.filter(
    (ua) => ua.timeSpentMinutes > 0
  ).length

  // Aggregate document and citation counts
  for (const ua of userAnalytics) {
    analytics.totalDocuments +=
      ua.documentsCreated + ua.sheetsCreated + ua.decksCreated
    analytics.totalCitations += ua.citationsInserted
    analytics.averageSessionTime += ua.timeSpentMinutes

    // Aggregate tool usage
    for (const [tool, count] of Object.entries(ua.toolsUsed)) {
      analytics.toolUsage[tool] = (analytics.toolUsage[tool] || 0) + count
    }
  }

  if (userAnalytics.length > 0) {
    analytics.averageSessionTime /= userAnalytics.length
  }

  // Sort and get popular features
  analytics.popularFeatures = Object.entries(analytics.toolUsage)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return analytics
}

/**
 * Get student progress for all students or a specific course
 */
export async function getStudentProgress(
  institutionId: string,
  courseId?: string
): Promise<StudentProgress[]> {
  // In production, query database
  // For now, return mock data structure
  const progressData: StudentProgress[] = []

  try {
    if (existsSync(PROGRESS_DIR)) {
      const files = await readdir(PROGRESS_DIR)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await readFile(join(PROGRESS_DIR, file), 'utf-8')
          const progress: StudentProgress = JSON.parse(content)
          
          // Filter by course if specified
          if (!courseId || progress.courseId === courseId) {
            progressData.push(progress)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading student progress:', error)
  }

  return progressData
}

/**
 * Get plagiarism reports for an institution
 */
export async function getPlagiarismReports(
  institutionId: string,
  status?: 'clean' | 'warning' | 'flagged',
  courseId?: string
): Promise<PlagiarismReport[]> {
  const reports: PlagiarismReport[] = []

  try {
    if (existsSync(PLAGIARISM_DIR)) {
      const files = await readdir(PLAGIARISM_DIR)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await readFile(join(PLAGIARISM_DIR, file), 'utf-8')
          const report: PlagiarismReport = JSON.parse(content)
          
          // Filter by status and course
          if ((!status || report.status === status) &&
              (!courseId || report.courseId === courseId)) {
            reports.push(report)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading plagiarism reports:', error)
  }

  // Sort by date, most recent first
  return reports.sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  )
}

/**
 * Track user activity for analytics
 */
export async function trackUserActivity(
  userId: string,
  activity: Partial<UsageAnalytics>
): Promise<void> {
  // In production, this would write to a database
  // For now, we just log the activity
  console.log('User activity tracked:', { userId, activity })
}

/**
 * Update student progress
 */
export async function updateStudentProgress(
  studentId: string,
  progress: Partial<StudentProgress>
): Promise<void> {
  // In production, update database
  console.log('Student progress updated:', { studentId, progress })
}

/**
 * Create or update plagiarism report
 */
export async function savePlagiarismReport(
  report: PlagiarismReport
): Promise<void> {
  // In production, save to database
  console.log('Plagiarism report saved:', report.id)
}

// Helper functions

function calculateStartDate(
  period: 'day' | 'week' | 'month' | 'year',
  end: Date
): Date {
  const start = new Date(end)
  
  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
  }
  
  return start
}

async function getUserAnalytics(
  _institutionId: string,
  _startDate: Date,
  _endDate: Date
): Promise<UsageAnalytics[]> {
  // In production, query database for user analytics in date range
  // For now, return empty array
  return []
}

/**
 * Generate analytics report
 */
export async function generateAnalyticsReport(
  institutionId: string,
  period: 'week' | 'month' | 'term'
): Promise<{
  analytics: InstitutionAnalytics
  topStudents: StudentProgress[]
  plagiarismSummary: {
    total: number
    clean: number
    warning: number
    flagged: number
  }
}> {
  const analytics = await getInstitutionAnalytics(
    institutionId,
    period === 'term' ? 'month' : period
  )
  
  const studentProgress = await getStudentProgress(institutionId)
  const topStudents = studentProgress
    .sort((a, b) => b.integrityScore - a.integrityScore)
    .slice(0, 10)

  const plagiarismReports = await getPlagiarismReports(institutionId)
  const plagiarismSummary = {
    total: plagiarismReports.length,
    clean: plagiarismReports.filter((r) => r.status === 'clean').length,
    warning: plagiarismReports.filter((r) => r.status === 'warning').length,
    flagged: plagiarismReports.filter((r) => r.status === 'flagged').length,
  }

  return {
    analytics,
    topStudents,
    plagiarismSummary,
  }
}
