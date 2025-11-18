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
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

  // Get all users for the institution (for now, all users)
  // In a real implementation, you'd filter by institutionId
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        lte: end,
      },
    },
    select: {
      id: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })

  const totalUsers = users.length
  const activeUsers = users.filter(
    (u) => u.lastLoginAt && u.lastLoginAt >= start && u.lastLoginAt <= end
  ).length

  // Get documents created in the period
  const documents = await prisma.document.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      type: true,
    },
  })

  // Get citations created in the period
  const citations = await prisma.citation.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
    },
  })

  // Get usage metrics for the period
  const usageMetrics = await prisma.usageMetric.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end,
      },
    },
    select: {
      metric: true,
      value: true,
      userId: true,
    },
  })

  // Aggregate tool usage
  const toolUsage: Record<string, number> = {}
  for (const metric of usageMetrics) {
    if (metric.metric.startsWith('tool_')) {
      const toolName = metric.metric.replace('tool_', '')
      toolUsage[toolName] = (toolUsage[toolName] || 0) + metric.value
    }
  }

  // Calculate average session time from metrics
  const sessionMetrics = usageMetrics.filter((m) => m.metric === 'session_time')
  const averageSessionTime =
    sessionMetrics.length > 0
      ? sessionMetrics.reduce((sum, m) => sum + m.value, 0) / sessionMetrics.length
      : 0

  const analytics: InstitutionAnalytics = {
    institutionId,
    period,
    startDate: start,
    endDate: end,
    totalUsers,
    activeUsers,
    totalDocuments: documents.length,
    totalCitations: citations.length,
    toolUsage,
    popularFeatures: Object.entries(toolUsage)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    averageSessionTime,
  }

  return analytics
}

/**
 * Get student progress for all students or a specific course
 */
