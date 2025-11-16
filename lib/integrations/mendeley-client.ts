/**
 * Mendeley Integration Client
 * 
 * Integrates with Mendeley reference manager for syncing citations and references.
 * Uses Mendeley Data API for accessing user's library.
 * 
 * Phase 15 Implementation
 */

export interface MendeleyConfig {
  accessToken: string;
}

export interface MendeleyDocument {
  id: string;
  title: string;
  type: string;
  authors?: Array<{
    first_name?: string;
    last_name: string;
  }>;
  year?: number;
  identifiers?: {
    doi?: string;
    isbn?: string;
    issn?: string;
    pmid?: string;
  };
  source?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  abstract?: string;
  websites?: string[];
  tags?: string[];
  created: string;
  last_modified: string;
}

export interface MendeleyFolder {
  id: string;
  name: string;
  parent_id?: string;
  created: string;
  modified: string;
}

/**
 * Mendeley Data API Client
 */
export class MendeleyClient {
  private accessToken: string;
  private baseUrl = 'https://api.mendeley.com';

  constructor(config: MendeleyConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Make authenticated request to Mendeley API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Mendeley API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get all documents from Mendeley library
   */
  async getDocuments(options: {
    limit?: number;
    view?: 'bib' | 'client' | 'tags' | 'patent' | 'all';
    sort?: 'created' | 'last_modified' | 'title';
    order?: 'asc' | 'desc';
  } = {}): Promise<MendeleyDocument[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.view) params.set('view', options.view);
    if (options.sort) params.set('sort', options.sort);
    if (options.order) params.set('order', options.order);

    return this.request<MendeleyDocument[]>(
      `/documents?${params.toString()}`
    );
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<MendeleyDocument> {
    return this.request<MendeleyDocument>(`/documents/${documentId}`);
  }

  /**
   * Create a new document
   */
  async createDocument(
    document: Partial<MendeleyDocument>
  ): Promise<MendeleyDocument> {
    return this.request<MendeleyDocument>('/documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    documentId: string,
    document: Partial<MendeleyDocument>
  ): Promise<MendeleyDocument> {
    return this.request<MendeleyDocument>(`/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(document),
    });
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string, limit = 50): Promise<MendeleyDocument[]> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    return this.request<MendeleyDocument[]>(
      `/search/catalog?${params.toString()}`
    );
  }

  /**
   * Get all folders
   */
  async getFolders(): Promise<MendeleyFolder[]> {
    return this.request<MendeleyFolder[]>('/folders');
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentId?: string
  ): Promise<MendeleyFolder> {
    return this.request<MendeleyFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify({
        name,
        parent_id: parentId,
      }),
    });
  }

  /**
   * Get documents in a folder
   */
  async getDocumentsInFolder(
    folderId: string
  ): Promise<MendeleyDocument[]> {
    return this.request<MendeleyDocument[]>(
      `/folders/${folderId}/documents`
    );
  }

  /**
   * Add document to folder
   */
  async addDocumentToFolder(
    folderId: string,
    documentId: string
  ): Promise<void> {
    await this.request(`/folders/${folderId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ id: documentId }),
    });
  }

  /**
   * Get documents by DOI
   */
  async getDocumentsByDOI(doi: string): Promise<MendeleyDocument[]> {
    const documents = await this.getDocuments({ view: 'all' });
    return documents.filter((doc) => doc.identifiers?.doi === doi);
  }

  /**
   * Get documents by tag
   */
  async getDocumentsByTag(tag: string): Promise<MendeleyDocument[]> {
    const documents = await this.getDocuments({ view: 'tags' });
    return documents.filter(
      (doc) => doc.tags && doc.tags.includes(tag)
    );
  }

  /**
   * Convert Mendeley document to CSL-JSON format
   */
  toCSL(doc: MendeleyDocument): Record<string, any> {
    const csl: Record<string, any> = {
      id: doc.id,
      type: this.mapDocumentType(doc.type),
    };

    if (doc.title) csl.title = doc.title;
    if (doc.identifiers?.doi) csl.DOI = doc.identifiers.doi;
    if (doc.identifiers?.isbn) csl.ISBN = doc.identifiers.isbn;
    if (doc.websites && doc.websites.length > 0) {
      csl.URL = doc.websites[0];
    }
    if (doc.source) csl['container-title'] = doc.source;
    if (doc.volume) csl.volume = doc.volume;
    if (doc.issue) csl.issue = doc.issue;
    if (doc.pages) csl.page = doc.pages;
    if (doc.abstract) csl.abstract = doc.abstract;

    // Add year
    if (doc.year) {
      csl.issued = { 'date-parts': [[doc.year]] };
    }

    // Convert authors
    if (doc.authors && doc.authors.length > 0) {
      csl.author = doc.authors.map((author) => ({
        given: author.first_name,
        family: author.last_name,
      }));
    }

    return csl;
  }

  /**
   * Map Mendeley document type to CSL type
   */
  private mapDocumentType(mendeleyType: string): string {
    const typeMap: Record<string, string> = {
      journal: 'article-journal',
      book: 'book',
      'book_section': 'chapter',
      'conference_proceedings': 'paper-conference',
      'working_paper': 'article',
      report: 'report',
      'web_page': 'webpage',
      thesis: 'thesis',
      patent: 'patent',
      'generic': 'article',
    };

    return typeMap[mendeleyType] || 'article';
  }
}

/**
 * Sync Vibe University references with Mendeley
 */
export async function syncWithMendeley(
  client: MendeleyClient,
  vibeReferences: Array<{ doi?: string; title: string }>
): Promise<{
  imported: number;
  updated: number;
  errors: string[];
}> {
  const result: {
    imported: number;
    updated: number;
    errors: string[];
  } = {
    imported: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Get all documents from Mendeley
    const mendeleyDocs = await client.getDocuments({ view: 'all', limit: 1000 });

    // Create a map of existing documents by DOI
    const mendeleyDocsByDOI = new Map<string, MendeleyDocument>();
    mendeleyDocs.forEach((doc) => {
      if (doc.identifiers?.doi) {
        mendeleyDocsByDOI.set(doc.identifiers.doi, doc);
      }
    });

    // Sync each Vibe reference
    for (const ref of vibeReferences) {
      if (!ref.doi) continue;

      try {
        const existing = mendeleyDocsByDOI.get(ref.doi);

        if (existing) {
          // Document already exists
          result.updated++;
        } else {
          // Import new document to Mendeley
          await client.createDocument({
            type: 'journal',
            title: ref.title,
            identifiers: {
              doi: ref.doi,
            },
          });
          result.imported++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to sync ${ref.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  } catch (error) {
    result.errors.push(
      `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}
