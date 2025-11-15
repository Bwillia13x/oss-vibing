/**
 * Yjs Provider for Real-Time Collaboration
 * 
 * Implements CRDT-based collaborative editing using Yjs.
 * Supports real-time synchronization across multiple users.
 * 
 * Phase 15 Implementation
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface CollaborationConfig {
  documentId: string;
  userId: string;
  userName: string;
  serverUrl?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  color: string;
  lastSeen: number;
}

/**
 * Yjs Document Provider for Collaborative Editing
 */
export class YjsDocumentProvider {
  private ydoc: Y.Doc;
  private wsProvider: WebsocketProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private awareness: any;
  private config: CollaborationConfig;

  constructor(config: CollaborationConfig) {
    this.config = config;
    this.ydoc = new Y.Doc();

    // Initialize offline persistence
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.indexeddbProvider = new IndexeddbPersistence(
        `doc-${config.documentId}`,
        this.ydoc
      );

      this.indexeddbProvider.on('synced', () => {
        console.log('Document loaded from IndexedDB');
      });
    }

    // Initialize WebSocket provider for real-time sync
    const serverUrl = config.serverUrl || this.getDefaultServerUrl();
    if (typeof window !== 'undefined') {
      this.wsProvider = new WebsocketProvider(
        serverUrl,
        config.documentId,
        this.ydoc
      );

      this.awareness = this.wsProvider.awareness;

      // Set local user state
      this.awareness.setLocalStateField('user', {
        userId: config.userId,
        userName: config.userName,
        color: this.getUserColor(config.userId),
      });

      // Listen for connection status
      this.wsProvider.on('status', (event: { status: string }) => {
        console.log('WebSocket status:', event.status);
      });

      this.wsProvider.on('sync', (synced: boolean) => {
        console.log('Document synced:', synced);
      });
    }
  }

  /**
   * Get the Yjs document instance
   */
  getDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get or create a shared text field
   */
  getText(fieldName: string): Y.Text {
    return this.ydoc.getText(fieldName);
  }

  /**
   * Get or create a shared array
   */
  getArray<T>(fieldName: string): Y.Array<T> {
    return this.ydoc.getArray<T>(fieldName);
  }

  /**
   * Get or create a shared map
   */
  getMap<T>(fieldName: string): Y.Map<T> {
    return this.ydoc.getMap<T>(fieldName);
  }

  /**
   * Update user presence (cursor position, selection, etc.)
   */
  updatePresence(presence: Partial<UserPresence>): void {
    if (this.awareness) {
      const currentState = this.awareness.getLocalState();
      this.awareness.setLocalStateField('user', {
        ...currentState?.user,
        ...presence,
        lastSeen: Date.now(),
      });
    }
  }

  /**
   * Get all connected users and their presence
   */
  getPresence(): Map<number, UserPresence> {
    if (!this.awareness) {
      return new Map();
    }

    const states = this.awareness.getStates();
    const presenceMap = new Map<number, UserPresence>();

    states.forEach((state: any, clientId: number) => {
      if (state.user) {
        presenceMap.set(clientId, state.user);
      }
    });

    return presenceMap;
  }

  /**
   * Listen for presence changes
   */
  onPresenceChange(callback: (presence: Map<number, UserPresence>) => void): () => void {
    if (!this.awareness) {
      return () => {};
    }

    const handler = () => {
      callback(this.getPresence());
    };

    this.awareness.on('change', handler);

    // Return cleanup function
    return () => {
      this.awareness.off('change', handler);
    };
  }

  /**
   * Listen for document changes
   */
  onChange(callback: () => void): () => void {
    const handler = () => {
      callback();
    };

    this.ydoc.on('update', handler);

    // Return cleanup function
    return () => {
      this.ydoc.off('update', handler);
    };
  }

  /**
   * Export document content as JSON
   */
  toJSON(): Record<string, any> {
    const json: Record<string, any> = {};

    this.ydoc.share.forEach((value, key) => {
      if (value instanceof Y.Text) {
        json[key] = value.toString();
      } else if (value instanceof Y.Array) {
        json[key] = value.toJSON();
      } else if (value instanceof Y.Map) {
        json[key] = value.toJSON();
      }
    });

    return json;
  }

  /**
   * Import content from JSON
   */
  fromJSON(json: Record<string, any>): void {
    Object.entries(json).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const text = this.getText(key);
        text.delete(0, text.length);
        text.insert(0, value);
      } else if (Array.isArray(value)) {
        const array = this.getArray(key);
        array.delete(0, array.length);
        array.push(value);
      } else if (typeof value === 'object' && value !== null) {
        const map = this.getMap(key);
        map.clear();
        Object.entries(value).forEach(([k, v]) => {
          map.set(k, v);
        });
      }
    });
  }

  /**
   * Get a unique color for a user based on their ID
   */
  private getUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B195', '#F67280', '#C06C84', '#6C5B7B',
    ];

    // Simple hash function to get consistent color per user
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Get default WebSocket server URL
   */
  private getDefaultServerUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/collaboration`;
    }
    return 'ws://localhost:3000/collaboration';
  }

  /**
   * Disconnect and cleanup
   */
  destroy(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
    }
    this.ydoc.destroy();
  }
}

/**
 * React Hook for using Yjs collaboration
 */
export function useCollaboration(config: CollaborationConfig) {
  if (typeof window === 'undefined') {
    // Server-side: return mock provider
    return null;
  }

  const provider = new YjsDocumentProvider(config);
  return provider;
}
