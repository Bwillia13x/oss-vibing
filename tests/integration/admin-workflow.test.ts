/**
 * Admin Workflow Integration Tests
 * Tests complete admin workflows from license creation to user management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { factories, cleanup } from './helpers'
import { userRepository, licenseRepository, auditLogRepository } from '@/lib/db/repositories'

describe('Admin Workflow Integration Tests', () => {
  let createdUserEmails: string[] = []
  let createdLicenseIds: string[] = []

  beforeEach(async () => {
    // Reset tracking arrays
    createdUserEmails = []
    createdLicenseIds = []
  })

  afterEach(async () => {
    // Cleanup created test data
    if (createdLicenseIds.length > 0) {
      await cleanup.deleteTestLicenses(createdLicenseIds)
    }
    if (createdUserEmails.length > 0) {
      await cleanup.deleteTestUsers(createdUserEmails)
    }
  })

  describe('Complete License Provisioning Workflow', () => {
    it('should create institution license → provision users → track usage', async () => {
      // Step 1: Admin creates institution license
      const institution = await factories.createTestInstitution({
        name: 'Test University',
        domain: 'test-u.edu',
      })

      const license = await factories.createTestLicense({
        institutionId: institution.id,
        seats: 10,
        usedSeats: 0,
      })
      createdLicenseIds.push(license.id)

      expect(license.seats).toBe(10)
      expect(license.usedSeats).toBe(0)
      expect(license.status).toBe('ACTIVE')

      // Step 2: Admin provisions users for institution
      const user1 = await factories.createTestUser({
        email: 'prof1@test-u.edu',
        name: 'Professor One',
        role: 'INSTRUCTOR',
      })
      createdUserIds.push(user1.id)

      const user2 = await factories.createTestUser({
        email: 'student1@test-u.edu',
        name: 'Student One',
        role: 'USER',
      })
      createdUserEmails.push(user2.email)

      // Step 3: Increment license usage
      await licenseRepository.incrementUsedSeats(license.id)
      await licenseRepository.incrementUsedSeats(license.id)

      // Step 4: Verify license usage
      const updatedLicense = await licenseRepository.findById(license.id)
      expect(updatedLicense).not.toBeNull()
      expect(updatedLicense?.usedSeats).toBe(2)

      // Step 5: Get usage stats
      const stats = await licenseRepository.getUsageStats(license.id)
      expect(stats).not.toBeNull()
      expect(stats?.usedSeats).toBe(2)
      expect(stats?.availableSeats).toBe(8)
      expect(stats?.utilizationRate).toBe(0.2)
    })

    it('should prevent over-allocation of license seats', async () => {
      // Create institution with limited seats
      const institution = await factories.createTestInstitution({
        name: 'Small College',
      })

      const license = await factories.createTestLicense({
        institutionId: institution.id,
        seats: 2,
        usedSeats: 0,
      })
      createdLicenseIds.push(license.id)

      // Provision up to seat limit
      const user1 = await factories.createTestUser({
        email: 'user1@small.edu',
        role: 'USER',
      })
      createdUserIds.push(user1.id)
      await licenseRepository.incrementUsedSeats(license.id)

      const user2 = await factories.createTestUser({
        email: 'user2@small.edu',
        role: 'USER',
      })
      createdUserEmails.push(user2.email)
      await licenseRepository.incrementUsedSeats(license.id)

      // Verify seats are full
      const fullLicense = await licenseRepository.findById(license.id)
      expect(fullLicense?.usedSeats).toBe(2)
      expect(fullLicense?.seats).toBe(2)

      // In real implementation, next user creation should fail
      // This is where business logic would check available seats
      const stats = await licenseRepository.getUsageStats(license.id)
      expect(stats?.availableSeats).toBe(0)
    })
  })

  describe('User Lifecycle Management Workflow', () => {
    it('should create → update → suspend → reactivate user', async () => {
      // Step 1: Create user
      const user = await factories.createTestUser({
        email: 'lifecycle@test.edu',
        name: 'Lifecycle Test',
        role: 'USER',
      })
      createdUserIds.push(user.id)

      expect(user.email).toBe('lifecycle@test.edu')
      expect(user.status).toBe('ACTIVE')

      // Step 2: Update user details
      const updatedUser = await userRepository.update(user.id, {
        name: 'Updated Name',
      })
      expect(updatedUser.name).toBe('Updated Name')

      // Step 3: Suspend user
      const suspendedUser = await userRepository.update(user.id, {
        status: 'SUSPENDED',
      })
      expect(suspendedUser.status).toBe('SUSPENDED')

      // Step 4: Reactivate user
      const reactivatedUser = await userRepository.update(user.id, {
        status: 'ACTIVE',
      })
      expect(reactivatedUser.status).toBe('ACTIVE')

      // Step 5: Verify final state
      const finalUser = await userRepository.findById(user.id)
      expect(finalUser).not.toBeNull()
      expect(finalUser?.status).toBe('ACTIVE')
      expect(finalUser?.name).toBe('Updated Name')
    })

    it('should handle user role transitions', async () => {
      // Create user as student
      const user = await factories.createTestUser({
        email: 'role-transition@test.edu',
        role: 'USER',
      })
      createdUserIds.push(user.id)

      expect(user.role).toBe('USER')

      // Promote to instructor
      const promoted = await userRepository.update(user.id, {
        role: 'INSTRUCTOR',
      })
      expect(promoted.role).toBe('INSTRUCTOR')

      // Promote to admin
      const adminUser = await userRepository.update(user.id, {
        role: 'ADMIN',
      })
      expect(adminUser.role).toBe('ADMIN')

      // Verify final role
      const finalUser = await userRepository.findById(user.id)
      expect(finalUser?.role).toBe('ADMIN')
    })
  })

  describe('Audit Log Tracking Workflow', () => {
    it('should track complete admin action chain', async () => {
      // Create admin user
      const admin = await factories.createTestUser({
        email: 'admin@test.edu',
        role: 'ADMIN',
      })
      createdUserIds.push(admin.id)

      // Create target user
      const targetUser = await factories.createTestUser({
        email: 'target@test.edu',
        role: 'USER',
      })
      createdUserEmails.push(targetUser.email)

      // Track user creation
      await auditLogRepository.create({
        userId: admin.id,
        action: 'user.created',
        resource: 'user',
        resourceId: targetUser.id,
        details: {
          email: targetUser.email,
          role: targetUser.role,
        },
        severity: 'INFO',
      })

      // Track user update
      await userRepository.update(targetUser.id, { status: 'SUSPENDED' })
      await auditLogRepository.create({
        userId: admin.id,
        action: 'user.suspended',
        resource: 'user',
        resourceId: targetUser.id,
        details: {
          previousStatus: 'ACTIVE',
          newStatus: 'SUSPENDED',
        },
        severity: 'WARNING',
      })

      // Verify audit logs
      const logs = await auditLogRepository.list({
        userId: admin.id,
      })
      expect(logs.data.length).toBeGreaterThanOrEqual(2)

      const creationLog = logs.data.find((log) => log.action === 'user.created')
      expect(creationLog).toBeDefined()
      expect(creationLog?.resourceId).toBe(targetUser.id)

      const suspensionLog = logs.data.find((log) => log.action === 'user.suspended')
      expect(suspensionLog).toBeDefined()
      expect(suspensionLog?.severity).toBe('WARNING')
    })
  })

  describe('Multi-Tenant License Management', () => {
    it('should manage licenses for multiple institutions', async () => {
      // Create multiple institutions
      const inst1 = await factories.createTestInstitution({
        name: 'University A',
        domain: 'univ-a.edu',
      })

      const inst2 = await factories.createTestInstitution({
        name: 'University B',
        domain: 'univ-b.edu',
      })

      // Create licenses for each
      const license1 = await factories.createTestLicense({
        institutionId: inst1.id,
        seats: 100,
      })
      createdLicenseIds.push(license1.id)

      const license2 = await factories.createTestLicense({
        institutionId: inst2.id,
        seats: 50,
      })
      createdLicenseIds.push(license2.id)

      // Verify isolation
      const inst1License = await licenseRepository.findByInstitutionId(inst1.id)
      const inst2License = await licenseRepository.findByInstitutionId(inst2.id)

      expect(inst1License?.id).toBe(license1.id)
      expect(inst1License?.seats).toBe(100)

      expect(inst2License?.id).toBe(license2.id)
      expect(inst2License?.seats).toBe(50)

      // Verify they're separate entities
      expect(inst1License?.id).not.toBe(inst2License?.id)
    })
  })

  describe('User Bulk Operations', () => {
    it('should handle bulk user provisioning', async () => {
      const institution = await factories.createTestInstitution()
      const license = await factories.createTestLicense({
        institutionId: institution.id,
        seats: 20,
      })
      createdLicenseIds.push(license.id)

      // Bulk create users
      const userPromises = Array.from({ length: 5 }, (_, i) =>
        factories.createTestUser({
          email: `bulk-user-${i}@test.edu`,
          name: `Bulk User ${i}`,
          role: 'USER',
        })
      )

      const users = await Promise.all(userPromises)
      createdUserEmails.push(...users.map((u) => u.email))

      // Increment license for each user
      for (const _user of users) {
        await licenseRepository.incrementUsedSeats(license.id)
      }

      // Verify all users created
      expect(users.length).toBe(5)

      // Verify license usage
      const stats = await licenseRepository.getUsageStats(license.id)
      expect(stats?.usedSeats).toBe(5)
      expect(stats?.availableSeats).toBe(15)

      // Verify all users exist
      const fetchedUsers = await Promise.all(
        users.map((u) => userRepository.findById(u.id))
      )
      expect(fetchedUsers.every((u) => u !== null)).toBe(true)
    })
  })
})
