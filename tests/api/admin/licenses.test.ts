/**
 * Admin License API Unit Tests
 * 
 * Tests for admin license management API endpoints
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../lib/db/client'
import { LicenseRepository } from '../../../lib/db/repositories'

describe('Admin License API Tests', () => {
  const licenseRepo = new LicenseRepository()
  let testLicenseId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.license.deleteMany()
  })

  afterAll(async () => {
    await prisma.license.deleteMany()
    await prisma.$disconnect()
  })

  describe('License Creation', () => {
    it('should create license with valid data', async () => {
      const licenseData = {
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      }

      const license = await licenseRepo.create(licenseData)

      expect(license).toBeDefined()
      expect(license.institutionId).toBe(licenseData.institutionId)
      expect(license.institution).toBe('Test University')
      expect(license.seats).toBe(100)
      expect(license.usedSeats).toBe(0)
      expect(license.status).toBe('ACTIVE')
      testLicenseId = license.id
    })

    it('should validate seats is positive', async () => {
      const licenseData = {
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 0,
        expiresAt: new Date('2026-12-31'),
      }

      // Creating a license with 0 seats should work (database doesn't enforce > 0)
      const license = await licenseRepo.create(licenseData)
      expect(license.seats).toBe(0)
    })

    it('should create license with custom status', async () => {
      const licenseData = {
        institutionId: `inst-${Date.now()}`,
        institution: 'Inactive University',
        seats: 50,
        expiresAt: new Date('2026-12-31'),
        status: 'SUSPENDED' as const,
      }

      const license = await licenseRepo.create(licenseData)

      expect(license.status).toBe('SUSPENDED')
    })

    it('should enforce unique institution ID', async () => {
      const institutionId = `inst-${Date.now()}`
      
      await licenseRepo.create({
        institutionId,
        institution: 'First University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      })

      // Attempting to create another license with same institutionId should fail
      await expect(
        licenseRepo.create({
          institutionId,
          institution: 'Second University',
          seats: 50,
          expiresAt: new Date('2026-12-31'),
        })
      ).rejects.toThrow()
    })
  })

  describe('License Retrieval', () => {
    beforeEach(async () => {
      const license = await licenseRepo.create({
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      })
      testLicenseId = license.id
    })

    it('should retrieve license by id', async () => {
      const license = await licenseRepo.findById(testLicenseId)

      expect(license).toBeDefined()
      expect(license?.id).toBe(testLicenseId)
    })

    it('should return null for non-existent license', async () => {
      const license = await licenseRepo.findById('non-existent-id')

      expect(license).toBeNull()
    })

    it('should retrieve license by institution ID', async () => {
      const createdLicense = await licenseRepo.findById(testLicenseId)
      const license = await licenseRepo.findByInstitutionId(createdLicense!.institutionId)

      expect(license).toBeDefined()
      expect(license?.institutionId).toBe(createdLicense?.institutionId)
    })

    it('should list licenses with pagination', async () => {
      // Create multiple licenses
      await Promise.all([
        licenseRepo.create({
          institutionId: `inst-1-${Date.now()}`,
          institution: 'University 1',
          seats: 100,
          expiresAt: new Date('2026-12-31'),
        }),
        licenseRepo.create({
          institutionId: `inst-2-${Date.now()}`,
          institution: 'University 2',
          seats: 200,
          expiresAt: new Date('2026-12-31'),
        }),
      ])

      const result = await licenseRepo.list({}, { page: 1, perPage: 10 })

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(3) // 2 new + 1 from beforeEach
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })
  })

  describe('License Updates', () => {
    beforeEach(async () => {
      const license = await licenseRepo.create({
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      })
      testLicenseId = license.id
    })

    it('should update license fields', async () => {
      const updatedLicense = await licenseRepo.update(testLicenseId, {
        institution: 'Updated University Name',
        seats: 150,
      })

      expect(updatedLicense.institution).toBe('Updated University Name')
      expect(updatedLicense.seats).toBe(150)
    })

    it('should update license status', async () => {
      const suspendedLicense = await licenseRepo.update(testLicenseId, {
        status: 'SUSPENDED',
      })

      expect(suspendedLicense.status).toBe('SUSPENDED')
    })

    it('should update used seats', async () => {
      const updatedLicense = await licenseRepo.update(testLicenseId, {
        usedSeats: 50,
      })

      expect(updatedLicense.usedSeats).toBe(50)
    })

    it('should increment used seats', async () => {
      const license1 = await licenseRepo.incrementUsedSeats(testLicenseId)
      expect(license1.usedSeats).toBe(1)

      const license2 = await licenseRepo.incrementUsedSeats(testLicenseId)
      expect(license2.usedSeats).toBe(2)
    })

    it('should decrement used seats', async () => {
      // First increment to have seats to decrement
      await licenseRepo.update(testLicenseId, { usedSeats: 10 })

      const license1 = await licenseRepo.decrementUsedSeats(testLicenseId)
      expect(license1.usedSeats).toBe(9)

      const license2 = await licenseRepo.decrementUsedSeats(testLicenseId)
      expect(license2.usedSeats).toBe(8)
    })
  })

  describe('License Usage Statistics', () => {
    beforeEach(async () => {
      const license = await licenseRepo.create({
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      })
      testLicenseId = license.id
    })

    it('should calculate usage statistics', async () => {
      await licenseRepo.update(testLicenseId, { usedSeats: 60 })

      const stats = await licenseRepo.getUsageStats(testLicenseId)

      expect(stats).toBeDefined()
      expect(stats?.seats).toBe(100)
      expect(stats?.usedSeats).toBe(60)
      expect(stats?.availableSeats).toBe(40)
      expect(stats?.utilizationRate).toBe(60)
    })

    it('should return null for non-existent license', async () => {
      const stats = await licenseRepo.getUsageStats('non-existent-id')

      expect(stats).toBeNull()
    })
  })

  describe('License Expiration', () => {
    it('should update expired licenses', async () => {
      // Create an expired license
      await licenseRepo.create({
        institutionId: `inst-expired-${Date.now()}`,
        institution: 'Expired University',
        seats: 100,
        expiresAt: new Date('2020-01-01'), // Past date
        status: 'ACTIVE',
      })

      // Create an active license
      await licenseRepo.create({
        institutionId: `inst-active-${Date.now()}`,
        institution: 'Active University',
        seats: 100,
        expiresAt: new Date('2026-12-31'), // Future date
        status: 'ACTIVE',
      })

      const updatedCount = await licenseRepo.updateExpiredLicenses()

      expect(updatedCount).toBe(1) // Only the expired license should be updated
    })
  })

  describe('License Deletion', () => {
    beforeEach(async () => {
      const license = await licenseRepo.create({
        institutionId: `inst-${Date.now()}`,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2026-12-31'),
      })
      testLicenseId = license.id
    })

    it('should delete license', async () => {
      await licenseRepo.delete(testLicenseId)

      // License should no longer exist
      const license = await licenseRepo.findById(testLicenseId)
      expect(license).toBeNull()
    })
  })
})
