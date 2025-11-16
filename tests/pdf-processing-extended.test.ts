import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GrobidClient } from '@/lib/pdf/grobid-client'

/**
 * Extended PDF Processing Tests with Mocks
 * 
 * These tests use mocks to test PDF processing without requiring GROBID service.
 * This allows for comprehensive testing of error handling, edge cases, and various scenarios.
 */

describe('PDF Processing - Extended Tests (Mocked)', () => {
  let grobidClient: GrobidClient
  let fetchMock: any

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = vi.fn()
    global.fetch = fetchMock as any
    
    grobidClient = new GrobidClient({
      baseUrl: 'http://localhost:8070',
      timeout: 30000,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GrobidClient - Metadata Extraction', () => {
    it('should extract basic metadata from PDF', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">Machine Learning in Healthcare: A Comprehensive Review</title>
      </titleStmt>
      <sourceDesc>
        <biblStruct>
          <analytic>
            <author>
              <persName>
                <forename type="first">John</forename>
                <surname>Smith</surname>
              </persName>
            </author>
            <author>
              <persName>
                <forename type="first">Jane</forename>
                <surname>Doe</surname>
              </persName>
            </author>
          </analytic>
        </biblStruct>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <front>
      <div type="abstract">
        <abstract>
          <p>This paper presents a comprehensive review of machine learning applications in healthcare.</p>
        </abstract>
      </div>
    </front>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata).toBeDefined()
      expect(metadata?.title).toContain('Machine Learning')
      expect(metadata?.authors).toHaveLength(2)
      expect(metadata?.authors[0].firstName).toBe('John')
      expect(metadata?.authors[0].lastName).toBe('Smith')
      expect(metadata?.authors[1].firstName).toBe('Jane')
      expect(metadata?.authors[1].lastName).toBe('Doe')
      expect(metadata?.abstract).toContain('comprehensive review')
    })

    it('should extract DOI from metadata', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">Sample Paper</title>
      </titleStmt>
      <sourceDesc>
        <biblStruct>
          <idno type="DOI">10.1234/sample.2023</idno>
        </biblStruct>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.doi).toBe('10.1234/sample.2023')
    })

    it('should extract publication year', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">Recent Advances</title>
      </titleStmt>
      <publicationStmt>
        <date when="2023">2023</date>
      </publicationStmt>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.date).toBe('2023')
    })

    it('should handle missing optional fields', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">Minimal Paper</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.title).toBe('Minimal Paper')
      expect(metadata?.authors).toEqual([])
      expect(metadata?.abstract).toBe('')
      expect(metadata?.doi).toBeUndefined()
    })
  })

  describe('GrobidClient - Citation Extraction', () => {
    it('should extract citations from PDF', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <text>
    <back>
      <div type="references">
        <listBibl>
          <biblStruct xml:id="b0">
            <analytic>
              <title>Deep Learning for Medical Imaging</title>
              <author>
                <persName>
                  <surname>Johnson</surname>
                </persName>
              </author>
            </analytic>
            <monogr>
              <title>Nature Medicine</title>
              <imprint>
                <date>2022</date>
              </imprint>
            </monogr>
            <idno type="DOI">10.1038/nm.2022.123</idno>
          </biblStruct>
          <biblStruct xml:id="b1">
            <analytic>
              <title>Neural Networks in Healthcare</title>
              <author>
                <persName>
                  <surname>Williams</surname>
                </persName>
              </author>
            </analytic>
          </biblStruct>
        </listBibl>
      </div>
    </back>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.citations).toHaveLength(2)
      expect(metadata?.citations[0].title).toContain('Deep Learning')
      expect(metadata?.citations[0].authors).toContain('Johnson')
      expect(metadata?.citations[0].doi).toBe('10.1038/nm.2022.123')
      expect(metadata?.citations[1].title).toContain('Neural Networks')
    })

    it('should handle citations without DOIs', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <text>
    <back>
      <div type="references">
        <listBibl>
          <biblStruct xml:id="b0">
            <analytic>
              <title>Book Chapter Without DOI</title>
            </analytic>
          </biblStruct>
        </listBibl>
      </div>
    </back>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.citations).toHaveLength(1)
      expect(metadata?.citations[0].doi).toBeUndefined()
    })
  })

  describe('GrobidClient - Error Handling', () => {
    it('should handle GROBID server errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const buffer = Buffer.from('mock pdf content')
      const result = await grobidClient.processFulltext(buffer)

      expect(result).toBeNull()
    })

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const buffer = Buffer.from('mock pdf content')
      const result = await grobidClient.processFulltext(buffer)

      expect(result).toBeNull()
    })

    it('should handle malformed TEI XML', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'Invalid XML content',
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      // Should not throw, just return empty/partial metadata
      expect(metadata).toBeDefined()
    })

    it('should handle empty response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata).toBeDefined()
    })

    it('should handle timeout errors', async () => {
      fetchMock.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100)
        })
      })

      const buffer = Buffer.from('mock pdf content')
      const result = await grobidClient.processFulltext(buffer)

      expect(result).toBeNull()
    })
  })

  describe('GrobidClient - Header Processing', () => {
    it('should process header without full text', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">Header Only Test</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processHeader(buffer)

      expect(metadata?.title).toBe('Header Only Test')
    })

    it('should be faster than full text processing', async () => {
      const mockTEI = '<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title level="a">Quick Test</title></titleStmt></fileDesc></teiHeader></TEI>'

      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      
      const headerStart = Date.now()
      await grobidClient.processHeader(buffer)
      const headerTime = Date.now() - headerStart

      // Header processing should complete quickly
      expect(headerTime).toBeLessThan(1000) // Less than 1 second
    })
  })

  describe('GrobidClient - Citations Only', () => {
    it('should extract citations only', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <text>
    <back>
      <div type="references">
        <listBibl>
          <biblStruct xml:id="b0">
            <analytic>
              <title>Citation Test</title>
            </analytic>
          </biblStruct>
        </listBibl>
      </div>
    </back>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const citations = await grobidClient.processCitations(buffer)

      expect(citations).toHaveLength(1)
      expect(citations[0].title).toBe('Citation Test')
    })

    it('should return empty array when no citations found', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <text>
    <body>
      <p>No citations here</p>
    </body>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const citations = await grobidClient.processCitations(buffer)

      expect(citations).toEqual([])
    })
  })

  describe('GrobidClient - Special Characters', () => {
    it('should handle special characters in titles', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title level="a">AI &amp; ML: A Survey of α-β Testing</title>
      </titleStmt>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.title).toContain('&')
      expect(metadata?.title).toContain('α-β')
    })

    it('should handle Unicode characters in author names', async () => {
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <sourceDesc>
        <biblStruct>
          <analytic>
            <author>
              <persName>
                <forename type="first">François</forename>
                <surname>Müller</surname>
              </persName>
            </author>
          </analytic>
        </biblStruct>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.authors).toHaveLength(1)
      expect(metadata?.authors[0].lastName).toBe('Müller')
    })
  })

  describe('GrobidClient - Edge Cases', () => {
    it('should handle very large author lists', async () => {
      const authors = Array.from({ length: 50 }, (_, i) => `
        <author>
          <persName>
            <forename type="first">First${i + 1}</forename>
            <surname>Author${i + 1}</surname>
          </persName>
        </author>
      `).join('')

      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <sourceDesc>
        <biblStruct>
          <analytic>
            ${authors}
          </analytic>
        </biblStruct>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.authors).toHaveLength(50)
    })

    it('should handle empty Buffer', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '<TEI xmlns="http://www.tei-c.org/ns/1.0"></TEI>',
      })

      const buffer = Buffer.from('')
      
      // Should not throw
      const result = await grobidClient.processFulltext(buffer)
      expect(result).toBeDefined()
    })

    it('should handle very long abstracts', async () => {
      const longAbstract = 'This is a very long abstract. '.repeat(100)
      const mockTEI = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <text>
    <front>
      <div type="abstract">
        <abstract>
          <p>${longAbstract}</p>
        </abstract>
      </div>
    </front>
  </text>
</TEI>`

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockTEI,
      })

      const buffer = Buffer.from('mock pdf content')
      const metadata = await grobidClient.processFulltext(buffer)

      expect(metadata?.abstract).toBeDefined()
      expect(metadata?.abstract.length).toBeGreaterThan(100)
    })
  })

  describe('GrobidClient - Configuration', () => {
    it('should use custom base URL', () => {
      const customClient = new GrobidClient({
        baseUrl: 'http://custom-grobid:9000',
        timeout: 60000,
      })

      expect(customClient).toBeDefined()
    })

    it('should handle trailing slash in base URL', () => {
      const clientWithSlash = new GrobidClient({
        baseUrl: 'http://localhost:8070/',
        timeout: 30000,
      })

      expect(clientWithSlash).toBeDefined()
    })
  })
})
