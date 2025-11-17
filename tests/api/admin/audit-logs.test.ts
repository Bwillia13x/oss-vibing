/**
 * Admin Audit Log API Unit Tests
 * 
 * Tests for admin audit log API endpoints
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../lib/db/client'
import { AuditLogRepository, UserRepository } from '../../../lib/db/repositories'

describe('Admin Audit Log API Tests', () => {
  const auditLogRepo = new AuditLogRepository()
  const userRepo = new UserRepository()
  let testUserId: string
  let testAuditLogId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany()
    await prisma.user.deleteMany()

    // Create test user for audit logs
    const user = await userRepo.create({
      email: `test-${Date.now()}@test.edu`,
      name: 'Test User',
      role: 'ADMIN',
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Audit Log Creation', () => {
    it('should create audit log with valid data', async () => {
      const auditLogData = {
        userId: testUserId,
        action: 'user.created',
        resource: 'user',
        resourceId: 'user-123',
        severity: 'INFO' as const,
        details: { name: 'John Doe', email: 'john@test.edu' },
      }

      const auditLog = await auditLogRepo.create(auditLogData)

      expect(auditLog).toBeDefined()
      expect(auditLog.userId).toBe(testUserId)
      expect(auditLog.action).toBe('user.created')
      expect(auditLog.resource).toBe('user')
      expect(auditLog.severity).toBe('INFO')
      testAuditLogId = auditLog.id
    })

    it('should create audit log with default severity', async () => {
      const auditLog = await auditLogRepo.create({
        action: 'system.startup',
      })

      expect(auditLog.severity).toBe('INFO')
    })

    it('should create audit log with IP address and user agent', async () => {
      const auditLog = await auditLogRepo.create({
        userId: testUserId,
        action: 'user.login',
        severity: 'INFO',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      })

      expect(auditLog.ipAddress).toBe('192.168.1.1')
      expect(auditLog.userAgent).toBe('Mozilla/5.0')
    })

    it('should create audit logs with different severities', async () => {
      const info = await auditLogRepo.create({
        action: 'info.action',
        severity: 'INFO',
      })

      const warning = await auditLogRepo.create({
        action: 'warning.action',
        severity: 'WARNING',
      })

      const critical = await auditLogRepo.create({
        action: 'critical.action',
        severity: 'CRITICAL',
      })

      expect(info.severity).toBe('INFO')
      expect(warning.severity).toBe('WARNING')
      expect(critical.severity).toBe('CRITICAL')
    })
  })

  describe('Audit Log Retrieval', () => {
    beforeEach(async () => {
      const auditLog = await auditLogRepo.create({
        userId: testUserId,
        action: 'test.action',
        resource: 'test',
        severity: 'INFO',
      })
      testAuditLogId = auditLog.id
    })

    it('should retrieve audit log by id', async () => {
      const auditLog = await auditLogRepo.findById(testAuditLogId)

      expect(auditLog).toBeDefined()
      expect(auditLog?.id).toBe(testAuditLogId)
    })

    it('should return null for non-existent audit log', async () => {
      const auditLog = await auditLogRepo.findById('non-existent-id')

      expect(auditLog).toBeNull()
    })

    it('should list audit logs with pagination', async () => {
      // Create multiple audit logs
      await Promise.all([
        auditLogRepo.create({ action: 'action1', severity: 'INFO' }),
        auditLogRepo.create({ action: 'action2', severity: 'WARNING' }),
        auditLogRepo.create({ action: 'action3', severity: 'CRITICAL' }),
      ])

      const result = await auditLogRepo.list({}, { page: 1, perPage: 10 })

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(4) // 3 new + 1 from beforeEach
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })
  })

  describe('Audit Log Filtering', () => {
    beforeEach(async () => {
      // Create audit logs with different properties
      await auditLogRepo.create({
        userId: testUserId,
        action: 'user.created',
        resource: 'user',
        severity: 'INFO',
      })

      await auditLogRepo.create({
        userId: testUserId,
        action: 'license.updated',
        resource: 'license',
        severity: 'WARNING',
      })

      await auditLogRepo.create({
        action: 'system.error',
        resource: 'system',
        severity: 'CRITICAL',
      })
    })

    it('should filter by userId', async () => {
      const result = await auditLogRepo.list({ userId: testUserId }, { page: 1, perPage: 10 })

      expect(result.data.length).toBe(2)
      result.data.forEach(log => {
        expect(log.userId).toBe(testUserId)
      })
    })

    it('should filter by action', async () => {
      const result = await auditLogRepo.list({ action: 'user.created' }, { page: 1, perPage: 10 })

      expect(result.data.length).toBe(1)
      expect(result.data[0].action).toBe('user.created')
    })

    it('should filter by resource', async () => {
      const result = await auditLogRepo.list({ resource: 'license' }, { page: 1, perPage: 10 })

      expect(result.data.length).toBe(1)
      expect(result.data[0].resource).toBe('license')
    })

    it('should filter by severity', async () => {
      const result = await auditLogRepo.list({ severity: 'CRITICAL' }, { page: 1, perPage: 10 })

      expect(result.data.length).toBe(1)
      expect(result.data[0].severity).toBe('CRITICAL')
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2020-01-01')
      const endDate = new Date('2030-12-31')

      const result = await auditLogRepo.list(
        { startDate, endDate },
        { page: 1, perPage: 10 }
      )

      expect(result.data.length).toBeGreaterThan(0)
      result.data.forEach(log => {
        expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
        expect(log.timestamp.getTime()).toBeLessThanOrEqual(endDate.getTime())
      })
    })
  })

  describe('Audit Log Special Queries', () => {
    beforeEach(async () => {
      // Create audit logs with different severities
      await auditLogRepo.create({ action: 'info1', severity: 'INFO' })
      await auditLogRepo.create({ action: 'info2', severity: 'INFO' })
      await auditLogRepo.create({ action: 'warning1', severity: 'WARNING' })
      await auditLogRepo.create({ action: 'critical1', severity: 'CRITICAL' })
      await auditLogRepo.create({ action: 'critical2', severity: 'CRITICAL' })
    })

    it('should count logs by severity', async () => {
      const infoCount = await auditLogRepo.countBySeverity('INFO')
      const warningCount = await auditLogRepo.countBySeverity('WARNING')
      const criticalCount = await auditLogRepo.countBySeverity('CRITICAL')

      expect(infoCount).toBe(2)
      expect(warningCount).toBe(1)
      expect(criticalCount).toBe(2)
    })

    it('should get recent critical logs', async () => {
      const criticalLogs = await auditLogRepo.getRecentCritical(5)

      expect(criticalLogs.length).toBe(2)
      criticalLogs.forEach(log => {
        expect(log.severity).toBe('CRITICAL')
      })
    })

    it('should get audit logs for specific user', async () => {
      await auditLogRepo.create({
        userId: testUserId,
        action: 'user.action',
        severity: 'INFO',
      })

      const result = await auditLogRepo.getByUser(testUserId, { page: 1, perPage: 10 })

      expect(result.data.length).toBeGreaterThan(0)
      result.data.forEach(log => {
        expect(log.userId).toBe(testUserId)
      })
    })

    it('should get audit logs for specific resource', async () => {
      const resourceId = 'resource-123'
      
      await auditLogRepo.create({
        action: 'resource.action',
        resource: 'document',
        resourceId,
        severity: 'INFO',
      })

      const result = await auditLogRepo.getByResource('document', resourceId, { page: 1, perPage: 10 })

      expect(result.data.length).toBe(1)
      expect(result.data[0].resource).toBe('document')
      expect(result.data[0].resourceId).toBe(resourceId)
    })
  })

  describe('Audit Log Cleanup', () => {
    it('should delete old audit logs', async () => {
      // Create an old audit log (would need to manipulate timestamp)
      const oldLog = await auditLogRepo.create({
        action: 'old.action',
        severity: 'INFO',
      })

      // Update timestamp to be old (direct database update)
      await prisma.auditLog.update({
        where: { id: oldLog.id },
        data: { timestamp: new Date('2020-01-01') },
      })

      const cutoffDate = new Date('2021-01-01')
      const deletedCount = await auditLogRepo.deleteOlderThan(cutoffDate)

      expect(deletedCount).toBe(1)
    })
  })
})
