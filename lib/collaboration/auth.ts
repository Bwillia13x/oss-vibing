/**
 * WebSocket Authentication & Authorization
 * 
 * Implements JWT-based authentication for WebSocket connections
 * and provides authentication utilities for collaboration features.
 * 
 * Critical for Production - Week 1-2
 */

import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';

export interface WebSocketAuthPayload {
  userId: string;
  userName: string;
  email: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authenticate WebSocket connection using JWT token
 */
export function authenticateWebSocket(
  ws: WebSocket,
  token: string
): WebSocketAuthPayload | null {
  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
      console.error('JWT_SECRET or NEXTAUTH_SECRET not configured');
      return null;
    }

    const payload = jwt.verify(token, secret) as WebSocketAuthPayload;
    
    // Attach user info to WebSocket for future reference
    (ws as any).user = payload;
    (ws as any).authenticated = true;
    
    return payload;
  } catch (error) {
    console.error('WebSocket auth failed:', error);
    return null;
  }
}

/**
 * Require authentication on WebSocket
 * Throws error if not authenticated
 */
export function requireAuth(ws: WebSocket): WebSocketAuthPayload {
  const user = (ws as any).user;
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

/**
 * Check if WebSocket is authenticated
 */
export function isAuthenticated(ws: WebSocket): boolean {
  return !!(ws as any).authenticated;
}

/**
 * Generate JWT token for WebSocket connection
 * Used for testing or service-to-service communication
 */
export function generateWebSocketToken(payload: Omit<WebSocketAuthPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET not configured');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '24h', // Token expires in 24 hours
  });
}

/**
 * Verify if user has required permission
 */
export function hasPermission(ws: WebSocket, permission: string): boolean {
  const user = (ws as any).user as WebSocketAuthPayload | undefined;
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

/**
 * Get authenticated user from WebSocket
 */
export function getAuthenticatedUser(ws: WebSocket): WebSocketAuthPayload | null {
  return (ws as any).user || null;
}
