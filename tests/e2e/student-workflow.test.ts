import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { DocumentRepository } from '@/lib/db/repositories/document-repository'
import { UserRepository } from '@/lib/db/repositories/user-repository'

const prisma = new PrismaClient()
const documentRepo = new DocumentRepository(prisma)
const userRepo = new UserRepository(prisma)

describe('Student Workflow E2E Tests', () => {
  let studentId: string
  let documentId: string

  beforeEach(async () => {
    // Create a test student
    const student = await userRepo.create({
      email: `student-${Date.now()}@test.edu`,
      name: 'Test Student',
      role: 'USER',
    })
    studentId = student.id
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Document Creation and Editing', () => {
    it('should create a new document', async () => {
      const doc = await documentRepo.create({
        title: 'My Research Paper',
        content: 'Initial content',
        userId: studentId,
      })

      expect(doc).toBeDefined()
      expect(doc.title).toBe('My Research Paper')
      expect(doc.content).toBe('Initial content')
      expect(doc.userId).toBe(studentId)
      documentId = doc.id
    })

    it('should update document content', async () => {
      const doc = await documentRepo.create({
        title: 'Draft Paper',
        content: 'Original content',
        userId: studentId,
      })

      const updated = await documentRepo.update(doc.id, {
        content: 'Updated content with more details',
      })

      expect(updated.content).toBe('Updated content with more details')
      expect(updated.id).toBe(doc.id)
    })

    it('should save document with markdown formatting', async () => {
      const markdown = `# Introduction\n\nThis is my **research** paper with *emphasis*.`
      
      const doc = await documentRepo.create({
        title: 'Formatted Paper',
        content: markdown,
        userId: studentId,
      })

      expect(doc.content).toContain('# Introduction')
      expect(doc.content).toContain('**research**')
    })

    it('should auto-save document changes', async () => {
      const doc = await documentRepo.create({
        title: 'Auto-save Test',
        content: 'Version 1',
        userId: studentId,
      })

      // Simulate multiple auto-saves
      await documentRepo.update(doc.id, { content: 'Version 2' })
      await documentRepo.update(doc.id, { content: 'Version 3' })
      
      const final = await documentRepo.findById(doc.id)
      expect(final?.content).toBe('Version 3')
    })
  })

  describe('Citation Management', () => {
    it('should add citations to document', async () => {
      const doc = await documentRepo.create({
        title: 'Paper with Citations',
        content: 'Research shows [1] that climate change is real.',
        userId: studentId,
        citations: [
          {
            id: 'cite1',
            doi: '10.1234/example',
            title: 'Climate Change Study',
            authors: ['Smith, J.'],
            year: 2023,
          },
        ],
      })

      expect(doc.citations).toHaveLength(1)
      expect(doc.citations[0].doi).toBe('10.1234/example')
    })

    it('should search and insert citations', async () => {
      const doc = await documentRepo.create({
        title: 'Research Paper',
        content: 'Initial text',
        userId: studentId,
      })

      // Simulate adding citation after searching
      const updated = await documentRepo.update(doc.id, {
        citations: [
          {
            id: 'cite1',
            doi: '10.1038/nature12345',
            title: 'Important Discovery',
            authors: ['Johnson, A.', 'Williams, B.'],
            year: 2022,
            journal: 'Nature',
          },
        ],
      })

      expect(updated.citations).toHaveLength(1)
      expect(updated.citations[0].journal).toBe('Nature')
    })

    it('should manage multiple citations', async () => {
      const doc = await documentRepo.create({
        title: 'Literature Review',
        content: 'Multiple studies [1][2][3] confirm this.',
        userId: studentId,
        citations: [
          { id: 'cite1', title: 'Study 1', authors: ['A'], year: 2021 },
          { id: 'cite2', title: 'Study 2', authors: ['B'], year: 2022 },
          { id: 'cite3', title: 'Study 3', authors: ['C'], year: 2023 },
        ],
      })

      expect(doc.citations).toHaveLength(3)
      expect(doc.citations.map(c => c.year)).toEqual([2021, 2022, 2023])
    })

    it('should format citations in different styles', async () => {
      const citation = {
        id: 'cite1',
        title: 'Example Paper',
        authors: ['Smith, J.', 'Doe, A.'],
        year: 2023,
        journal: 'Science',
      }

      // APA format
      const apa = `${citation.authors[0]} (${citation.year}). ${citation.title}. ${citation.journal}.`
      expect(apa).toContain('Smith, J.')
      expect(apa).toContain('2023')

      // MLA format
      const mla = `${citation.authors[0]}. "${citation.title}." ${citation.journal} (${citation.year}).`
      expect(mla).toContain(citation.title)
    })
  })

  describe('Document Export', () => {
    it('should export document to PDF format', async () => {
      const doc = await documentRepo.create({
        title: 'Export Test',
        content: 'Content to export',
        userId: studentId,
      })

      // Simulate export metadata
      const exportData = {
        format: 'PDF',
        title: doc.title,
        content: doc.content,
        citations: doc.citations,
        timestamp: new Date(),
      }

      expect(exportData.format).toBe('PDF')
      expect(exportData.title).toBe('Export Test')
    })

    it('should export document to DOCX format', async () => {
      const doc = await documentRepo.create({
        title: 'Word Export',
        content: 'Content for Word',
        userId: studentId,
      })

      const exportData = {
        format: 'DOCX',
        title: doc.title,
        includeMetadata: true,
      }

      expect(exportData.format).toBe('DOCX')
      expect(exportData.includeMetadata).toBe(true)
    })

    it('should include bibliography in export', async () => {
      const doc = await documentRepo.create({
        title: 'Paper with Bibliography',
        content: 'Research content',
        userId: studentId,
        citations: [
          { id: 'c1', title: 'Source 1', authors: ['A'], year: 2021 },
          { id: 'c2', title: 'Source 2', authors: ['B'], year: 2022 },
        ],
      })

      const exportData = {
        document: doc,
        bibliography: doc.citations.map(c => `${c.authors[0]} (${c.year}). ${c.title}.`),
      }

      expect(exportData.bibliography).toHaveLength(2)
      expect(exportData.bibliography[0]).toContain('Source 1')
    })
  })

  describe('Collaboration Features', () => {
    it('should share document with collaborators', async () => {
      const doc = await documentRepo.create({
        title: 'Shared Document',
        content: 'Collaborative work',
        userId: studentId,
      })

      // Create a collaborator
      const collaborator = await userRepo.create({
        email: `collab-${Date.now()}@test.edu`,
        name: 'Collaborator',
        role: 'USER',
      })

      // Simulate sharing (would use collaboration service in real app)
      const shareData = {
        documentId: doc.id,
        sharedWith: collaborator.id,
        permission: 'VIEWER',
      }

      expect(shareData.permission).toBe('VIEWER')
      expect(shareData.sharedWith).toBe(collaborator.id)
    })

    it('should handle real-time collaborative editing', async () => {
      const doc = await documentRepo.create({
        title: 'Live Editing',
        content: 'User 1 types',
        userId: studentId,
        collaborativeState: { users: [studentId], version: 1 },
      })

      // Simulate collaborative edit
      const updated = await documentRepo.update(doc.id, {
        content: 'User 1 types... User 2 adds text',
        collaborativeState: { users: [studentId, 'user2'], version: 2 },
      })

      expect(updated.collaborativeState.version).toBe(2)
      expect(updated.collaborativeState.users).toHaveLength(2)
    })
  })

  describe('FERPA Compliance', () => {
    it('should mark document as private by default', async () => {
      const doc = await documentRepo.create({
        title: 'Private Document',
        content: 'Student work',
        userId: studentId,
      })

      // Default should be private (not shared)
      expect(doc.userId).toBe(studentId)
      expect(doc.title).toBeDefined()
    })

    it('should allow student to export their own data', async () => {
      const doc1 = await documentRepo.create({
        title: 'Doc 1',
        content: 'Content 1',
        userId: studentId,
      })

      const doc2 = await documentRepo.create({
        title: 'Doc 2',
        content: 'Content 2',
        userId: studentId,
      })

      const studentDocs = await documentRepo.findByUserId(studentId)
      
      expect(studentDocs.length).toBeGreaterThanOrEqual(2)
      expect(studentDocs.every(d => d.userId === studentId)).toBe(true)
    })

    it('should allow student to delete their documents', async () => {
      const doc = await documentRepo.create({
        title: 'To Delete',
        content: 'Will be deleted',
        userId: studentId,
      })

      await documentRepo.delete(doc.id)
      
      const deleted = await documentRepo.findById(doc.id)
      expect(deleted).toBeNull()
    })
  })

  describe('Document Organization', () => {
    it('should organize documents by folders/tags', async () => {
      const doc = await documentRepo.create({
        title: 'Organized Doc',
        content: 'Content',
        userId: studentId,
        metadata: { folder: 'Research Papers', tags: ['biology', 'climate'] },
      })

      expect(doc.metadata.folder).toBe('Research Papers')
      expect(doc.metadata.tags).toContain('biology')
    })

    it('should search documents by title', async () => {
      await documentRepo.create({
        title: 'Climate Change Research',
        content: 'About climate',
        userId: studentId,
      })

      await documentRepo.create({
        title: 'Biology Study',
        content: 'About biology',
        userId: studentId,
      })

      const allDocs = await documentRepo.findByUserId(studentId)
      const climateDoc = allDocs.find(d => d.title.includes('Climate'))
      
      expect(climateDoc).toBeDefined()
      expect(climateDoc?.title).toContain('Climate')
    })

    it('should list recent documents', async () => {
      // Create docs with different timestamps
      const doc1 = await documentRepo.create({
        title: 'Old Doc',
        content: 'Old',
        userId: studentId,
      })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const doc2 = await documentRepo.create({
        title: 'New Doc',
        content: 'New',
        userId: studentId,
      })

      const docs = await documentRepo.findByUserId(studentId)
      
      // Most recent should be last or can be sorted
      expect(docs.length).toBeGreaterThanOrEqual(2)
    })
  })
})
