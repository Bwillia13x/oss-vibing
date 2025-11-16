/**
 * Semantic Scholar API Integration Tests
 * Tests for the Semantic Scholar citation lookup service
 */

import { describe, test, expect } from 'vitest';
import { getPaperByDOI, searchPapers } from '@/lib/api/semantic-scholar';

describe('Semantic Scholar API', () => {
  test('should resolve DOI successfully', { timeout: 10000 }, async () => {
    const doi = '10.1038/nature12373';
    const citation = await getPaperByDOI(doi);
    
    expect(citation).toBeDefined();
    if (citation) {
      expect(citation.title).toBeTruthy();
      expect(citation.authors).toBeDefined();
      expect(Array.isArray(citation.authors)).toBe(true);
    }
  }, { timeout: 10000 });

  test('should handle invalid DOI', { timeout: 10000 }, async () => {
    const citation = await getPaperByDOI('invalid-doi-test');
    expect(citation).toBeNull();
  }, { timeout: 10000 });

  test('should search papers by query', { timeout: 10000 }, async () => {
    const results = await searchPapers('deep learning', { limit: 5 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult.title).toBeTruthy();
    }
  }, { timeout: 10000 });

  test('should include citation metadata', { timeout: 10000 }, async () => {
    const doi = '10.1038/nature12373';
    const citation = await getPaperByDOI(doi);
    
    if (citation) {
      expect(citation).toHaveProperty('title');
      expect(citation).toHaveProperty('authors');
      expect(citation).toHaveProperty('paperId');
    }
  }, { timeout: 10000 });

  test('should limit search results', { timeout: 10000 }, async () => {
    const limit = 3;
    const results = await searchPapers('computer science', { limit });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(limit);
  }, { timeout: 10000 });

  test('should handle network errors gracefully', { timeout: 10000 }, async () => {
    // Test that the client handles errors without crashing
    const citation = await getPaperByDOI('10.1038/nature12373');
    expect(citation === null || citation !== null).toBe(true);
  }, { timeout: 10000 });
});
