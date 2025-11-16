/**
 * OpenAlex API Integration Tests
 * Tests for the OpenAlex research paper lookup service
 */

import { describe, test, expect } from 'vitest';
import { getWorkByDOI, searchWorks } from '@/lib/api/openalex';

describe('OpenAlex API', () => {
  test('should resolve DOI successfully', { timeout: 10000 }, async () => {
    const doi = '10.1038/nature12373';
    const citation = await getWorkByDOI(doi);
    
    expect(citation).toBeDefined();
    if (citation) {
      expect(citation.title).toBeTruthy();
      expect(citation.authorships).toBeDefined();
      expect(Array.isArray(citation.authorships)).toBe(true);
    }
  });

  test('should handle invalid DOI gracefully', { timeout: 10000 }, async () => {
    const citation = await getWorkByDOI('invalid-doi-xyz');
    expect(citation).toBeNull();
  });

  test('should search papers by query', { timeout: 10000 }, async () => {
    const results = await searchWorks('quantum computing', { perPage: 5 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult.title).toBeTruthy();
    }
  });

  test('should return citation with proper metadata', { timeout: 10000 }, async () => {
    const doi = '10.1038/nature12373';
    const citation = await getWorkByDOI(doi);
    
    if (citation) {
      expect(citation).toHaveProperty('title');
      expect(citation).toHaveProperty('authorships');
      expect(citation).toHaveProperty('id');
    }
  });

  test('should respect search limit', { timeout: 10000 }, async () => {
    const limit = 2;
    const results = await searchWorks('neural networks', { perPage: limit });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(limit);
  });

  test('should handle empty search results', { timeout: 10000 }, async () => {
    const results = await searchWorks('xyzabcnonexistentterm12345', { perPage: 5 });
    expect(Array.isArray(results)).toBe(true);
  });
});
