/**
 * Extended Collaboration Tests
 * 
 * Additional tests to increase collaboration test coverage
 */

import { describe, it, expect } from 'vitest';
import { 
  authenticateWebSocket, 
  generateWebSocketToken,
  hasPermission 
} from '@/lib/collaboration/auth';
import { 
  RoomPermission,
  getPermissionLevel,
  hasPermissionLevel,
} from '@/lib/collaboration/acl';

describe('Collaboration - Extended ACL Tests', () => {
  describe('Permission Levels', () => {
    it('should get permission level for owner', () => {
      const level = getPermissionLevel('owner');
      expect(level).toBeDefined();
      expect(typeof level).toBe('number');
    });

    it('should get permission level for editor', () => {
      const level = getPermissionLevel('editor');
      expect(level).toBeDefined();
    });

    it('should get permission level for viewer', () => {
      const level = getPermissionLevel('viewer');
      expect(level).toBeDefined();
    });
  });

  describe('Permission Level Checks', () => {
    it('should check if user has sufficient permission level - owner can read', () => {
      expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.READ)).toBe(true);
    });

    it('should check if user has sufficient permission level - owner can write', () => {
      expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.WRITE)).toBe(true);
    });

    it('should check if user has sufficient permission level - owner can admin', () => {
      expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.ADMIN)).toBe(true);
    });
  });
});

describe('Collaboration - Extended Auth Tests', () => {
  describe('Token Generation and Validation', () => {
    it('should generate token with expiration', () => {
      const token = generateWebSocketToken({
        userId: 'user-exp',
        userName: 'Expiry Test',
        email: 'exp@test.com',
        permissions: ['read'],
      });
      
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);
    });

    it('should include user data in token', () => {
      const userData = {
        userId: 'user-data-test',
        userName: 'Data Test User',
        email: 'data@test.com',
        permissions: ['read', 'write', 'comment'],
      };
      
      const token = generateWebSocketToken(userData);
      const mockWs = {} as any;
      const decoded = authenticateWebSocket(mockWs, token);
      
      expect(decoded?.userId).toBe(userData.userId);
      expect(decoded?.userName).toBe(userData.userName);
      expect(decoded?.email).toBe(userData.email);
    });

    it('should handle empty permissions', () => {
      const token = generateWebSocketToken({
        userId: 'user-no-perms',
        userName: 'No Perms',
        email: 'noperms@test.com',
        permissions: [],
      });
      
      const mockWs = {} as any;
      const user = authenticateWebSocket(mockWs, token);
      
      expect(user).not.toBeNull();
      expect(hasPermission(mockWs, 'read')).toBe(false);
    });

    it('should handle multiple specific permissions', () => {
      const token = generateWebSocketToken({
        userId: 'user-multi',
        userName: 'Multi Perms',
        email: 'multi@test.com',
        permissions: ['read', 'write', 'comment', 'admin'],
      });
      
      const mockWs = {} as any;
      authenticateWebSocket(mockWs, token);
      
      expect(hasPermission(mockWs, 'read')).toBe(true);
      expect(hasPermission(mockWs, 'write')).toBe(true);
      expect(hasPermission(mockWs, 'comment')).toBe(true);
      expect(hasPermission(mockWs, 'admin')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed token gracefully', () => {
      const mockWs = {} as any;
      const result = authenticateWebSocket(mockWs, 'not.a.valid.token.format');
      
      expect(result).toBeNull();
      expect(mockWs.authenticated).toBeUndefined();
    });

    it('should handle empty token', () => {
      const mockWs = {} as any;
      const result = authenticateWebSocket(mockWs, '');
      
      expect(result).toBeNull();
    });

    it('should handle token with missing parts', () => {
      const mockWs = {} as any;
      const result = authenticateWebSocket(mockWs, 'onlyonepart');
      
      expect(result).toBeNull();
    });

    it('should check permission on ws without user', () => {
      const ws = { authenticated: true } as any;
      expect(hasPermission(ws, 'read')).toBe(false);
    });

    it('should check permission on ws with null user', () => {
      const ws = { authenticated: true, user: null } as any;
      expect(hasPermission(ws, 'read')).toBe(false);
    });
  });
});
