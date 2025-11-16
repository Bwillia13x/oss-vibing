/**
 * Reference Manager and Citation API Integrations
 * 
 * Provides integration with popular reference management systems and citation APIs.
 * Phase 15 Implementation + Sprint 2 Real Citation APIs
 */

// Reference managers
export { ZoteroClient, syncWithZotero } from './zotero-client';
export type { ZoteroConfig, ZoteroItem, ZoteroCollection } from './zotero-client';

export { MendeleyClient, syncWithMendeley } from './mendeley-client';
export type { MendeleyConfig, MendeleyDocument, MendeleyFolder } from './mendeley-client';

// Citation APIs (Sprint 2)
export { CrossrefClient, getCrossrefClient, type CrossrefWork } from './crossref';
export { OpenAlexClient, getOpenAlexClient, type OpenAlexWork } from './openalex';
export { SemanticScholarClient, getSemanticScholarClient, type SemanticScholarPaper } from './semantic-scholar';

import { getCrossrefClient } from './crossref';
import { getOpenAlexClient } from './openalex';
import { getSemanticScholarClient } from './semantic-scholar';
import type { CitationData } from '@/ai/tools/types';

/**
 * Multi-source citation search
 * Searches across all available citation APIs
 */
export async function searchCitations(
  query: string,
  options: {
    sources?: Array<'crossref' | 'openalex' | 'semantic-scholar'>;
    limit?: number;
  } = {}
): Promise<CitationData[]> {
  const { sources = ['crossref', 'openalex', 'semantic-scholar'], limit = 10 } = options;
  
  const results: CitationData[] = [];
  const limitPerSource = Math.ceil(limit / sources.length);

  const promises: Promise<CitationData[]>[] = [];

  if (sources.includes('crossref')) {
    promises.push(getCrossrefClient().search(query, limitPerSource));
  }

  if (sources.includes('openalex')) {
    promises.push(
      getOpenAlexClient().searchWorks(query, limitPerSource).then(works =>
        works.map(work => ({
          title: work.title,
          authors: work.authors,
          year: work.year,
          doi: work.doi,
          url: work.url,
          abstract: work.abstract,
        }))
      )
    );
  }

  if (sources.includes('semantic-scholar')) {
    promises.push(
      getSemanticScholarClient().search(query, limitPerSource).then(papers =>
        papers.map(paper => ({
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          doi: paper.doi,
          url: paper.url,
          abstract: paper.abstract,
        }))
      )
    );
  }

  const allResults = await Promise.all(promises);
  
  for (const sourceResults of allResults) {
    results.push(...sourceResults);
  }

  // Remove duplicates based on DOI or title
  const uniqueResults = results.filter((citation, index, self) => {
    if (citation.doi) {
      return self.findIndex(c => c.doi === citation.doi) === index;
    }
    return self.findIndex(c => c.title === citation.title) === index;
  });

  return uniqueResults.slice(0, limit);
}

/**
 * Resolve a DOI across multiple sources
 * Tries each source until one succeeds
 */
export async function resolveDOI(doi: string): Promise<CitationData | null> {
  // Try Crossref first (most comprehensive for DOIs)
  let result = await getCrossrefClient().resolveDOI(doi);
  if (result) return result;

  // Try OpenAlex second
  result = await getOpenAlexClient().getByDOI(doi);
  if (result) return result;

  // Try Semantic Scholar last
  result = await getSemanticScholarClient().getByDOI(doi);
  if (result) return result;

  return null;
}

/**
 * Get citation count across multiple sources
 */
export async function getCitationCount(doi: string): Promise<number> {
  const counts = await Promise.all([
    getCrossrefClient().getCitationCount(doi),
    // Add other sources if they support citation counts
  ]);

  return Math.max(...counts);
}
