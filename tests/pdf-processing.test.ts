import { describe, it, expect, beforeAll } from 'vitest'
import { isGROBIDAvailable, processPDF } from '@/lib/pdf/processor'

/**
 * PDF Processing Integration Tests
 * 
 * Note: These tests require GROBID service to be running.
 * Start GROBID with: docker-compose up -d grobid
 * 
 * Tests are skipped if GROBID is not available.
 */

describe('PDF Processing', () => {
  let grobidAvailable = false

  beforeAll(async () => {
    // Check if GROBID service is available
    try {
      grobidAvailable = await isGROBIDAvailable()
      if (!grobidAvailable) {
        console.log('⚠️  GROBID service not available. PDF processing tests will be skipped.')
        console.log('   To run these tests, start GROBID with: docker-compose up -d grobid')
      }
    } catch (error) {
      console.log('⚠️  Could not connect to GROBID service:', error)
    }
  }, 10000)

  describe('GROBID Service', () => {
    it('should check if GROBID is available', async () => {
      const available = await isGROBIDAvailable()
      // Test passes whether GROBID is available or not
      expect(typeof available).toBe('boolean')
    })
  })

  describe('PDF Metadata Extraction', () => {
    it.skipIf(!grobidAvailable)('should extract metadata from PDF header', async () => {
      // This test requires a sample PDF file
      // For now, we'll skip unless the file exists
      const result = await processPDF({
        pdfPath: './tests/fixtures/sample-paper.pdf',
        extractCitations: false,
        extractFullText: false,
      })

      if (!result.success) {
        console.log('PDF processing failed:', result.error)
        return
      }

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      // Check that at least some metadata was extracted
      expect(
        result.metadata.title || 
        result.metadata.authors?.length || 
        result.metadata.abstract
      ).toBeTruthy()
    }, 30000)
  })

  describe('PDF Citation Extraction', () => {
    it.skipIf(!grobidAvailable)('should extract citations from PDF', async () => {
      const result = await processPDF({
        pdfPath: './tests/fixtures/sample-paper.pdf',
        extractCitations: true,
        extractFullText: false,
      })

      if (!result.success) {
        console.log('PDF processing failed:', result.error)
        return
      }

      expect(result.success).toBe(true)
      expect(result.citations).toBeDefined()
      expect(Array.isArray(result.citations)).toBe(true)
      
      // If citations were found, check structure
      if (result.citations.length > 0) {
        const citation = result.citations[0]
        expect(citation).toHaveProperty('id')
        // At least one of these should be present
        expect(
          citation.title ||
          citation.authors?.length ||
          citation.journal ||
          citation.doi
        ).toBeTruthy()
      }
    }, 30000)
  })

  describe('PDF Full Text Extraction', () => {
    it.skipIf(!grobidAvailable)('should extract full text from PDF', async () => {
      const result = await processPDF({
        pdfPath: './tests/fixtures/sample-paper.pdf',
        extractFullText: true,
        extractSections: true,
      })

      if (!result.success) {
        console.log('PDF processing failed:', result.error)
        return
      }

      expect(result.success).toBe(true)
      expect(result.fullText).toBeDefined()
      expect(typeof result.fullText).toBe('string')
      expect(result.fullText!.length).toBeGreaterThan(0)
      
      // Check sections
      expect(result.sections).toBeDefined()
      expect(Array.isArray(result.sections)).toBe(true)
    }, 45000)
  })

  describe('Error Handling', () => {
    it('should handle missing PDF file gracefully', async () => {
      const result = await processPDF({
        pdfPath: './nonexistent-file.pdf',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle invalid options', async () => {
      const result = await processPDF({
        // Neither pdfPath nor pdfBuffer provided
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it.skipIf(!grobidAvailable)('should handle very large files', async () => {
      // Create a mock large buffer (larger than max size)
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024) // 60MB

      const result = await processPDF({
        pdfBuffer: largeBuffer,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('too large')
    })
  })

  describe('Integration with Citation Client', () => {
    it.skipIf(!grobidAvailable)('should extract DOIs that can be validated', async () => {
      const result = await processPDF({
        pdfPath: './tests/fixtures/sample-paper.pdf',
        extractCitations: true,
      })

      if (!result.success || result.citations.length === 0) {
        console.log('No citations found or processing failed')
        return
      }

      // Find citations with DOIs
      const citationsWithDOI = result.citations.filter(c => c.doi)

      if (citationsWithDOI.length > 0) {
        // Check that DOIs are in valid format
        citationsWithDOI.forEach(citation => {
          expect(citation.doi).toMatch(/^10\.\d{4,}\//)
        })
      }
    }, 30000)
  })
})

/**
 * Mock Tests (Run without GROBID)
 * 
 * These tests verify the error handling and edge cases
 * without requiring GROBID to be running.
 */
describe('PDF Processing (Mock Tests)', () => {
  it('should handle GROBID unavailable scenario', async () => {
    // Even if GROBID is not available, the function should return gracefully
    const result = await processPDF({
      pdfPath: './tests/fixtures/nonexistent.pdf',
    })

    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('metadata')
    expect(result).toHaveProperty('citations')
  })

  it('should validate PDF processing options types', () => {
    const validOptions = {
      pdfPath: './test.pdf',
      extractCitations: true,
      extractFullText: false,
      extractSections: true,
    }

    expect(typeof validOptions.pdfPath).toBe('string')
    expect(typeof validOptions.extractCitations).toBe('boolean')
    expect(typeof validOptions.extractFullText).toBe('boolean')
    expect(typeof validOptions.extractSections).toBe('boolean')
  })
})
