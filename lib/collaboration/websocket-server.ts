/**
 * WebSocket Server for Real-Time Collaboration
 * 
 * Provides WebSocket endpoints for Yjs CRDT synchronization.
 * Handles multiple documents and user presence.
 * 
 * Phase 15 Implementation
 */

import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { setPersistence, getPersistence } from './persistence';
import { authenticateWebSocket, requireAuth, getAuthenticatedUser } from './auth';
import { checkRoomAccess, RoomPermission } from './acl';
import { checkConnectionRateLimit, checkMessageRateLimit, checkUpdateRateLimit } from './rate-limiter';

interface CollaborationRoom {
  doc: Y.Doc;
  connections: Set<WebSocket>;
  lastActivity: number;
}

export class CollaborationServer {
  private wss: WebSocketServer;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer, path = '/collaboration') {
    this.wss = new WebSocketServer({
      server,
      path,
    });

    this.setupWebSocketServer();
    this.startCleanup();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', async (ws: WebSocket, request) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const roomName = url.searchParams.get('room') || 'default';
      const token = url.searchParams.get('token');

      // Authenticate the connection
      if (!token) {
        console.warn('WebSocket connection without token');
        ws.close(4001, 'Authentication required');
        return;
      }

      const user = authenticateWebSocket(ws, token);
      if (!user) {
        console.warn('WebSocket authentication failed');
        ws.close(4001, 'Invalid token');
        return;
      }

      // Check rate limit
      const rateLimitCheck = await checkConnectionRateLimit(user.userId);
      if (!rateLimitCheck.allowed) {
        console.warn(`Connection rate limit exceeded for user ${user.userId}`);
        ws.close(4029, 'Too many connections');
        return;
      }

      // Check room access
      const hasAccess = await checkRoomAccess(user.userId, roomName, RoomPermission.VIEWER);
      if (!hasAccess) {
        console.warn(`Access denied to room ${roomName} for user ${user.userId}`);
        ws.close(4003, 'Access denied');
        return;
      }

      console.log(`User ${user.userName} (${user.userId}) connected to room: ${roomName}`);

      // Get or create room
      let room = this.rooms.get(roomName);
      if (!room) {
        room = this.createRoom(roomName);
        this.rooms.set(roomName, room);
      }

      // Add connection to room
      room.connections.add(ws);
      room.lastActivity = Date.now();

      // Send initial document state to new client
      const state = Y.encodeStateAsUpdate(room.doc);
      ws.send(
        JSON.stringify({
          type: 'sync-initial',
          state: Array.from(state),
        })
      );

      // Handle messages from client
      ws.on('message', async (data: Buffer) => {
        try {
          const user = getAuthenticatedUser(ws);
          if (!user) {
            ws.close(4001, 'Unauthorized');
            return;
          }

          // Check message rate limit
          const messageAllowed = await checkMessageRateLimit(user.userId);
          if (!messageAllowed) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Rate limit exceeded. Please slow down.',
            }));
            return;
          }

          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, roomName, message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`Connection closed for room: ${roomName}`);
        if (room) {
          room.connections.delete(ws);

          // Clean up empty rooms
          if (room.connections.size === 0) {
            this.scheduleRoomCleanup(roomName);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('Collaboration WebSocket server started');
  }

  private createRoom(roomName: string): CollaborationRoom {
    const doc = new Y.Doc();

    // Load persisted state if available
    getPersistence(roomName).then((persistedState) => {
      if (persistedState) {
        Y.applyUpdate(doc, persistedState);
        console.log(`Loaded persisted state for room: ${roomName}`);
      }
    });

    // Auto-save on updates
    doc.on('update', (update: Uint8Array) => {
      setPersistence(roomName, update);
    });

    return {
      doc,
      connections: new Set(),
      lastActivity: Date.now(),
    };
  }

  private async handleMessage(
    ws: WebSocket,
    roomName: string,
    message: any
  ): Promise<void> {
    const room = this.rooms.get(roomName);
    if (!room) {
      return;
    }

    const user = getAuthenticatedUser(ws);
    if (!user) {
      return;
    }

    room.lastActivity = Date.now();

    switch (message.type) {
      case 'sync-update':
        // Check update rate limit
        const updateAllowed = await checkUpdateRateLimit(user.userId);
        if (!updateAllowed) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Update rate limit exceeded. Please slow down.',
          }));
          return;
        }

        // Apply update to room's document
        const update = new Uint8Array(message.update);
        Y.applyUpdate(room.doc, update);

        // Broadcast to all other clients in the room
        this.broadcast(room, ws, {
          type: 'sync-update',
          update: message.update,
        });
        break;

      case 'awareness-update':
        // Broadcast awareness update to all other clients
        this.broadcast(room, ws, {
          type: 'awareness-update',
          awareness: message.awareness,
        });
        break;

      case 'cursor-update':
        // Broadcast cursor position to all other clients
        this.broadcast(room, ws, {
          type: 'cursor-update',
          userId: message.userId,
          cursor: message.cursor,
        });
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private broadcast(room: CollaborationRoom, sender: WebSocket, message: any): void {
    const data = JSON.stringify(message);

    room.connections.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private scheduleRoomCleanup(roomName: string): void {
    // Clean up room after 5 minutes of inactivity
    setTimeout(() => {
      const room = this.rooms.get(roomName);
      if (room && room.connections.size === 0) {
        console.log(`Cleaning up empty room: ${roomName}`);
        room.doc.destroy();
        this.rooms.delete(roomName);
      }
    }, 5 * 60 * 1000);
  }

  private startCleanup(): void {
    // Clean up inactive rooms every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30 * 60 * 1000; // 30 minutes

      this.rooms.forEach((room, roomName) => {
        if (room.connections.size === 0 && now - room.lastActivity > timeout) {
          console.log(`Cleaning up inactive room: ${roomName}`);
          room.doc.destroy();
          this.rooms.delete(roomName);
        }
      });
    }, 10 * 60 * 1000);
  }

  /**
   * Get statistics about active rooms and connections
   */
  getStats(): {
    totalRooms: number;
    totalConnections: number;
    rooms: Array<{ name: string; connections: number; lastActivity: Date }>;
  } {
    const rooms: Array<{ name: string; connections: number; lastActivity: Date }> = [];
    let totalConnections = 0;

    this.rooms.forEach((room, name) => {
      rooms.push({
        name,
        connections: room.connections.size,
        lastActivity: new Date(room.lastActivity),
      });
      totalConnections += room.connections.size;
    });

    return {
      totalRooms: this.rooms.size,
      totalConnections,
      rooms,
    };
  }

  /**
   * Shutdown the server
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.rooms.forEach((room) => {
      room.doc.destroy();
      room.connections.forEach((ws) => ws.close());
    });

    this.wss.close();
    console.log('Collaboration server shut down');
  }
}

/**
 * Initialize collaboration server with HTTP server
 */
export function initCollaborationServer(httpServer: HTTPServer): CollaborationServer {
  return new CollaborationServer(httpServer);
}