export async function getStudentProgress(
  institutionId: string,
  courseId?: string
): Promise<StudentProgress[]> {
  try {
    // Get all users (students)
    // In a real implementation, filter by institutionId and role
    const users = await prisma.user.findMany({
      where: {
        role: 'USER', // Students
      },
      select: {
        id: true,
        documents: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            citations: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    const progressData: StudentProgress[] = []

    for (const user of users) {
      const completedDocuments = user.documents.filter(
        (d) => d.status === 'COMPLETED'
      ).length

      const totalCitations = user.documents.reduce(
        (sum, doc) => sum + doc.citations.length,
        0
      )

      // Calculate integrity score based on citations per document
      const avgCitationsPerDoc =
        user.documents.length > 0 ? totalCitations / user.documents.length : 0
      // Simple integrity score: 100 if avg >= 5 citations, scaled below
      const integrityScore = Math.min(100, Math.round((avgCitationsPerDoc / 5) * 100))

      const lastActivity =
        user.documents.length > 0
          ? new Date(
              Math.max(...user.documents.map((d) => d.updatedAt.getTime()))
            )
          : new Date()

      const progress: StudentProgress = {
        studentId: user.id,
        courseId: courseId,
        assignmentId: undefined,
        documentsCompleted: completedDocuments,
        citationsAdded: totalCitations,
        integrityScore,
        lastActivity,
        milestones: [],
      }

      progressData.push(progress)
    }

    return progressData
  } catch (error) {
    console.error('Error reading student progress:', error)
    return []
  }
}

/**
 * Get plagiarism reports for an institution
 */
export async function getPlagiarismReports(
  institutionId: string,
  status?: 'clean' | 'warning' | 'flagged',
  courseId?: string
): Promise<PlagiarismReport[]> {
  try {
    // Get submissions with plagiarism checks
    // In a real implementation, filter by institutionId
    const submissions = await prisma.submission.findMany({
      where: {
        plagiarismCheck: {
          not: null,
        },
      },
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        plagiarismCheck: true,
        submittedAt: true,
        assignment: {
          select: {
            courseId: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    const reports: PlagiarismReport[] = []

    for (const submission of submissions) {
      if (submission.plagiarismCheck) {
        try {
          const checkData = JSON.parse(submission.plagiarismCheck)
          
          // Determine status from similarity score
          const similarityScore = checkData.similarityScore || 0
          let reportStatus: 'clean' | 'warning' | 'flagged' = 'clean'
          if (similarityScore > 25) {
            reportStatus = 'flagged'
          } else if (similarityScore > 10) {
            reportStatus = 'warning'
          }

          // Filter by status and course if specified
          if (
            (!status || reportStatus === status) &&
            (!courseId || submission.assignment.courseId === courseId)
          ) {
            const report: PlagiarismReport = {
              id: `plagiarism-${submission.id}`,
              documentId: submission.id,
              studentId: submission.studentId,
              courseId: submission.assignment.courseId || undefined,
              assignmentId: submission.assignmentId,
              similarityScore: similarityScore,
              sources: checkData.sources || [],
              checkedAt: submission.submittedAt,
              status: reportStatus,
              reviewedBy: checkData.reviewedBy,
              reviewedAt: checkData.reviewedAt
                ? new Date(checkData.reviewedAt)
                : undefined,
              notes: checkData.notes,
            }

            reports.push(report)
          }
        } catch (error) {
          console.error('Error parsing plagiarism check:', error)
        }
      }
    }

    return reports
  } catch (error) {
    console.error('Error reading plagiarism reports:', error)
    return []
  }
}

/**
 * Track user activity for analytics
 */
export async function trackUserActivity(
  userId: string,
  activity: Partial<UsageAnalytics>
): Promise<void> {
  try {
    // Store each metric as a separate UsageMetric entry
    const timestamp = new Date()

    if (activity.documentsCreated) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'documents_created',
          value: activity.documentsCreated,
          timestamp,
        },
      })
    }

    if (activity.sheetsCreated) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'sheets_created',
          value: activity.sheetsCreated,
          timestamp,
        },
      })
    }

    if (activity.decksCreated) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'decks_created',
          value: activity.decksCreated,
          timestamp,
        },
      })
    }

    if (activity.citationsInserted) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'citations_inserted',
          value: activity.citationsInserted,
          timestamp,
        },
      })
    }

    if (activity.timeSpentMinutes) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'session_time',
          value: activity.timeSpentMinutes,
          timestamp,
        },
      })
    }

    if (activity.exportCount) {
      await prisma.usageMetric.create({
        data: {
          userId,
          metric: 'export_count',
          value: activity.exportCount,
          timestamp,
        },
      })
    }

    // Track individual tools used
    if (activity.toolsUsed) {
      for (const [tool, count] of Object.entries(activity.toolsUsed)) {
        await prisma.usageMetric.create({
          data: {
            userId,
            metric: `tool_${tool}`,
            value: count,
            timestamp,
          },
        })
      }
    }

    console.log('User activity tracked:', { userId, activity })
  } catch (error) {
    console.error('Error tracking user activity:', error)
  }
}

/**
 * Update student progress
 */
export async function updateStudentProgress(
  studentId: string,
  progress: Partial<StudentProgress>
): Promise<void> {
  try {
    // Store progress information as usage metrics
    const timestamp = new Date()

    if (progress.documentsCompleted !== undefined) {
      await prisma.usageMetric.create({
        data: {
          userId: studentId,
          metric: 'documents_completed',
          value: progress.documentsCompleted,
          timestamp,
        },
      })
    }

    if (progress.citationsAdded !== undefined) {
      await prisma.usageMetric.create({
        data: {
          userId: studentId,
          metric: 'citations_added',
          value: progress.citationsAdded,
          timestamp,
        },
      })
    }

    if (progress.integrityScore !== undefined) {
      await prisma.usageMetric.create({
        data: {
          userId: studentId,
          metric: 'integrity_score',
          value: progress.integrityScore,
          timestamp,
        },
      })
    }

    console.log('Student progress updated:', { studentId, progress })
  } catch (error) {
    console.error('Error updating student progress:', error)
  }
}

/**
 * Create or update plagiarism report
 */
export async function savePlagiarismReport(
  report: PlagiarismReport
): Promise<void> {
  try {
    // Store plagiarism report in submission's plagiarismCheck field
    await prisma.submission.update({
      where: { id: report.documentId },
      data: {
        plagiarismCheck: JSON.stringify({
          similarityScore: report.similarityScore,
          sources: report.sources,
          status: report.status,
          reviewedBy: report.reviewedBy,
          reviewedAt: report.reviewedAt,
          notes: report.notes,
        }),
      },
    })

    console.log('Plagiarism report saved:', report.id)
  } catch (error) {
    console.error('Error saving plagiarism report:', error)
  }
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
