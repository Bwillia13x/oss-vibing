/**
 * Repository Integration Tests
 * 
 * Tests for database repositories
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  userRepository,
  documentRepository,
  referenceRepository,
  citationRepository,
  adminSettingsRepository,
  licenseRepository,
  auditLogRepository,
} from '../lib/db/repositories'

const prisma = new PrismaClient()

describe('Repository Integration Tests', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.citation.deleteMany()
    await prisma.reference.deleteMany()
    await prisma.document.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.license.deleteMany()
    await prisma.adminSettings.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up database after tests
    await prisma.citation.deleteMany()
    await prisma.reference.deleteMany()
    await prisma.document.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.license.deleteMany()
    await prisma.adminSettings.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('UserRepository', () => {
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
    })

    it('should find user by email', async () => {
      const user = await userRepository.findByEmail('test@example.com')
      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('should update user', async () => {
      const user = await userRepository.findByEmail('test@example.com')
      expect(user).toBeDefined()

      const updated = await userRepository.update(user!.id, {
        name: 'Updated User',
      })

      expect(updated.name).toBe('Updated User')
    })

    it('should list users with pagination', async () => {
      const result = await userRepository.list({}, { page: 1, perPage: 10 })
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.total).toBeGreaterThan(0)
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })

    it('should count users by role', async () => {
      const count = await userRepository.countByRole('USER')
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('DocumentRepository', () => {
    let userId: string

    beforeEach(async () => {
      const user = await userRepository.findByEmail('test@example.com')
      userId = user!.id
    })

    it('should create a document', async () => {
      const doc = await documentRepository.create({
        userId,
        title: 'Test Document',
        content: '# Test\n\nThis is a test document.',
        type: 'NOTE',
        status: 'DRAFT',
      })

      expect(doc).toBeDefined()
      expect(doc.title).toBe('Test Document')
      expect(doc.type).toBe('NOTE')
      expect(doc.status).toBe('DRAFT')
    })

    it('should find document by id', async () => {
      const docs = await documentRepository.list({ userId })
      expect(docs.data.length).toBeGreaterThan(0)

      const doc = await documentRepository.findById(docs.data[0].id)
      expect(doc).toBeDefined()
      expect(doc?.id).toBe(docs.data[0].id)
    })

    it('should update document', async () => {
      const docs = await documentRepository.list({ userId })
      const updated = await documentRepository.update(docs.data[0].id, {
        title: 'Updated Document',
        status: 'COMPLETED',
      })

      expect(updated.title).toBe('Updated Document')
      expect(updated.status).toBe('COMPLETED')
    })

    it('should list documents with filters', async () => {
      const result = await documentRepository.list(
        { userId, status: 'COMPLETED' },
        { page: 1, perPage: 10 }
      )
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.every(d => d.status === 'COMPLETED')).toBe(true)
    })

    it('should count documents by user', async () => {
      const count = await documentRepository.countByUser(userId)
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('ReferenceRepository', () => {
    let userId: string

    beforeEach(async () => {
      const user = await userRepository.findByEmail('test@example.com')
      userId = user!.id
    })

    it('should create a reference', async () => {
      const ref = await referenceRepository.create({
        userId,
        doi: '10.1234/test',
        title: 'Test Article',
        authors: ['John Doe', 'Jane Smith'],
        year: 2024,
        journal: 'Test Journal',
        type: 'article-journal',
      })

      expect(ref).toBeDefined()
      expect(ref.doi).toBe('10.1234/test')
      expect(ref.title).toBe('Test Article')
      expect(JSON.parse(ref.authors)).toEqual(['John Doe', 'Jane Smith'])
      expect(ref.year).toBe(2024)
    })

    it('should find reference by DOI', async () => {
      const ref = await referenceRepository.findByDoi('10.1234/test')
      expect(ref).toBeDefined()
      expect(ref?.doi).toBe('10.1234/test')
    })

    it('should list references', async () => {
      const result = await referenceRepository.list({ userId })
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should count references by user', async () => {
      const count = await referenceRepository.countByUser(userId)
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('CitationRepository', () => {
    let userId: string
    let documentId: string
    let referenceId: string

    beforeEach(async () => {
      const user = await userRepository.findByEmail('test@example.com')
      userId = user!.id

      const docs = await documentRepository.list({ userId })
      documentId = docs.data[0].id

      const refs = await referenceRepository.list({ userId })
      referenceId = refs.data[0].id
    })

    it('should create a citation', async () => {
      const citation = await citationRepository.create({
        documentId,
        referenceId,
        userId,
        location: 'p. 42',
        context: 'As stated in the literature',
        type: 'IN_TEXT',
      })

      expect(citation).toBeDefined()
      expect(citation.documentId).toBe(documentId)
      expect(citation.referenceId).toBe(referenceId)
      expect(citation.location).toBe('p. 42')
    })

    it('should find citations with references', async () => {
      const citations = await citationRepository.findByDocumentWithReferences(documentId)
      expect(citations.length).toBeGreaterThan(0)
    })

    it('should count citations by document', async () => {
      const count = await citationRepository.countByDocument(documentId)
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('AdminSettingsRepository', () => {
    it('should set and get a setting', async () => {
      await adminSettingsRepository.set('test.key', 'test value', 'test')
      const value = await adminSettingsRepository.get<string>('test.key')
      expect(value).toBe('test value')
    })

    it('should get setting with default', async () => {
      const value = await adminSettingsRepository.getWithDefault('nonexistent', 'default')
      expect(value).toBe('default')
    })

    it('should get settings by category', async () => {
      await adminSettingsRepository.set('test.key1', 'value1', 'test')
      await adminSettingsRepository.set('test.key2', 'value2', 'test')

      const settings = await adminSettingsRepository.getByCategory('test')
      expect(settings['test.key1']).toBe('value1')
      expect(settings['test.key2']).toBe('value2')
    })

    it('should bulk set settings', async () => {
      const count = await adminSettingsRepository.bulkSet([
        { key: 'bulk.key1', value: 'value1', category: 'bulk' },
        { key: 'bulk.key2', value: 'value2', category: 'bulk' },
      ])

      expect(count).toBe(2)

      const value1 = await adminSettingsRepository.get('bulk.key1')
      expect(value1).toBe('value1')
    })
  })

  describe('LicenseRepository', () => {
    it('should create a license', async () => {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const license = await licenseRepository.create({
        institutionId: 'test-institution',
        institution: 'Test University',
        seats: 100,
        expiresAt,
      })

      expect(license).toBeDefined()
      expect(license.institution).toBe('Test University')
      expect(license.seats).toBe(100)
      expect(license.status).toBe('ACTIVE')
    })

    it('should find license by institution ID', async () => {
      const license = await licenseRepository.findByInstitutionId('test-institution')
      expect(license).toBeDefined()
      expect(license?.institution).toBe('Test University')
    })

    it('should increment used seats', async () => {
      const license = await licenseRepository.findByInstitutionId('test-institution')
      expect(license).toBeDefined()

      const updated = await licenseRepository.incrementUsedSeats(license!.id)
      expect(updated.usedSeats).toBe(1)
    })

    it('should get usage stats', async () => {
      const license = await licenseRepository.findByInstitutionId('test-institution')
      expect(license).toBeDefined()

      const stats = await licenseRepository.getUsageStats(license!.id)
      expect(stats).toBeDefined()
      expect(stats!.seats).toBe(100)
      expect(stats!.usedSeats).toBe(1)
      expect(stats!.availableSeats).toBe(99)
    })

    it('should list licenses', async () => {
      const result = await licenseRepository.list({}, { page: 1, perPage: 10 })
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('AuditLogRepository', () => {
    let userId: string

    beforeEach(async () => {
      const user = await userRepository.findByEmail('test@example.com')
      userId = user!.id
    })

    it('should create an audit log', async () => {
      const log = await auditLogRepository.create({
        userId,
        action: 'user.login',
        resource: 'user',
        resourceId: userId,
        details: { method: 'email' },
        severity: 'INFO',
        ipAddress: '127.0.0.1',
      })

      expect(log).toBeDefined()
      expect(log.action).toBe('user.login')
      expect(log.severity).toBe('INFO')
    })

    it('should list audit logs', async () => {
      const result = await auditLogRepository.list({}, { page: 1, perPage: 10 })
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should get audit logs by user', async () => {
      const result = await auditLogRepository.getByUser(userId)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.every(l => l.userId === userId)).toBe(true)
    })

    it('should count logs by severity', async () => {
      const count = await auditLogRepository.countBySeverity('INFO')
      expect(count).toBeGreaterThan(0)
    })

    it('should create critical log and retrieve it', async () => {
      await auditLogRepository.create({
        userId,
        action: 'security.breach',
        severity: 'CRITICAL',
      })

      const critical = await auditLogRepository.getRecentCritical(10)
      expect(critical.length).toBeGreaterThan(0)
      expect(critical.every(l => l.severity === 'CRITICAL')).toBe(true)
    })
  })
})
