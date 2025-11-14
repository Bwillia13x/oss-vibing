/**
 * Admin API Endpoint Tests
 * 
 * Tests for admin backend APIs:
 * - User management
 * - License management
 * - Branding
 * - Audit logs
 * - Analytics
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '../lib/db/client'
import {
  userRepository,
  licenseRepository,
  adminSettingsRepository,
  auditLogRepository,
  usageMetricRepository,
} from '../lib/db/repositories'

describe('Admin API Integration Tests', () => {
  let testUserId: string
  let testLicenseId: string
  const testInstitutionId = 'test-institution-123'

  beforeAll(async () => {
    // Clean up database before tests
    await prisma.usageMetric.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.license.deleteMany()
    await prisma.adminSettings.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up database after tests
    await prisma.usageMetric.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.license.deleteMany()
    await prisma.adminSettings.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Reset data before each test
    await prisma.usageMetric.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.license.deleteMany()
    await prisma.adminSettings.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('User Management', () => {
    it('should create a user', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.role).toBe('USER')
      expect(user.status).toBe('ACTIVE')
      
      testUserId = user.id
    })

    it('should list users with pagination', async () => {
      // Create multiple users
      await userRepository.create({
        email: 'user1@example.com',
        name: 'User 1',
        role: 'USER',
      })
      await userRepository.create({
        email: 'user2@example.com',
        name: 'User 2',
        role: 'INSTRUCTOR',
      })
      await userRepository.create({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      })

      const result = await userRepository.list({}, { page: 1, perPage: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.totalPages).toBe(2)
      expect(result.page).toBe(1)
    })

    it('should filter users by role', async () => {
      await userRepository.create({
        email: 'instructor1@example.com',
        name: 'Instructor 1',
        role: 'INSTRUCTOR',
      })
      await userRepository.create({
        email: 'instructor2@example.com',
        name: 'Instructor 2',
        role: 'INSTRUCTOR',
      })
      await userRepository.create({
        email: 'student@example.com',
        name: 'Student',
        role: 'USER',
      })

      const result = await userRepository.list({ role: 'INSTRUCTOR' }, { page: 1, perPage: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.data.every(u => u.role === 'INSTRUCTOR')).toBe(true)
    })

    it('should update a user', async () => {
      const user = await userRepository.create({
        email: 'update@example.com',
        name: 'Original Name',
        role: 'USER',
      })

      const updated = await userRepository.update(user.id, {
        name: 'Updated Name',
        role: 'INSTRUCTOR',
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.role).toBe('INSTRUCTOR')
      expect(updated.email).toBe('update@example.com') // unchanged
    })

    it('should soft delete a user', async () => {
      const user = await userRepository.create({
        email: 'delete@example.com',
        name: 'To Delete',
        role: 'USER',
      })

      const deleted = await userRepository.delete(user.id)

      expect(deleted.status).toBe('DELETED')
      expect(deleted.email).toBe('delete@example.com')

      // Should still be able to find it
      const found = await userRepository.findById(user.id)
      expect(found?.status).toBe('DELETED')
    })

    it('should find user by email', async () => {
      const created = await userRepository.create({
        email: 'find@example.com',
        name: 'Find Me',
        role: 'USER',
      })

      const found = await userRepository.findByEmail('find@example.com')

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.email).toBe('find@example.com')
    })
  })

  describe('License Management', () => {
    it('should create a license', async () => {
      const license = await licenseRepository.create({
        institutionId: testInstitutionId,
        institution: 'Test University',
        seats: 100,
        expiresAt: new Date('2025-12-31'),
      })

      expect(license).toBeDefined()
      expect(license.institutionId).toBe(testInstitutionId)
      expect(license.seats).toBe(100)
      expect(license.usedSeats).toBe(0)
      expect(license.status).toBe('ACTIVE')
      
      testLicenseId = license.id
    })

    it('should find license by institution ID', async () => {
      const created = await licenseRepository.create({
        institutionId: 'inst-456',
        institution: 'Another University',
        seats: 50,
        expiresAt: new Date('2025-12-31'),
      })

      const found = await licenseRepository.findByInstitutionId('inst-456')

      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.institution).toBe('Another University')
    })

    it('should increment used seats', async () => {
      const license = await licenseRepository.create({
        institutionId: 'inst-789',
        institution: 'Seat Test University',
        seats: 10,
        expiresAt: new Date('2025-12-31'),
      })

      await licenseRepository.incrementUsedSeats(license.id)
      await licenseRepository.incrementUsedSeats(license.id)

      const updated = await licenseRepository.findById(license.id)
      expect(updated?.usedSeats).toBe(2)
    })

    it('should get usage statistics', async () => {
      const license = await licenseRepository.create({
        institutionId: 'inst-stats',
        institution: 'Stats University',
        seats: 100,
        expiresAt: new Date('2025-12-31'),
      })

      // Use some seats
      await licenseRepository.incrementUsedSeats(license.id)
      await licenseRepository.incrementUsedSeats(license.id)
      await licenseRepository.incrementUsedSeats(license.id)

      const stats = await licenseRepository.getUsageStats(license.id)

      expect(stats).toBeDefined()
      expect(stats?.seats).toBe(100)
      expect(stats?.usedSeats).toBe(3)
      expect(stats?.availableSeats).toBe(97)
      expect(stats?.utilizationRate).toBe(3)
    })

    it('should update a license', async () => {
      const license = await licenseRepository.create({
        institutionId: 'inst-update',
        institution: 'Update University',
        seats: 50,
        expiresAt: new Date('2025-12-31'),
      })

      const updated = await licenseRepository.update(license.id, {
        seats: 100,
        status: 'SUSPENDED',
      })

      expect(updated.seats).toBe(100)
      expect(updated.status).toBe('SUSPENDED')
    })

    it('should list licenses with pagination', async () => {
      await licenseRepository.create({
        institutionId: 'inst-1',
        institution: 'University 1',
        seats: 50,
        expiresAt: new Date('2025-12-31'),
      })
      await licenseRepository.create({
        institutionId: 'inst-2',
        institution: 'University 2',
        seats: 100,
        expiresAt: new Date('2025-12-31'),
      })

      const result = await licenseRepository.list({}, { page: 1, perPage: 10 })

      expect(result.data.length).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Admin Settings (Branding)', () => {
    it('should set and get admin settings', async () => {
      const branding = {
        institutionId: 'test-inst',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        logo: 'https://example.com/logo.png',
        supportEmail: 'support@example.edu',
      }

      await adminSettingsRepository.set('branding.test-inst', branding, 'branding')

      const retrieved = await adminSettingsRepository.get('branding.test-inst')

      expect(retrieved).toBeDefined()
      expect(retrieved).toEqual(branding)
    })

    it('should update existing settings', async () => {
      const key = 'branding.update-test'
      const initial = {
        institutionId: 'update-inst',
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
      }

      await adminSettingsRepository.set(key, initial, 'branding')

      const updated = {
        ...initial,
        primaryColor: '#ff0000',
      }

      await adminSettingsRepository.set(key, updated, 'branding')

      const retrieved = await adminSettingsRepository.get(key)

      expect(retrieved?.primaryColor).toBe('#ff0000')
      expect(retrieved?.secondaryColor).toBe('#ffffff')
    })

    it('should return null for non-existent settings', async () => {
      const retrieved = await adminSettingsRepository.get('non-existent-key')

      expect(retrieved).toBeNull()
    })

    it('should get settings by category', async () => {
      await adminSettingsRepository.set('branding.inst-1', { color: 'red' }, 'branding')
      await adminSettingsRepository.set('branding.inst-2', { color: 'blue' }, 'branding')
      await adminSettingsRepository.set('general.feature', { enabled: true }, 'general')

      const brandingSettings = await adminSettingsRepository.getByCategory('branding')

      expect(brandingSettings).toBeDefined()
      expect(Object.keys(brandingSettings).length).toBeGreaterThanOrEqual(2)
      expect(brandingSettings['branding.inst-1']).toEqual({ color: 'red' })
      expect(brandingSettings['branding.inst-2']).toEqual({ color: 'blue' })
    })
  })

  describe('Audit Logs', () => {
    it('should create audit log entry', async () => {
      const user = await userRepository.create({
        email: 'audit@example.com',
        name: 'Audit User',
        role: 'USER',
      })

      const log = await auditLogRepository.create({
        userId: user.id,
        action: 'user.created',
        resource: 'user',
        resourceId: user.id,
        details: { email: user.email },
        severity: 'INFO',
      })

      expect(log).toBeDefined()
      expect(log.action).toBe('user.created')
      expect(log.userId).toBe(user.id)
      expect(log.severity).toBe('INFO')
    })

    it('should list audit logs with pagination', async () => {
      const user = await userRepository.create({
        email: 'logs@example.com',
        name: 'Log User',
        role: 'USER',
      })

      // Create multiple audit logs
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.login',
        severity: 'INFO',
      })
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.logout',
        severity: 'INFO',
      })
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.updated',
        severity: 'INFO',
      })

      const result = await auditLogRepository.list({}, { page: 1, perPage: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
    })

    it('should filter audit logs by user ID', async () => {
      const user1 = await userRepository.create({
        email: 'user1@audit.com',
        name: 'User 1',
        role: 'USER',
      })
      const user2 = await userRepository.create({
        email: 'user2@audit.com',
        name: 'User 2',
        role: 'USER',
      })

      await auditLogRepository.create({
        userId: user1.id,
        action: 'user.login',
        severity: 'INFO',
      })
      await auditLogRepository.create({
        userId: user2.id,
        action: 'user.login',
        severity: 'INFO',
      })

      const result = await auditLogRepository.list({ userId: user1.id }, { page: 1, perPage: 10 })

      expect(result.data.length).toBeGreaterThanOrEqual(1)
      expect(result.data.every(log => log.userId === user1.id)).toBe(true)
    })

    it('should filter audit logs by severity', async () => {
      const user = await userRepository.create({
        email: 'severity@audit.com',
        name: 'Severity User',
        role: 'USER',
      })

      await auditLogRepository.create({
        userId: user.id,
        action: 'user.login',
        severity: 'INFO',
      })
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.failed_login',
        severity: 'WARNING',
      })
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.security_breach',
        severity: 'CRITICAL',
      })

      const warnings = await auditLogRepository.list({ severity: 'WARNING' }, { page: 1, perPage: 10 })

      expect(warnings.data.every(log => log.severity === 'WARNING')).toBe(true)
    })

    it('should filter audit logs by date range', async () => {
      const user = await userRepository.create({
        email: 'date@audit.com',
        name: 'Date User',
        role: 'USER',
      })

      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await auditLogRepository.create({
        userId: user.id,
        action: 'today.action',
        severity: 'INFO',
      })

      const result = await auditLogRepository.list(
        { startDate: yesterday, endDate: tomorrow },
        { page: 1, perPage: 10 }
      )

      expect(result.data.some(log => log.action === 'today.action')).toBe(true)
    })
  })

  describe('Usage Metrics', () => {
    it('should create usage metric', async () => {
      const user = await userRepository.create({
        email: 'metrics@example.com',
        name: 'Metrics User',
        role: 'USER',
      })

      const metric = await usageMetricRepository.create({
        userId: user.id,
        metric: 'document.created',
        value: 1,
        metadata: { documentType: 'essay' },
      })

      expect(metric).toBeDefined()
      expect(metric.userId).toBe(user.id)
      expect(metric.metric).toBe('document.created')
      expect(metric.value).toBe(1)
    })

    it('should aggregate metrics by user', async () => {
      const user = await userRepository.create({
        email: 'aggregate@example.com',
        name: 'Aggregate User',
        role: 'USER',
      })

      // Create multiple metrics
      await usageMetricRepository.create({
        userId: user.id,
        metric: 'document.created',
        value: 1,
      })
      await usageMetricRepository.create({
        userId: user.id,
        metric: 'document.created',
        value: 1,
      })
      await usageMetricRepository.create({
        userId: user.id,
        metric: 'citation.verified',
        value: 5,
      })

      const userMetrics = await usageMetricRepository.getUserMetrics(user.id)

      expect(userMetrics.totalActivities).toBe(7)
      expect(userMetrics.metrics['document.created']).toBe(2)
      expect(userMetrics.metrics['citation.verified']).toBe(5)
    })

    it('should get user metrics summary', async () => {
      const user = await userRepository.create({
        email: 'user-metrics@example.com',
        name: 'User Metrics',
        role: 'USER',
      })

      await usageMetricRepository.create({
        userId: user.id,
        metric: 'login',
        value: 1,
      })
      await usageMetricRepository.create({
        userId: user.id,
        metric: 'document.created',
        value: 3,
      })

      const result = await usageMetricRepository.getUserMetrics(user.id)

      expect(result.totalActivities).toBe(4)
      expect(result.metrics['login']).toBe(1)
      expect(result.metrics['document.created']).toBe(3)
    })
  })

  describe('Integration: User Lifecycle with Audit Logging', () => {
    it('should create user with audit log', async () => {
      const user = await userRepository.create({
        email: 'lifecycle@example.com',
        name: 'Lifecycle User',
        role: 'USER',
      })

      await auditLogRepository.create({
        userId: user.id,
        action: 'user.created',
        resource: 'user',
        resourceId: user.id,
        details: { email: user.email },
        severity: 'INFO',
      })

      const logs = await auditLogRepository.list({ userId: user.id }, { page: 1, perPage: 10 })

      expect(logs.data.length).toBe(1)
      expect(logs.data[0].action).toBe('user.created')
    })

    it('should track full user lifecycle', async () => {
      // Create user
      const user = await userRepository.create({
        email: 'full-lifecycle@example.com',
        name: 'Full Lifecycle',
        role: 'USER',
      })

      await auditLogRepository.create({
        userId: user.id,
        action: 'user.created',
        severity: 'INFO',
      })

      // Update user
      await userRepository.update(user.id, { role: 'INSTRUCTOR' })
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.updated',
        details: { changes: { role: 'INSTRUCTOR' } },
        severity: 'INFO',
      })

      // Delete user
      await userRepository.delete(user.id)
      await auditLogRepository.create({
        userId: user.id,
        action: 'user.deleted',
        severity: 'WARNING',
      })

      // Check audit trail
      const logs = await auditLogRepository.list({ userId: user.id }, { page: 1, perPage: 10 })

      expect(logs.data.length).toBe(3)
      expect(logs.data.map(l => l.action).sort()).toEqual([
        'user.created',
        'user.deleted',
        'user.updated',
      ])
    })
  })

  describe('Integration: License Management with Users', () => {
    it('should track license seat usage when creating users', async () => {
      const license = await licenseRepository.create({
        institutionId: 'seat-tracking',
        institution: 'Seat Tracking University',
        seats: 5,
        expiresAt: new Date('2025-12-31'),
      })

      // Create users and increment license usage
      const user1 = await userRepository.create({
        email: 'seat1@example.com',
        name: 'Seat 1',
        role: 'USER',
      })
      await licenseRepository.incrementUsedSeats(license.id)

      const user2 = await userRepository.create({
        email: 'seat2@example.com',
        name: 'Seat 2',
        role: 'USER',
      })
      await licenseRepository.incrementUsedSeats(license.id)

      // Check usage
      const stats = await licenseRepository.getUsageStats(license.id)

      expect(stats?.usedSeats).toBe(2)
      expect(stats?.availableSeats).toBe(3)
      expect(stats?.utilizationRate).toBe(40)
    })
  })
})
