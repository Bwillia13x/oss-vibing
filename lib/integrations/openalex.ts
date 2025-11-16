/**
 * OpenAlex API Integration
 * Sprint 2: Real Citation API Implementation
 * 
 * API Documentation: https://docs.openalex.org/
 */

import type { CitationData, Author, PaperSource } from '@/ai/tools/types';

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  authorships?: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions?: Array<{
      id: string;
      display_name: string;
    }>;
  }>;
  primary_location?: {
    source?: {
      display_name?: string;
    };
  };
  cited_by_count?: number;
  abstract_inverted_index?: Record<string, number[]>;
  open_access?: {
    is_oa: boolean;
    oa_url?: string;
  };
}

export interface OpenAlexResponse {
  results: OpenAlexWork[];
  meta: {
    count: number;
    per_page: number;
    page: number;
  };
}

export class OpenAlexClient {
  private baseURL = 'https://api.openalex.org';
  private email: string | undefined;

  constructor(email?: string) {
    this.email = email || process.env.OPENALEX_EMAIL;
  }

  /**
   * Build request headers with polite pool access
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'User-Agent': 'VibeUniversity/1.0 (https://github.com/Bwillia13x/oss-vibing)',
    };
    
    if (this.email) {
      headers['mailto'] = this.email;
    }
    
    return headers;
  }

  /**
   * Search for works by query
   */
  async searchWorks(query: string, limit = 10): Promise<PaperSource[]> {
    try {
      const url = `${this.baseURL}/works?search=${encodeURIComponent(query)}&per-page=${limit}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`OpenAlex search error: ${response.status}`);
        return [];
      }

      const data: OpenAlexResponse = await response.json();
      
      return data.results.map(work => this.formatPaperSource(work));
    } catch (error) {
      console.error('Error searching OpenAlex:', error);
      return [];
    }
  }

  /**
   * Get work by DOI
   */
  async getByDOI(doi: string): Promise<CitationData | null> {
    try {
      const cleanDOI = doi.replace('https://doi.org/', '').trim();
      const url = `${this.baseURL}/works/doi:${encodeURIComponent(cleanDOI)}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`OpenAlex DOI lookup error: ${response.status}`);
        return null;
      }

      const work: OpenAlexWork = await response.json();
      
      return this.formatCitation(work);
    } catch (error) {
      console.error('Error getting work from OpenAlex:', error);
      return null;
    }
  }

  /**
   * Get related works
   */
  async getRelatedWorks(workId: string, limit = 5): Promise<PaperSource[]> {
    try {
      const url = `${this.baseURL}/works?filter=cited_by:${workId}&per-page=${limit}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data: OpenAlexResponse = await response.json();
      
      return data.results.map(work => this.formatPaperSource(work));
    } catch (error) {
      console.error('Error getting related works from OpenAlex:', error);
      return [];
    }
  }

  /**
   * Format OpenAlex work to standard CitationData
   */
  private formatCitation(work: OpenAlexWork): CitationData | null {
    const title = work.display_name || work.title;
    if (!title) {
      return null;
    }

    const authors: Author[] = (work.authorships || []).map(authorship => ({
      family: authorship.author.display_name.split(' ').slice(-1)[0],
      given: authorship.author.display_name.split(' ').slice(0, -1).join(' '),
      affiliation: authorship.institutions?.map(inst => ({ name: inst.display_name })),
    }));

    return {
      title,
      authors,
      year: work.publication_year || new Date().getFullYear(),
      doi: work.doi,
      url: work.doi ? `https://doi.org/${work.doi}` : work.id,
      journal: work.primary_location?.source?.display_name,
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
    };
  }

  /**
   * Format OpenAlex work to PaperSource
   */
  private formatPaperSource(work: OpenAlexWork): PaperSource {
    const title = work.display_name || work.title || 'Untitled';
    
    const authors: Author[] = (work.authorships || []).map(authorship => ({
      family: authorship.author.display_name.split(' ').slice(-1)[0],
      given: authorship.author.display_name.split(' ').slice(0, -1).join(' '),
    }));

    return {
      id: work.id,
      title,
      authors,
      year: work.publication_year || new Date().getFullYear(),
      doi: work.doi,
      url: work.open_access?.oa_url || (work.doi ? `https://doi.org/${work.doi}` : work.id),
      citationCount: work.cited_by_count,
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
      source: 'openalex',
    };
  }

  /**
   * Reconstruct abstract from inverted index
   */
  private reconstructAbstract(invertedIndex?: Record<string, number[]>): string | undefined {
    if (!invertedIndex) {
      return undefined;
    }

    try {
      const words: Array<{ word: string; position: number }> = [];
      
      for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const position of positions) {
          words.push({ word, position });
        }
      }
      
      words.sort((a, b) => a.position - b.position);
      
      return words.map(w => w.word).join(' ');
    } catch (error) {
      return undefined;
    }
  }
}

// Singleton instance with caching
let openAlexClient: OpenAlexClient | null = null;

export function getOpenAlexClient(): OpenAlexClient {
  if (!openAlexClient) {
    openAlexClient = new OpenAlexClient();
  }
  return openAlexClient;
}
