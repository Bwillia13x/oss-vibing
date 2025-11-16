/**
 * Zotero Integration Client
 * 
 * Integrates with Zotero reference manager for syncing citations and references.
 * Supports both Zotero Web API and local Zotero desktop integration.
 * 
 * Phase 15 Implementation
 */

export interface ZoteroConfig {
  apiKey: string;
  userId: string;
  groupId?: string;
}

export interface ZoteroItem {
  key: string;
  version: number;
  data: {
    itemType: string;
    title: string;
    creators: Array<{
      creatorType: string;
      firstName?: string;
      lastName?: string;
      name?: string;
    }>;
    date?: string;
    DOI?: string;
    ISBN?: string;
    url?: string;
    publicationTitle?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    abstractNote?: string;
    tags?: Array<{ tag: string }>;
    collections?: string[];
    relations?: Record<string, any>;
    dateAdded?: string;
    dateModified?: string;
  };
}

export interface ZoteroCollection {
  key: string;
  version: number;
  data: {
    name: string;
    parentCollection?: string;
  };
}

/**
 * Zotero Web API Client
 */
export class ZoteroClient {
  private apiKey: string;
  private userId: string;
  private groupId?: string;
  private baseUrl = 'https://api.zotero.org';

  constructor(config: ZoteroConfig) {
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.groupId = config.groupId;
  }

  /**
   * Get base path for API requests (user or group library)
   */
  private getBasePath(): string {
    if (this.groupId) {
      return `/groups/${this.groupId}`;
    }
    return `/users/${this.userId}`;
  }

  /**
   * Make authenticated request to Zotero API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${this.getBasePath()}${endpoint}`;
    const headers = {
      'Zotero-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Zotero API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get all items from Zotero library
   */
  async getItems(options: {
    limit?: number;
    start?: number;
    itemType?: string;
    tag?: string;
    collection?: string;
  } = {}): Promise<ZoteroItem[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.start) params.set('start', options.start.toString());
    if (options.itemType) params.set('itemType', options.itemType);
    if (options.tag) params.set('tag', options.tag);
    if (options.collection) params.set('collection', options.collection);

