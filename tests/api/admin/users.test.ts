/**
 * Admin User API Unit Tests
 * 
 * Tests for admin user management API endpoints
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../lib/db/client'
import { UserRepository } from '../../../lib/db/repositories'

describe('Admin User API Tests', () => {
  const userRepo = new UserRepository()
  let testUserId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('User Creation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: `admin-${Date.now()}@test.edu`,
        name: 'Admin User',
        role: 'ADMIN' as const,
      }

      const user = await userRepo.create(userData)

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe('Admin User')
      expect(user.role).toBe('ADMIN')
      expect(user.status).toBe('ACTIVE')
      testUserId = user.id
    })

    it('should create user with default role and status', async () => {
      const userData = {
        email: `user-${Date.now()}@test.edu`,
        name: 'Regular User',
      }

      const user = await userRepo.create(userData)

      expect(user).toBeDefined()
      expect(user.role).toBe('USER')
      expect(user.status).toBe('ACTIVE')
    })

    it('should validate email uniqueness', async () => {
      const email = `unique-${Date.now()}@test.edu`
      
      await userRepo.create({
        email,
        name: 'First User',
      })

      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 10))

      // Attempting to create another user with same email should fail
      await expect(
        userRepo.create({
          email,
          name: 'Second User',
        })
      ).rejects.toThrow()
    })

    it('should create users with different roles', async () => {
      const instructor = await userRepo.create({
        email: `instructor-${Date.now()}@test.edu`,
        name: 'Instructor User',
        role: 'INSTRUCTOR',
      })

      const admin = await userRepo.create({
        email: `admin-${Date.now()}@test.edu`,
        name: 'Admin User',
        role: 'ADMIN',
      })

      expect(instructor.role).toBe('INSTRUCTOR')
      expect(admin.role).toBe('ADMIN')
    })
  })

  describe('User Retrieval', () => {
    beforeEach(async () => {
      const user = await userRepo.create({
        email: `test-${Date.now()}@test.edu`,
        name: 'Test User',
        role: 'USER',
      })
      testUserId = user.id
    })

    it('should retrieve user by id', async () => {
      const user = await userRepo.findById(testUserId)

      expect(user).toBeDefined()
      expect(user?.id).toBe(testUserId)
    })

    it('should return null for non-existent user', async () => {
      const user = await userRepo.findById('non-existent-id')

      expect(user).toBeNull()
    })

    it('should retrieve user by email', async () => {
      const createdUser = await userRepo.findById(testUserId)
      const user = await userRepo.findByEmail(createdUser!.email)

      expect(user).toBeDefined()
      expect(user?.email).toBe(createdUser?.email)
    })

    it('should list users with pagination', async () => {
      // Create multiple users
      await Promise.all([
        userRepo.create({ email: `user1-${Date.now()}@test.edu`, name: 'User 1' }),
        userRepo.create({ email: `user2-${Date.now()}@test.edu`, name: 'User 2' }),
        userRepo.create({ email: `user3-${Date.now()}@test.edu`, name: 'User 3' }),
      ])

      const result = await userRepo.list({}, { page: 1, perPage: 10 })

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(4) // 3 new + 1 from beforeEach
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })
  })

  describe('User Updates', () => {
    beforeEach(async () => {
      const user = await userRepo.create({
        email: `test-${Date.now()}@test.edu`,
        name: 'Test User',
        role: 'USER',
      })
      testUserId = user.id
    })

    it('should update user fields', async () => {
      const updatedUser = await userRepo.update(testUserId, {
        name: 'Updated Name',
        role: 'INSTRUCTOR',
      })

      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.role).toBe('INSTRUCTOR')
    })

    it('should update user status', async () => {
      const suspendedUser = await userRepo.update(testUserId, {
        status: 'SUSPENDED',
      })

      expect(suspendedUser.status).toBe('SUSPENDED')

      const activeUser = await userRepo.update(testUserId, {
        status: 'ACTIVE',
      })

      expect(activeUser.status).toBe('ACTIVE')
    })

    it('should handle partial updates', async () => {
      const originalUser = await userRepo.findById(testUserId)
      
      const updatedUser = await userRepo.update(testUserId, {
        name: 'Only Name Updated',
      })

      expect(updatedUser.name).toBe('Only Name Updated')
      expect(updatedUser.email).toBe(originalUser?.email)
      expect(updatedUser.role).toBe(originalUser?.role)
    })
  })

  describe('User Deletion', () => {
    beforeEach(async () => {
      const user = await userRepo.create({
        email: `test-${Date.now()}@test.edu`,
        name: 'Test User',
        role: 'USER',
      })
      testUserId = user.id
    })

    it('should soft delete user', async () => {
      const deletedUser = await userRepo.delete(testUserId)

      expect(deletedUser.status).toBe('DELETED')
      
      // User should still exist in database
      const user = await userRepo.findById(testUserId)
      expect(user).toBeDefined()
      expect(user?.status).toBe('DELETED')
    })

    it('should hard delete user', async () => {
      await userRepo.hardDelete(testUserId)

      // User should no longer exist in database
      const user = await userRepo.findById(testUserId)
      expect(user).toBeNull()
    })
  })
})
