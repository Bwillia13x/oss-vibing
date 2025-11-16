/**
 * Crossref API Integration
 * Sprint 2: Real Citation API Implementation
 * 
 * API Documentation: https://api.crossref.org/swagger-ui/index.html
 */

import type { CitationData, Author } from '@/ai/tools/types';

export interface CrossrefWork {
  DOI: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family: string;
    sequence?: string;
    affiliation?: Array<{ name: string }>;
  }>;
  'published-print'?: { 'date-parts'?: number[][] };
  'published-online'?: { 'date-parts'?: number[][] };
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  abstract?: string;
  'is-referenced-by-count'?: number;
  URL?: string;
}

export interface CrossrefResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: CrossrefWork | {
    items: CrossrefWork[];
    'total-results': number;
  };
}

export class CrossrefClient {
  private baseURL = 'https://api.crossref.org';
  private email: string | undefined;

  constructor(email?: string) {
    this.email = email || process.env.CROSSREF_EMAIL;
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
   * Resolve a DOI to get full citation data
   */
  async resolveDOI(doi: string): Promise<CitationData | null> {
    try {
      const cleanDOI = doi.replace('https://doi.org/', '').trim();
      const url = `${this.baseURL}/works/${encodeURIComponent(cleanDOI)}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Crossref API error: ${response.status}`);
        return null;
      }

      const data: CrossrefResponse = await response.json();
      const work = data.message as CrossrefWork;
      
      return this.formatCitation(work);
    } catch (error) {
      console.error('Error resolving DOI from Crossref:', error);
      return null;
    }
  }

  /**
   * Search for works by query
   */
  async search(query: string, limit = 10): Promise<CitationData[]> {
    try {
      const url = `${this.baseURL}/works?query=${encodeURIComponent(query)}&rows=${limit}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Crossref search error: ${response.status}`);
        return [];
      }

      const data: CrossrefResponse = await response.json();
      const message = data.message as { items: CrossrefWork[] };
      
      return message.items.map(work => this.formatCitation(work)).filter((c): c is CitationData => c !== null);
    } catch (error) {
      console.error('Error searching Crossref:', error);
      return [];
    }
  }

  /**
   * Get citation count for a DOI
   */
  async getCitationCount(doi: string): Promise<number> {
    try {
      const cleanDOI = doi.replace('https://doi.org/', '').trim();
      const url = `${this.baseURL}/works/${encodeURIComponent(cleanDOI)}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return 0;
      }

      const data: CrossrefResponse = await response.json();
      const work = data.message as CrossrefWork;
      
      return work['is-referenced-by-count'] || 0;
    } catch (error) {
      console.error('Error getting citation count from Crossref:', error);
      return 0;
    }
  }

  /**
   * Format Crossref work to standard CitationData
   */
  private formatCitation(work: CrossrefWork): CitationData | null {
    if (!work || !work.title || work.title.length === 0) {
      return null;
    }

    const authors: Author[] = (work.author || []).map(author => ({
      given: author.given,
      family: author.family,
      sequence: author.sequence,
      affiliation: author.affiliation,
    }));

    // Get year from published-print or published-online
    const dateParts = work['published-print']?.['date-parts']?.[0] || 
                      work['published-online']?.['date-parts']?.[0];
    const year = dateParts ? dateParts[0] : new Date().getFullYear();

    return {
      title: work.title[0],
      authors,
      year,
      doi: work.DOI,
      url: work.URL || `https://doi.org/${work.DOI}`,
      journal: work['container-title']?.[0],
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      publisher: work.publisher,
      abstract: work.abstract,
    };
  }
}

// Singleton instance with caching
let crossrefClient: CrossrefClient | null = null;

export function getCrossrefClient(): CrossrefClient {
  if (!crossrefClient) {
    crossrefClient = new CrossrefClient();
  }
  return crossrefClient;
}