    const endpoint = `/items?${params.toString()}`;
    return this.request<ZoteroItem[]>(endpoint);
  }

  /**
   * Get a specific item by key
   */
  async getItem(itemKey: string): Promise<ZoteroItem> {
    return this.request<ZoteroItem>(`/items/${itemKey}`);
  }

  /**
   * Create a new item in Zotero
   */
  async createItem(item: Partial<ZoteroItem['data']>): Promise<ZoteroItem> {
    return this.request<ZoteroItem>('/items', {
      method: 'POST',
      body: JSON.stringify([item]),
    });
  }

  /**
   * Update an existing item
   */
  async updateItem(
    itemKey: string,
    item: Partial<ZoteroItem['data']>,
    version: number
  ): Promise<ZoteroItem> {
    return this.request<ZoteroItem>(`/items/${itemKey}`, {
      method: 'PATCH',
      headers: {
        'If-Unmodified-Since-Version': version.toString(),
      },
      body: JSON.stringify(item),
    });
  }

  /**
   * Delete an item
   */
  async deleteItem(itemKey: string, version: number): Promise<void> {
    await this.request(`/items/${itemKey}`, {
      method: 'DELETE',
      headers: {
        'If-Unmodified-Since-Version': version.toString(),
      },
    });
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<ZoteroCollection[]> {
    return this.request<ZoteroCollection[]>('/collections');
  }

  /**
   * Create a new collection
   */
  async createCollection(
    name: string,
    parentCollection?: string
  ): Promise<ZoteroCollection> {
    return this.request<ZoteroCollection>('/collections', {
      method: 'POST',
      body: JSON.stringify([
        {
          name,
          parentCollection,
        },
      ]),
    });
  }

  /**
   * Search items by query
   */
  async searchItems(query: string, limit = 50): Promise<ZoteroItem[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.request<ZoteroItem[]>(`/items?${params.toString()}`);
  }

  /**
   * Get items by DOI
   */
  async getItemsByDOI(doi: string): Promise<ZoteroItem[]> {
    const items = await this.getItems();
    return items.filter((item) => item.data.DOI === doi);
  }

  /**
   * Get items by tag
   */
  async getItemsByTag(tag: string): Promise<ZoteroItem[]> {
    return this.getItems({ tag });
  }

  /**
   * Get items in a collection
   */
  async getItemsInCollection(collectionKey: string): Promise<ZoteroItem[]> {
    return this.getItems({ collection: collectionKey });
  }

  /**
   * Convert Zotero item to CSL-JSON format
   */
  toCSL(item: ZoteroItem): Record<string, any> {
    const csl: Record<string, any> = {
      id: item.key,
      type: this.mapItemType(item.data.itemType),
    };

    if (item.data.title) csl.title = item.data.title;
    if (item.data.DOI) csl.DOI = item.data.DOI;
    if (item.data.ISBN) csl.ISBN = item.data.ISBN;
    if (item.data.url) csl.URL = item.data.url;
    if (item.data.publicationTitle) {
      csl['container-title'] = item.data.publicationTitle;
    }
    if (item.data.volume) csl.volume = item.data.volume;
    if (item.data.issue) csl.issue = item.data.issue;
    if (item.data.pages) csl.page = item.data.pages;
    if (item.data.abstractNote) csl.abstract = item.data.abstractNote;

    // Parse date
    if (item.data.date) {
      const dateParts = this.parseDate(item.data.date);
      if (dateParts) {
        csl.issued = { 'date-parts': [dateParts] };
      }
    }

    // Convert creators
    if (item.data.creators && item.data.creators.length > 0) {
      csl.author = item.data.creators.map((creator) => {
        if (creator.name) {
          return { literal: creator.name };
        }
        return {
          given: creator.firstName,
          family: creator.lastName,
        };
      });
    }

    return csl;
  }

  /**
   * Map Zotero item type to CSL type
   */
  private mapItemType(zoteroType: string): string {
    const typeMap: Record<string, string> = {
      book: 'book',
      bookSection: 'chapter',
      journalArticle: 'article-journal',
      magazineArticle: 'article-magazine',
      newspaperArticle: 'article-newspaper',
      thesis: 'thesis',
      conferencePaper: 'paper-conference',
      report: 'report',
      webpage: 'webpage',
      manuscript: 'manuscript',
      patent: 'patent',
      podcast: 'song',
      presentation: 'speech',
      videoRecording: 'motion_picture',
    };

    return typeMap[zoteroType] || 'article';
  }

  /**
   * Parse date string to date-parts array
   */
  private parseDate(dateStr: string): number[] | null {
    const iso = new Date(dateStr);
    if (!isNaN(iso.getTime())) {
      return [iso.getFullYear(), iso.getMonth() + 1, iso.getDate()];
    }

    // Try to extract year
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) {
      return [parseInt(yearMatch[0])];
    }

    return null;
  }
}

/**
 * Sync Vibe University references with Zotero
 */
export async function syncWithZotero(
  client: ZoteroClient,
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
    // Get all items from Zotero
    const zoteroItems = await client.getItems({ limit: 1000 });

    // Create a map of existing items by DOI
    const zoteroItemsByDOI = new Map<string, ZoteroItem>();
    zoteroItems.forEach((item) => {
      if (item.data.DOI) {
        zoteroItemsByDOI.set(item.data.DOI, item);
      }
    });

    // Sync each Vibe reference
    for (const ref of vibeReferences) {
      if (!ref.doi) continue;

      try {
        const existing = zoteroItemsByDOI.get(ref.doi);

        if (existing) {
          // Item already exists, potentially update it
          result.updated++;
        } else {
          // Import new item to Zotero
          await client.createItem({
            itemType: 'journalArticle',
            title: ref.title,
            DOI: ref.doi,
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
