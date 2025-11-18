/**
 * Research Integrations Tests
 * 
 * Tests for enhanced JSTOR and IEEE search implementations
 */

import { describe, it, afterEach, expect, vi } from 'vitest';
import { searchJSTOR, searchIEEE, getPaperByDOI } from '@/lib/research-integrations';

// Mock the environment variables
const originalEnv = process.env;

describe('Research Integrations', () => {
  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('searchJSTOR', () => {
    it('should return empty array when API key is not configured', async () => {
      process.env.JSTOR_API_KEY = '';
      
      const results = await searchJSTOR('machine learning', 10);
      
      expect(results).toEqual([]);
    });

    it('should handle API authentication failure gracefully', async () => {
      process.env.JSTOR_API_KEY = 'invalid-key';
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({}),
        } as Response)
      );
      
      const results = await searchJSTOR('test query', 10);
      
      expect(results).toEqual([]);
    });

    it('should handle API timeout gracefully', async () => {
      process.env.JSTOR_API_KEY = 'test-key';
      
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Request timeout'))
      );
      
      const results = await searchJSTOR('test query', 10);
      
      expect(results).toEqual([]);
    });

    it('should parse JSTOR response correctly when API key is valid', async () => {
      process.env.JSTOR_API_KEY = 'test-key';
      
      const mockResponse = {
        response: {
          docs: [
            {
              id: '123',
              title: 'Test Article',
              author: ['John Doe', 'Jane Smith'],
              abstract: 'Test abstract',
              publication_year: 2023,
              journal_title: 'Test Journal',
              doi: '10.1234/test',
            },
          ],
        },
      };
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      
      const results = await searchJSTOR('test query', 10);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Article');
      expect(results[0].authors).toEqual(['John Doe', 'Jane Smith']);
      expect(results[0].source).toBe('jstor');
    });
  });

  describe('searchIEEE', () => {
    it('should return empty array when API key is not configured', async () => {
      process.env.IEEE_API_KEY = '';
      
      const results = await searchIEEE('machine learning', 10);
      
      expect(results).toEqual([]);
    });

    it('should handle API authentication failure gracefully', async () => {
      process.env.IEEE_API_KEY = 'invalid-key';
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({}),
        } as Response)
      );
      
      const results = await searchIEEE('test query', 10);
      
      expect(results).toEqual([]);
    });

    it('should normalize author names correctly', async () => {
      process.env.IEEE_API_KEY = 'test-key';
      
      const mockResponse = {
        articles: [
          {
            article_number: '123',
            title: 'Test Paper',
            authors: {
              authors: [
                { full_name: 'John Doe' },
                { fname: 'Jane', lname: 'Smith' },
              ],
            },
            abstract: 'Test abstract',
            publication_year: 2023,
            publication_title: 'IEEE Conference',
            doi: '10.1109/test.2023.123',
          },
        ],
      };
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      
      const results = await searchIEEE('test query', 10);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Paper');
      expect(results[0].authors).toEqual(['John Doe', 'Jane Smith']);
      expect(results[0].source).toBe('ieee');
    });

    it('should include enhanced metadata fields', async () => {
      process.env.IEEE_API_KEY = 'test-key';
      
      const mockResponse = {
        articles: [
          {
            article_number: '123',
            title: 'Test Paper',
            authors: { authors: [] },
            publication_year: 2023,
            publication_title: 'IEEE Journal',
            doi: '10.1109/test',
            start_page: '1',
            end_page: '10',
            publisher: 'IEEE',
            content_type: 'Conference',
          },
        ],
      };
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      
      const results = await searchIEEE('test query', 10);
      
      expect(results[0].metadata).toHaveProperty('startPage', '1');
      expect(results[0].metadata).toHaveProperty('endPage', '10');
      expect(results[0].metadata).toHaveProperty('publisher', 'IEEE');
      expect(results[0].metadata).toHaveProperty('documentType', 'Conference');
    });

    it('should construct DOI URL when DOI is present', async () => {
      process.env.IEEE_API_KEY = 'test-key';
      
      const mockResponse = {
        articles: [
          {
            article_number: '123',
            title: 'Test Paper',
            authors: { authors: [] },
            doi: '10.1109/test.2023.123',
          },
        ],
      };
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );
      
      const results = await searchIEEE('test query', 10);
      
      expect(results[0].url).toBe('https://doi.org/10.1109/test.2023.123');
    });
  });

  describe('getPaperByDOI', () => {
    it('should return null for invalid DOI format', async () => {
      const paper = await getPaperByDOI('not-a-doi');
      expect(paper).toBeNull();
    });

    it('should parse Crossref response and set source to crossref', async () => {
      const mockWork = {
        title: ['Test DOI Paper'],
        author: [{ given: 'Ada', family: 'Lovelace' }],
        abstract: 'Test abstract',
        published: { 'date-parts': [[2024]] },
        'container-title': ['Test Journal'],
        URL: 'https://doi.org/10.1234/test-doi',
        'is-referenced-by-count': 42,
        type: 'journal-article',
        publisher: 'Test Publisher',
        ISSN: ['1234-5678'],
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: mockWork }),
        } as Response)
      );

      const doi = '10.1234/test-doi';
      const paper = await getPaperByDOI(doi);

      expect(paper).not.toBeNull();
      if (paper) {
        expect(paper.source).toBe('crossref');
        expect(paper.doi).toBe(doi);
        expect(paper.title).toBe('Test DOI Paper');
        expect(paper.authors).toEqual(['Ada Lovelace']);
      }
    });
  });
});
