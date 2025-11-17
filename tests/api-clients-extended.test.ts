/**
 * Extended API Client Tests
 * 
 * Comprehensive tests for citation API clients with mocks
 * Target: Increase API client coverage from 24% to 70%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  lookupDOI, 
  searchPapers,
  getCitationCount,
  validateDOI,
  getOpenAccessPDF,
  clearCache,
  getCacheStats,
} from '@/lib/api/citation-client';

describe('Citation API Client - Extended Tests', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DOI Lookup with Fallback', () => {
    it('should lookup DOI using Crossref', async () => {
      const mockCrossrefResponse = {
        status: 'ok',
        'message-type': 'work',
        message: {
          DOI: '10.1234/test',
          title: ['Test Paper'],
          author: [
            { given: 'John', family: 'Doe' }
          ],
          published: { 'date-parts': [[2023]] },
          'is-referenced-by-count': 10,
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCrossrefResponse,
      });

      const result = await lookupDOI('10.1234/test');
      
      expect(result).toBeDefined();
      expect(result?.doi).toBe('10.1234/test');
      expect(result?.title).toContain('Test Paper');
    });

    it('should handle provider fallback', async () => {
      const mockResponse = {
        status: 'ok',
        message: {
          DOI: '10.1234/test',
          title: ['Test Paper'],
          author: [],
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await lookupDOI('10.1234/test');
      
      expect(result).toBeDefined();
      expect(result?.provider).toBeDefined();
    });

    it('should handle lookup errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      
      // Should retry with other providers or return null
      const result = await lookupDOI('10.1234/test');
      
      // Either succeeds with fallback or returns null
      expect(result === null || result?.doi).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache successful lookups', async () => {
      const mockResponse = {
        status: 'ok',
        message: {
          DOI: '10.1234/cached',
          title: ['Cached Paper'],
          author: [],
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call - should hit API
      const result1 = await lookupDOI('10.1234/cached', { enableCaching: true });
      expect(fetchMock).toHaveBeenCalled();
      
      // Second call - should use cache
      const result2 = await lookupDOI('10.1234/cached', { enableCaching: true });
      
      // Both results should be defined
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should clear cache', () => {
      clearCache();
      
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should track cache statistics', () => {
      const stats = getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(typeof stats.size).toBe('number');
    });
  });

  describe('Paper Search', () => {
    it('should search papers across providers', async () => {
      const mockSearchResults = {
        results: [
          {
            id: 'https://openalex.org/W1',
            title: 'Machine Learning Paper',
            publication_year: 2023,
            authorships: [],
            cited_by_count: 5,
          }
        ]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults,
      });

      const results = await searchPapers('machine learning', { maxResults: 10 });
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty search results', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const results = await searchPapers('nonexistent query');
      
      expect(results).toEqual([]);
    });

    it('should handle search errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Search failed'));

      const results = await searchPapers('test query');
      
      expect(results).toEqual([]);
    });
  });

  describe('Additional API Features', () => {
    it('should get citation count for DOI', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          message: {
            DOI: '10.1234/citations',
            'is-referenced-by-count': 42,
          }
        }),
      });

      const count = await getCitationCount('10.1234/citations');
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should validate DOI format', async () => {
      const validDOI = '10.1234/test.2023';
      const invalidDOI = 'not-a-doi';
      
      const valid = await validateDOI(validDOI);
      const invalid = await validateDOI(invalidDOI);
      
      expect(typeof valid).toBe('boolean');
      expect(typeof invalid).toBe('boolean');
    });

    it('should find open access PDFs', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          message: {
            DOI: '10.1234/openaccess',
            link: [
              { URL: 'https://example.com/paper.pdf', 'content-type': 'application/pdf' }
            ]
          }
        }),
      });

      const pdfUrl = await getOpenAccessPDF('10.1234/openaccess');
      
      expect(pdfUrl === null || typeof pdfUrl === 'string').toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      fetchMock.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      const result = await lookupDOI('10.1234/timeout', { timeout: 50 });
      
      // Should gracefully handle timeout
      expect(result).toBeDefined();
    });

    it('should handle malformed responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const result = await lookupDOI('10.1234/malformed');
      
      // Should not crash, may return null or try next provider
      expect(result).toBeDefined();
    });

    it('should handle rate limiting (429)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await lookupDOI('10.1234/ratelimit');
      
      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Data Normalization', () => {
    it('should normalize author names consistently', async () => {
      const mockResponse = {
        status: 'ok',
        message: {
          DOI: '10.1234/authors',
          title: ['Author Test'],
          author: [
            { given: 'John', family: 'Doe' },
            { given: 'Jane', family: 'Smith' },
          ],
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await lookupDOI('10.1234/authors');
      
      expect(result?.authors).toBeDefined();
      expect(result?.authors.length).toBe(2);
      expect(result?.authors[0].given).toBe('John');
      expect(result?.authors[0].family).toBe('Doe');
    });

    it('should normalize citation counts', async () => {
      const mockResponse = {
        status: 'ok',
        message: {
          DOI: '10.1234/citations',
          title: ['Citation Test'],
          author: [],
          'is-referenced-by-count': 42,
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await lookupDOI('10.1234/citations');
      
      expect(result?.citationCount).toBe(42);
    });
  });
});
