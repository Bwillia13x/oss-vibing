/**
 * Collaboration Module
 * 
 * Real-time collaborative editing using Yjs CRDT.
 * Phase 15 Implementation + Week 1-2 Security Enhancements
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

// Authentication
export {
  authenticateWebSocket,
  requireAuth,
  isAuthenticated,
  generateWebSocketToken,
  hasPermission,
  getAuthenticatedUser,
} from './auth';
export type { WebSocketAuthPayload } from './auth';

// Access Control
export {
  checkRoomAccess,
  grantRoomAccess,
  revokeRoomAccess,
  getRoomUsers,
  getPermissionLevel,
  hasPermissionLevel,
  getUserPermission,
  RoomPermission,
} from './acl';
export type { RoomACL } from './acl';

// Rate Limiting
export {
  checkConnectionRateLimit,
  checkMessageRateLimit,
  checkUpdateRateLimit,
  getRateLimitStatus,
  resetRateLimits,
} from './rate-limiter';
