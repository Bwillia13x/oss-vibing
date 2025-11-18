/**
 * Collaboration ACL Tests
 * 
 * Tests for Room Access Control List (ACL) functionality
 * Includes database integration tests for permission management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  RoomPermission,
  checkRoomAccess,
  grantRoomAccess,
  revokeRoomAccess,
  getRoomUsers,
  getUserPermission,
  getPermissionLevel,
  hasPermissionLevel,
} from '@/lib/collaboration/acl';

const prisma = new PrismaClient();

describe('Collaboration ACL', () => {
  let ownerId: string;
  let userId1: string;
  let userId2: string;
  let documentId: string;

  beforeEach(async () => {
    // Create test users
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        name: 'Owner User',
        role: 'USER',
      },
    });
    ownerId = owner.id;

    const user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User One',
        role: 'USER',
      },
    });
    userId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User Two',
        role: 'USER',
      },
    });
    userId2 = user2.id;

    // Create a test document
    const document = await prisma.document.create({
      data: {
        userId: ownerId,
        title: 'Test Document',
        content: 'Test content',
        type: 'NOTE',
      },
    });
    documentId = document.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.roomACL.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Permission Levels', () => {
    it('should have correct permission hierarchy', () => {
      expect(getPermissionLevel(RoomPermission.OWNER)).toBeGreaterThan(
        getPermissionLevel(RoomPermission.EDITOR)
      );
      expect(getPermissionLevel(RoomPermission.EDITOR)).toBeGreaterThan(
        getPermissionLevel(RoomPermission.VIEWER)
      );
    });

    it('should correctly compare permission levels', () => {
      expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.EDITOR)).toBe(true);
      expect(hasPermissionLevel(RoomPermission.OWNER, RoomPermission.VIEWER)).toBe(true);
      expect(hasPermissionLevel(RoomPermission.EDITOR, RoomPermission.VIEWER)).toBe(true);
      expect(hasPermissionLevel(RoomPermission.VIEWER, RoomPermission.EDITOR)).toBe(false);
      expect(hasPermissionLevel(RoomPermission.VIEWER, RoomPermission.OWNER)).toBe(false);
    });
  });

  describe('checkRoomAccess', () => {
    it('should allow owner full access', async () => {
      const hasAccess = await checkRoomAccess(ownerId, documentId, RoomPermission.OWNER);
      expect(hasAccess).toBe(true);
    });

    it('should deny access to non-owner without ACL', async () => {
      const hasAccess = await checkRoomAccess(userId1, documentId, RoomPermission.VIEWER);
      expect(hasAccess).toBe(false);
    });

    it('should deny access to non-existent room', async () => {
      const hasAccess = await checkRoomAccess(userId1, 'non-existent', RoomPermission.VIEWER);
      expect(hasAccess).toBe(false);
    });

    it('should grant access based on ACL entry', async () => {
      // Grant editor access to user1
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      // User1 should have editor access
      const hasEditorAccess = await checkRoomAccess(userId1, documentId, RoomPermission.EDITOR);
      expect(hasEditorAccess).toBe(true);

      // User1 should also have viewer access (lower level)
      const hasViewerAccess = await checkRoomAccess(userId1, documentId, RoomPermission.VIEWER);
      expect(hasViewerAccess).toBe(true);

      // But not owner access
      const hasOwnerAccess = await checkRoomAccess(userId1, documentId, RoomPermission.OWNER);
      expect(hasOwnerAccess).toBe(false);
    });
  });

  describe('grantRoomAccess', () => {
    it('should allow owner to grant access', async () => {
      await expect(
        grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId)
      ).resolves.not.toThrow();

      // Verify ACL was created
      const acl = await prisma.roomACL.findUnique({
        where: {
          documentId_userId: {
            documentId: documentId,
            userId: userId1,
          },
        },
      });

      expect(acl).not.toBeNull();
      expect(acl?.permission).toBe(RoomPermission.EDITOR);
      expect(acl?.invitedById).toBe(ownerId);
    });

    it('should prevent non-owner from granting access', async () => {
      await expect(
        grantRoomAccess(documentId, userId2, RoomPermission.VIEWER, userId1)
      ).rejects.toThrow('Only room owner can grant access');
    });

    it('should prevent granting access to owner', async () => {
      await expect(
        grantRoomAccess(documentId, ownerId, RoomPermission.VIEWER, ownerId)
      ).rejects.toThrow('Owner already has full access');
    });

    it('should update existing ACL permission', async () => {
      // Grant viewer access first
      await grantRoomAccess(documentId, userId1, RoomPermission.VIEWER, ownerId);

      // Upgrade to editor
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      const acl = await prisma.roomACL.findUnique({
        where: {
          documentId_userId: {
            documentId: documentId,
            userId: userId1,
          },
        },
      });

      expect(acl?.permission).toBe(RoomPermission.EDITOR);
    });

    it('should create audit log entry', async () => {
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'GRANT_ROOM_ACCESS',
          resourceId: documentId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(ownerId);
    });
  });

  describe('revokeRoomAccess', () => {
    it('should allow owner to revoke access', async () => {
      // Grant access first
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      // Then revoke it
      await expect(
        revokeRoomAccess(documentId, userId1, ownerId)
      ).resolves.not.toThrow();

      // Verify ACL was deleted
      const acl = await prisma.roomACL.findUnique({
        where: {
          documentId_userId: {
            documentId: documentId,
            userId: userId1,
          },
        },
      });

      expect(acl).toBeNull();
    });

    it('should prevent non-owner from revoking access', async () => {
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      await expect(
        revokeRoomAccess(documentId, userId1, userId2)
      ).rejects.toThrow('Only room owner can revoke access');
    });

    it('should prevent revoking owner access', async () => {
      await expect(
        revokeRoomAccess(documentId, ownerId, ownerId)
      ).rejects.toThrow('Cannot revoke owner access');
    });

    it('should create audit log entry', async () => {
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);
      await revokeRoomAccess(documentId, userId1, ownerId);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'REVOKE_ROOM_ACCESS',
          resourceId: documentId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.userId).toBe(ownerId);
    });
  });

  describe('getRoomUsers', () => {
    it('should return owner only when no ACLs exist', async () => {
      const users = await getRoomUsers(documentId);

      expect(users).toHaveLength(1);
      expect(users[0].userId).toBe(ownerId);
      expect(users[0].permission).toBe(RoomPermission.OWNER);
      expect(users[0].email).toBe('owner@test.com');
    });

    it('should return all users with access', async () => {
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);
      await grantRoomAccess(documentId, userId2, RoomPermission.VIEWER, ownerId);

      const users = await getRoomUsers(documentId);

      expect(users).toHaveLength(3);
      
      // Find each user in the list
      const owner = users.find(u => u.userId === ownerId);
      const editor = users.find(u => u.userId === userId1);
      const viewer = users.find(u => u.userId === userId2);

      expect(owner?.permission).toBe(RoomPermission.OWNER);
      expect(editor?.permission).toBe(RoomPermission.EDITOR);
      expect(viewer?.permission).toBe(RoomPermission.VIEWER);
    });

    it('should return empty array for non-existent room', async () => {
      const users = await getRoomUsers('non-existent');
      expect(users).toHaveLength(0);
    });
  });

  describe('getUserPermission', () => {
    it('should return OWNER for room owner', async () => {
      const permission = await getUserPermission(ownerId, documentId);
      expect(permission).toBe(RoomPermission.OWNER);
    });

    it('should return null for user without access', async () => {
      const permission = await getUserPermission(userId1, documentId);
      expect(permission).toBeNull();
    });

    it('should return granted permission from ACL', async () => {
      await grantRoomAccess(documentId, userId1, RoomPermission.EDITOR, ownerId);

      const permission = await getUserPermission(userId1, documentId);
      expect(permission).toBe(RoomPermission.EDITOR);
    });

    it('should return null for non-existent room', async () => {
      const permission = await getUserPermission(userId1, 'non-existent');
      expect(permission).toBeNull();
    });
  });
});
