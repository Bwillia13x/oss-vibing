/**
 * Unit Tests for Citation System
 * Tests citation formatting and verification
 */

import { describe, it, expect } from 'vitest';
import {
  formatCitation,
  formatBibliography,
  generateCitationId,
  validateCitation,
  parseAuthors,
  getStyleInfo,
  convertToCSL,
  convertFromCSL,
  type CitationInput,
} from '@/lib/citations/formatter';
import {
  analyzeCitationCoverage,
  verifyQuotes,
  detectStaleCitations,
  detectFabrication,
  calculateQualityScore,
  calculateIntegrityScore,
  generateRecommendations,
  verifyCitations,
} from '@/lib/citations/verifier';

describe('Citation Formatter', () => {
  const sampleCitation: CitationInput = {
    title: 'Climate Change and Global Warming',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2023,
    journal: 'Nature',
    volume: '615',
    pages: '123-130',
    doi: '10.1038/nature12345',
  };

  it('should format APA in-text citation', () => {
    const result = formatCitation(sampleCitation, {
      style: 'apa',
      type: 'in-text',
    });
    
    expect(result).toContain('Smith');
    expect(result).toContain('2023');
  });

  it('should format MLA in-text citation', () => {
    const result = formatCitation(sampleCitation, {
      style: 'mla',
      type: 'in-text',
    });
    
    expect(result).toContain('Smith');
  });

  it('should format Chicago in-text citation', () => {
    const result = formatCitation(sampleCitation, {
      style: 'chicago',
      type: 'in-text',
    });
    
    expect(result).toContain('Smith');
    expect(result).toContain('2023');
  });

  it('should format APA bibliography entry', () => {
    const result = formatCitation(sampleCitation, {
      style: 'apa',
      type: 'bibliography',
    });
    
    expect(result).toContain('Smith');
    expect(result).toContain('Climate Change and Global Warming');
    expect(result).toContain('2023');
  });

  it('should format bibliography with multiple citations', () => {
    const citations = [
      sampleCitation,
      {
        ...sampleCitation,
        title: 'Another Paper',
        authors: [{ family: 'Jones', given: 'Jane' }],
        year: 2024,
      },
    ];
    
    const result = formatBibliography(citations, { style: 'apa' });
    
    expect(result).toContain('Smith');
    expect(result).toContain('Jones');
  });

  it('should generate unique citation ID', () => {
    const id = generateCitationId(sampleCitation);
    
    expect(id).toBeTruthy();
    expect(id).toContain('smith');
    expect(id).toContain('2023');
  });

  it('should validate complete citation', () => {
    const result = validateCitation(sampleCitation);
    
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should detect missing fields', () => {
    const incomplete = {
      title: 'Paper',
      // Missing authors and year
    };
    
    const result = validateCitation(incomplete);
    
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('authors');
    expect(result.missing).toContain('year');
  });

  it('should parse author names', () => {
    const result = parseAuthors('John Smith, Jane Doe');
    
    expect(result).toHaveLength(2);
    expect(result[0].family).toBe('Smith');
    expect(result[0].given).toBe('John');
  });

  it('should get style information', () => {
    const info = getStyleInfo('apa');
    
    expect(info.name).toBeTruthy();
    expect(info.version).toBeTruthy();
  });

  it('should convert to CSL JSON', () => {
    const csl = convertToCSL(sampleCitation);
    
    expect(csl.type).toBe('article-journal');
    expect(csl.title).toBe(sampleCitation.title);
  });

  it('should convert from CSL JSON', () => {
    const csl = convertToCSL(sampleCitation);
    const citation = convertFromCSL(csl);
    
    expect(citation.title).toBe(sampleCitation.title);
    expect(citation.year).toBe(sampleCitation.year);
  });
});

describe('Citation Verifier', () => {
  const documentContent = `
Research shows that climate change is accelerating (Smith, 2023).
The data indicates a 2°C increase in global temperatures.
"The evidence is overwhelming" (Smith, 2023, p. 45).
According to studies, sea levels are rising at an unprecedented rate.
Another study found similar results (Jones, 2024).
  `;

  const citations = [
    {
      id: 'smith2023',
      title: 'Climate Change Study',
      authors: [{ family: 'Smith', given: 'John' }],
      year: 2023,
      doi: '10.1038/nature12345',
    },
    {
      id: 'jones2024',
      title: 'Sea Level Rise',
      authors: [{ family: 'Jones', given: 'Jane' }],
      year: 2024,
      doi: '10.1038/nature67890',
    },
  ];

  it('should analyze citation coverage', () => {
    const result = analyzeCitationCoverage(documentContent);
    
    expect(result.totalSentences).toBeGreaterThan(0);
    expect(result.citedSentences).toBeGreaterThan(0);
    expect(result.coveragePct).toBeGreaterThan(0);
  });

  it('should detect uncited claims', () => {
    const result = analyzeCitationCoverage(documentContent);
    
    expect(result.uncitedClaims).toBeDefined();
    expect(Array.isArray(result.uncitedClaims)).toBe(true);
  });

  it('should verify quotes have citations', () => {
    const result = verifyQuotes(documentContent);
    
    expect(result.totalQuotes).toBeGreaterThan(0);
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('should detect stale citations', async () => {
    const oldCitation = {
      ...citations[0],
      year: 2010, // Over 10 years old
    };
    
    const result = await detectStaleCitations([oldCitation]);
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('should detect potentially fabricated citations', async () => {
    const suspiciousCitation = {
      id: 'fake',
      title: 'Untitled Paper',
      authors: [{ family: 'Unknown', given: '' }],
      year: 2023,
      doi: 'invalid-doi',
    };
    
    const result = await detectFabrication([suspiciousCitation]);
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('should calculate quality score', () => {
    const score = calculateQualityScore(citations[0]);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate integrity score', () => {
    const verificationResults = {
      coveragePct: 80,
      uncitedClaims: [],
      quoteIssues: [],
      fabricatedCitations: [],
    };
    
    const score = calculateIntegrityScore(verificationResults);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should generate recommendations', () => {
    const verificationResults = {
      coveragePct: 65,
      uncitedClaims: [{ text: 'Uncited claim', severity: 'high' as const, reason: 'test' }],
      quoteIssues: [],
      fabricatedCitations: [],
      staleCitations: [],
    };
    
    const recommendations = generateRecommendations(verificationResults);
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should perform comprehensive verification', async () => {
    const result = await verifyCitations(documentContent, citations, {
      checkCoverage: true,
      checkQuotes: true,
      checkStaleness: false,
      checkFabrication: false,
      enableAPIChecks: false,
    });
    
    expect(result.coveragePct).toBeDefined();
    expect(result.integrityScore).toBeDefined();
    expect(result.status).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});
