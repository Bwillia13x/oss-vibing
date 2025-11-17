/**
 * Integration Test Helpers
 * Shared utilities for integration testing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Test data factories for creating consistent test data
 */
export const factories = {
  createTestUser: async (overrides?: {
    email?: string
    name?: string
    role?: 'USER' | 'ADMIN' | 'INSTRUCTOR'
  }) => {
    const timestamp = Date.now()
    return await prisma.user.create({
      data: {
        email: overrides?.email || `test-${timestamp}@example.com`,
        name: overrides?.name || `Test User ${timestamp}`,
        role: overrides?.role || 'USER',
      },
    })
  },

  createTestInstitution: async (overrides?: {
    name?: string
    domain?: string
  }) => {
    const timestamp = Date.now()
    return {
      id: `inst-${timestamp}`,
      name: overrides?.name || `Test Institution ${timestamp}`,
      domain: overrides?.domain || `test-${timestamp}.edu`,
      createdAt: new Date(),
    }
  },

  createTestLicense: async (overrides?: {
    institutionId?: string
    seats?: number
    usedSeats?: number
  }) => {
    const timestamp = Date.now()
    return await prisma.license.create({
      data: {
        institutionId: overrides?.institutionId || `inst-${timestamp}`,
        tier: 'ENTERPRISE',
        seats: overrides?.seats || 100,
        usedSeats: overrides?.usedSeats || 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: 'ACTIVE',
      },
    })
  },

  createTestAssignment: async (overrides?: {
    instructorId?: string
    title?: string
    courseId?: string
  }) => {
    const timestamp = Date.now()
    return await prisma.assignment.create({
      data: {
        instructorId: overrides?.instructorId || 'instructor-1',
        courseId: overrides?.courseId || 'course-1',
        title: overrides?.title || `Test Assignment ${timestamp}`,
        description: 'Test assignment description',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        maxPoints: 100,
        status: 'DRAFT',
      },
    })
  },

  createTestSubmission: async (overrides?: {
    assignmentId?: string
    studentId?: string
    content?: string
  }) => {
    return await prisma.submission.create({
      data: {
        assignmentId: overrides?.assignmentId || 'assignment-1',
        studentId: overrides?.studentId || 'student-1',
        content: overrides?.content || 'Test submission content',
        status: 'SUBMITTED',
      },
    })
  },

  createTestGrade: async (overrides?: {
    submissionId?: string
    instructorId?: string
    score?: number
  }) => {
    return await prisma.grade.create({
      data: {
        submissionId: overrides?.submissionId || 'submission-1',
        instructorId: overrides?.instructorId || 'instructor-1',
        score: overrides?.score || 85,
        maxPoints: 100,
        feedback: 'Good work!',
      },
    })
  },
}

/**
 * Cleanup utilities for test teardown
 */
export const cleanup = {
  async deleteTestUsers(emails: string[]) {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: emails,
        },
      },
    })
  },

  async deleteTestLicenses(ids: string[]) {
    await prisma.license.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  },

  async deleteTestAssignments(ids: string[]) {
    await prisma.assignment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  },

  async deleteTestSubmissions(ids: string[]) {
    await prisma.submission.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  },

  async deleteTestGrades(ids: string[]) {
    await prisma.grade.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  },

  async cleanupAll() {
    // Delete in order of dependencies
    await prisma.grade.deleteMany({})
    await prisma.submission.deleteMany({})
    await prisma.assignment.deleteMany({})
    await prisma.license.deleteMany({})
    await prisma.user.deleteMany({})
  },
}

/**
 * Wait utilities for async operations
 */
export const wait = {
  async forCondition(
    condition: () => Promise<boolean>,
    options?: {
      timeout?: number
      interval?: number
    }
  ): Promise<void> {
    const timeout = options?.timeout || 5000
    const interval = options?.interval || 100
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    throw new Error('Condition not met within timeout')
  },

  async forMs(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },
}

/**
 * Mock API client for making requests
 */
export class MockAPIClient {
  private baseUrl = 'http://localhost:3000'

  async get(path: string, headers?: Record<string, string>) {
    // Mock implementation - in real tests, this would make actual HTTP requests
    return {
      status: 200,
      data: {},
    }
  }

  async post(path: string, data: unknown, headers?: Record<string, string>) {
    // Mock implementation
    return {
      status: 201,
      data: {},
    }
  }

  async put(path: string, data: unknown, headers?: Record<string, string>) {
    // Mock implementation
    return {
      status: 200,
      data: {},
    }
  }

  async delete(path: string, headers?: Record<string, string>) {
    // Mock implementation
    return {
      status: 204,
      data: {},
    }
  }
}

export const apiClient = new MockAPIClient()

/**
 * Database helpers
 */
export const db = {
  async seedTestData() {
    // Create test users
    const admin = await factories.createTestUser({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
    })

    const instructor = await factories.createTestUser({
      email: 'instructor@test.com',
      name: 'Instructor User',
      role: 'INSTRUCTOR',
    })

    const student = await factories.createTestUser({
      email: 'student@test.com',
      name: 'Student User',
      role: 'USER',
    })

    return { admin, instructor, student }
  },

  getPrisma() {
    return prisma
  },
}
