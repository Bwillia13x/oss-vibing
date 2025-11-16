/**
 * Semantic Scholar API Integration
 * Sprint 2: Real Citation API Implementation
 * 
 * API Documentation: https://api.semanticscholar.org/api-docs/
 */

import type { CitationData, Author, PaperSource } from '@/ai/tools/types';

export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
  title?: string;
  abstract?: string;
  year?: number;
  authors?: Array<{
    authorId: string;
    name: string;
  }>;
  venue?: string;
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  fieldsOfStudy?: string[];
  url?: string;
}

export interface SemanticScholarSearchResponse {
  total: number;
  offset: number;
  next?: number;
  data: SemanticScholarPaper[];
}

export class SemanticScholarClient {
  private baseURL = 'https://api.semanticscholar.org/graph/v1';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  /**
   * Build request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    
    return headers;
  }

  /**
   * Search for papers by query
   */
  async search(query: string, limit = 10): Promise<PaperSource[]> {
    try {
      const fields = 'paperId,externalIds,title,abstract,year,authors,venue,citationCount,openAccessPdf,url';
      const url = `${this.baseURL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Semantic Scholar search error: ${response.status}`);
        return [];
      }

      const data: SemanticScholarSearchResponse = await response.json();
      
      return data.data.map(paper => this.formatPaperSource(paper));
    } catch (error) {
      console.error('Error searching Semantic Scholar:', error);
      return [];
    }
  }

  /**
   * Get paper by DOI
   */
  async getByDOI(doi: string): Promise<CitationData | null> {
    try {
      const cleanDOI = doi.replace('https://doi.org/', '').trim();
      const fields = 'paperId,externalIds,title,abstract,year,authors,venue,citationCount,url';
      const url = `${this.baseURL}/paper/DOI:${encodeURIComponent(cleanDOI)}?fields=${fields}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Semantic Scholar DOI lookup error: ${response.status}`);
        return null;
      }

      const paper: SemanticScholarPaper = await response.json();
      
      return this.formatCitation(paper);
    } catch (error) {
      console.error('Error getting paper from Semantic Scholar:', error);
      return null;
    }
  }

  /**
   * Get paper by Semantic Scholar ID
   */
  async getById(paperId: string): Promise<CitationData | null> {
    try {
      const fields = 'paperId,externalIds,title,abstract,year,authors,venue,citationCount,url';
      const url = `${this.baseURL}/paper/${paperId}?fields=${fields}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const paper: SemanticScholarPaper = await response.json();
      
      return this.formatCitation(paper);
    } catch (error) {
      console.error('Error getting paper from Semantic Scholar:', error);
      return null;
    }
  }

  /**
   * Get citations for a paper
   */
  async getCitations(paperId: string, limit = 10): Promise<PaperSource[]> {
    try {
      const fields = 'paperId,externalIds,title,abstract,year,authors,venue,citationCount,url';
      const url = `${this.baseURL}/paper/${paperId}/citations?limit=${limit}&fields=${fields}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data: { data: Array<{ citingPaper: SemanticScholarPaper }> } = await response.json();
      
      return data.data.map(item => this.formatPaperSource(item.citingPaper));
    } catch (error) {
      console.error('Error getting citations from Semantic Scholar:', error);
      return [];
    }
  }

  /**
   * Get references for a paper
   */
  async getReferences(paperId: string, limit = 10): Promise<PaperSource[]> {
    try {
      const fields = 'paperId,externalIds,title,abstract,year,authors,venue,citationCount,url';
      const url = `${this.baseURL}/paper/${paperId}/references?limit=${limit}&fields=${fields}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data: { data: Array<{ citedPaper: SemanticScholarPaper }> } = await response.json();
      
      return data.data.map(item => this.formatPaperSource(item.citedPaper));
    } catch (error) {
      console.error('Error getting references from Semantic Scholar:', error);
      return [];
    }
  }

  /**
   * Format Semantic Scholar paper to standard CitationData
   */
  private formatCitation(paper: SemanticScholarPaper): CitationData | null {
    if (!paper || !paper.title) {
      return null;
    }

    const authors: Author[] = (paper.authors || []).map(author => {
      const nameParts = author.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        // Single name - treat as family name
        return {
          family: nameParts[0],
          given: '',
        };
      }
      return {
        family: nameParts[nameParts.length - 1],
        given: nameParts.slice(0, -1).join(' '),
      };
    });

    return {
      title: paper.title,
      authors,
      year: paper.year || new Date().getFullYear(),
      doi: paper.externalIds?.DOI,
      url: paper.url || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined),
      journal: paper.venue,
      abstract: paper.abstract,
    };
  }

  /**
   * Format Semantic Scholar paper to PaperSource
   */
  private formatPaperSource(paper: SemanticScholarPaper): PaperSource {
    const title = paper.title || 'Untitled';
    
    const authors: Author[] = (paper.authors || []).map(author => {
      const nameParts = author.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        // Single name - treat as family name
        return {
          family: nameParts[0],
          given: '',
        };
      }
      return {
        family: nameParts[nameParts.length - 1],
        given: nameParts.slice(0, -1).join(' '),
      };
    });

    return {
      id: paper.paperId,
      title,
      authors,
      year: paper.year || new Date().getFullYear(),
      doi: paper.externalIds?.DOI,
      url: paper.openAccessPdf?.url || paper.url || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined),
      citationCount: paper.citationCount,
      abstract: paper.abstract,
      source: 'semantic-scholar',
    };
  }
}

// Singleton instance with caching
let semanticScholarClient: SemanticScholarClient | null = null;

export function getSemanticScholarClient(): SemanticScholarClient {
  if (!semanticScholarClient) {
    semanticScholarClient = new SemanticScholarClient();
  }
  return semanticScholarClient;
}
