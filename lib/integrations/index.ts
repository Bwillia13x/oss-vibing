/**
 * Reference Manager Integrations
 * 
 * Provides integration with popular reference management systems.
 * Phase 15 Implementation
 */

export { ZoteroClient, syncWithZotero } from './zotero-client';
export type { ZoteroConfig, ZoteroItem, ZoteroCollection } from './zotero-client';

export { MendeleyClient, syncWithMendeley } from './mendeley-client';
export type { MendeleyConfig, MendeleyDocument, MendeleyFolder } from './mendeley-client';
