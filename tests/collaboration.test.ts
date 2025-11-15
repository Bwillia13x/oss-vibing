/**
 * Collaboration Integration Tests
 * 
 * Tests for WebSocket authentication, ACL, room management, and real-time features
 * Week 3-4: Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  authenticateWebSocket, 
  generateWebSocketToken,
  isAuthenticated,
  hasPermission 
} from '@/lib/collaboration/auth';
import { 
  RoomPermission,
  getPermissionLevel,
  hasPermissionLevel 
} from '@/lib/collaboration/acl';
import { 
  checkConnectionRateLimit,
  checkMessageRateLimit,
  checkUpdateRateLimit 
} from '@/lib/collaboration/rate-limiter';

describe('Collaboration - WebSocket Authentication', () => {
  it('should generate valid JWT token', () => {
    const token = generateWebSocketToken({
      userId: 'user-123',
      userName: 'Test User',
      email: 'test@example.com',
      permissions: ['read', 'write'],
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  it('should authenticate WebSocket with valid token', () => {
    const mockWs = {} as any;
    
    const token = generateWebSocketToken({
      userId: 'user-123',
      userName: 'Test User',
      email: 'test@example.com',
      permissions: ['read', 'write'],
    });

    const user = authenticateWebSocket(mockWs, token);

    expect(user).not.toBeNull();
    expect(user?.userId).toBe('user-123');
    expect(user?.userName).toBe('Test User');
    expect(user?.email).toBe('test@example.com');
    expect(mockWs.user).toBeDefined();
    expect(mockWs.authenticated).toBe(true);
  });

  it('should reject invalid token', () => {
    const mockWs = {} as any;
    const invalidToken = 'invalid.token.here';

    const user = authenticateWebSocket(mockWs, invalidToken);

    expect(user).toBeNull();
    expect(mockWs.user).toBeUndefined();
  });

  it('should check if WebSocket is authenticated', () => {
    const authenticatedWs = { authenticated: true } as any;
    const unauthenticatedWs = {} as any;

    expect(isAuthenticated(authenticatedWs)).toBe(true);
    expect(isAuthenticated(unauthenticatedWs)).toBe(false);
  });

  it('should check user permissions', () => {
    const ws = {
      user: {
        userId: 'user-123',
        permissions: ['read', 'write'],
      },
    } as any;

    expect(hasPermission(ws, 'read')).toBe(true);
    expect(hasPermission(ws, 'write')).toBe(true);
    expect(hasPermission(ws, 'admin')).toBe(false);
  });

  it('should support wildcard permissions', () => {
    const ws = {
      user: {
        userId: 'user-123',
        permissions: ['*'],
      },
    } as any;

    expect(hasPermission(ws, 'read')).toBe(true);
    expect(hasPermission(ws, 'write')).toBe(true);
    expect(hasPermission(ws, 'admin')).toBe(true);
  });
});

describe('Collaboration - Access Control (ACL)', () => {
  it('should define permission levels correctly', () => {
    expect(getPermissionLevel(RoomPermission.OWNER)).toBe(3);
    expect(getPermissionLevel(RoomPermission.EDITOR)).toBe(2);
    expect(getPermissionLevel(RoomPermission.VIEWER)).toBe(1);
  });

  it('should compare permission levels', () => {
    expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.VIEWER)).toBe(true);
    expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.EDITOR)).toBe(true);
    expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.OWNER)).toBe(true);
    
    expect(hasPermissionLevel(RoomPermission.EDITOR, RoomPermission.VIEWER)).toBe(true);
    expect(hasPermissionLevel(RoomPermission.EDITOR, RoomPermission.OWNER)).toBe(false);
    
    expect(hasPermissionLevel(RoomPermission.VIEWER, RoomPermission.EDITOR)).toBe(false);
    expect(hasPermissionLevel(RoomPermission.VIEWER, RoomPermission.OWNER)).toBe(false);
  });

  it('should validate permission hierarchy', () => {
    const owner = RoomPermission.OWNER;
    const editor = RoomPermission.EDITOR;
    const viewer = RoomPermission.VIEWER;

    // Owner > Editor > Viewer
    expect(getPermissionLevel(owner)).toBeGreaterThan(getPermissionLevel(editor));
    expect(getPermissionLevel(editor)).toBeGreaterThan(getPermissionLevel(viewer));
  });
});

describe('Collaboration - Rate Limiting', () => {
  it('should allow connections within limit', async () => {
    const userId = `test-user-${Date.now()}`;
    
    const result = await checkConnectionRateLimit(userId);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it('should allow messages within limit', async () => {
    const userId = `test-user-${Date.now()}`;
    
    const allowed = await checkMessageRateLimit(userId);
    
    expect(allowed).toBe(true);
  });

  it('should allow updates within limit', async () => {
    const userId = `test-user-${Date.now()}`;
    
    const allowed = await checkUpdateRateLimit(userId);
    
    expect(allowed).toBe(true);
  });

  it('should track rate limit consumption', async () => {
    const userId = `test-user-${Date.now()}`;
    
    // First request
    const result1 = await checkConnectionRateLimit(userId);
    const remaining1 = result1.remaining;
    
    // Second request
    const result2 = await checkConnectionRateLimit(userId);
    const remaining2 = result2.remaining;
    
    // Remaining should decrease
    expect(remaining2).toBeLessThan(remaining1);
  });
});

describe('Collaboration - Permission Enums', () => {
  it('should have correct permission enum values', () => {
    expect(RoomPermission.OWNER).toBe('owner');
    expect(RoomPermission.EDITOR).toBe('editor');
    expect(RoomPermission.VIEWER).toBe('viewer');
  });

  it('should use permission enums consistently', () => {
    const permissions = [
      RoomPermission.OWNER,
      RoomPermission.EDITOR,
      RoomPermission.VIEWER,
    ];

    permissions.forEach((permission) => {
      expect(typeof permission).toBe('string');
      expect(getPermissionLevel(permission)).toBeGreaterThan(0);
    });
  });
});

describe('Collaboration - Token Expiration', () => {
  it('should generate token with expiration', () => {
    const token = generateWebSocketToken({
      userId: 'user-123',
      userName: 'Test User',
      email: 'test@example.com',
      permissions: ['read'],
    });

    // Decode JWT (simple check, not cryptographically verified)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    expect(payload.exp).toBeDefined();
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });
});

describe('Collaboration - Error Handling', () => {
  it('should handle missing user in permission check', () => {
    const ws = {} as any; // No user attached
    
    expect(hasPermission(ws, 'read')).toBe(false);
  });

  it('should handle undefined permissions array', () => {
    const ws = {
      user: {
        userId: 'user-123',
        permissions: undefined,
      },
    } as any;
    
    // Should not throw error
    expect(() => hasPermission(ws, 'read')).not.toThrow();
  });
});
