/**
 * Collaboration Module
 * 
 * Real-time collaborative editing using Yjs CRDT.
 * Phase 15 Implementation
 */

export { YjsDocumentProvider, useCollaboration } from './yjs-provider';
export type { CollaborationConfig, UserPresence } from './yjs-provider';

export { CollaborationServer, initCollaborationServer } from './websocket-server';

export {
  setPersistence,
  getPersistence,
  exportYjsDocument,
  importYjsDocument,
  cleanupYjsStates,
} from './persistence';
