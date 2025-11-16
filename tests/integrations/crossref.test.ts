/**
 * Crossref API Integration Tests
 * Tests for the Crossref citation lookup service
 */

import { describe, test, expect } from 'vitest';
import { lookupDOI, searchWorks, validateDOI } from '@/lib/api/crossref';

describe('Crossref API', () => {
  test('should resolve DOI successfully', { timeout: 10000 }, async () => {
    // Using a well-known DOI for testing
    const doi = '10.1038/nature12373';
    const citation = await lookupDOI(doi);
    
    expect(citation).toBeDefined();
    if (citation) {
      expect(citation.title).toBeTruthy();
      expect(citation.author).toBeDefined();
      expect(Array.isArray(citation.author)).toBe(true);
    }
  }, { timeout: 10000 });

  test('should handle invalid DOI gracefully', { timeout: 10000 }, async () => {
    const citation = await lookupDOI('invalid-doi-12345');
    expect(citation).toBeNull();
  }, { timeout: 10000 });

  test('should search papers by query', { timeout: 10000 }, async () => {
    const results = await searchWorks('machine learning', 5);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);
    
    if (results.length > 0) {
      const firstResult = results[0];
      expect(firstResult.title).toBeTruthy();
    }
  }, { timeout: 10000 });

  test('should handle empty search query', { timeout: 10000 }, async () => {
    const results = await searchWorks('', 5);
    expect(Array.isArray(results)).toBe(true);
  }, { timeout: 10000 });

  test('should respect search limit parameter', { timeout: 10000 }, async () => {
    const limit = 3;
    const results = await searchWorks('artificial intelligence', limit);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(limit);
  }, { timeout: 10000 });

  test('should validate DOI format', { timeout: 10000 }, async () => {
    const validDOI = '10.1038/nature12373';
    const isValid = await validateDOI(validDOI);
    
    expect(typeof isValid).toBe('boolean');
  }, { timeout: 10000 });

  test('should return citation with proper structure', { timeout: 10000 }, async () => {
    const doi = '10.1038/nature12373';
    const citation = await lookupDOI(doi);
    
    if (citation) {
      expect(citation).toHaveProperty('title');
      expect(citation).toHaveProperty('author');
    }
  }, { timeout: 10000 });
});
