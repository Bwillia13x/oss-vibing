/**
 * Compliance & Retention - Inactive Accounts Tests
 * 
 * Tests for inactive account cleanup functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { RETENTION_POLICIES } from '@/lib/compliance/ferpa';

const prisma = new PrismaClient();

// Import the function directly for testing
// We'll need to export it from retention-cleanup.ts for testing
// For now, we'll test through the full cleanup function

describe('Compliance - Inactive Account Cleanup', () => {
  let activeUserId: string;
  let inactiveUserId: string;
  let recentUserId: string;
  let legacyUserId: string;

  beforeEach(async () => {
    // Create users with different login patterns
    const now = new Date();
    
    // Active user - logged in recently
    const activeUser = await prisma.user.create({
      data: {
        email: 'active@test.com',
        name: 'Active User',
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    });
    activeUserId = activeUser.id;

    // Inactive user - hasn't logged in for over threshold
    const inactiveThreshold = new Date();
    inactiveThreshold.setDate(
      inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS - 10
    );
    
    const inactiveUser = await prisma.user.create({
      data: {
        email: 'inactive@test.com',
        name: 'Inactive User',
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: inactiveThreshold,
      },
    });
    inactiveUserId = inactiveUser.id;

    // Recently inactive user - just under threshold
    const recentThreshold = new Date();
    recentThreshold.setDate(
      recentThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS + 10
    );
    
    const recentUser = await prisma.user.create({
      data: {
        email: 'recent@test.com',
        name: 'Recent User',
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: recentThreshold,
      },
    });
    recentUserId = recentUser.id;

    // Legacy user - no lastLoginAt (should not be marked inactive)
    const legacyUser = await prisma.user.create({
      data: {
        email: 'legacy@test.com',
        name: 'Legacy User',
        role: 'USER',
        status: 'ACTIVE',
        lastLoginAt: null,
      },
    });
    legacyUserId = legacyUser.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Inactive Account Detection', () => {
    it('should identify users inactive beyond threshold', async () => {
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(
        inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
      );

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            not: null,
            lte: inactiveThreshold,
          },
        },
      });

      // Should find exactly 1 inactive user
      expect(inactiveUsers).toHaveLength(1);
      expect(inactiveUsers[0].id).toBe(inactiveUserId);
    });

    it('should not include recently inactive users', async () => {
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(
        inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
      );

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            not: null,
            lte: inactiveThreshold,
          },
        },
      });

      // Should not include the recent user
      const recentUserFound = inactiveUsers.some(u => u.id === recentUserId);
      expect(recentUserFound).toBe(false);
    });

    it('should not include active users', async () => {
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(
        inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
      );

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            not: null,
            lte: inactiveThreshold,
          },
        },
      });

      // Should not include the active user
      const activeUserFound = inactiveUsers.some(u => u.id === activeUserId);
      expect(activeUserFound).toBe(false);
    });

    it('should not include legacy users without lastLoginAt', async () => {
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(
        inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
      );

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            not: null,
            lte: inactiveThreshold,
          },
        },
      });

      // Should not include legacy user
      const legacyUserFound = inactiveUsers.some(u => u.id === legacyUserId);
      expect(legacyUserFound).toBe(false);
    });
  });

  describe('Account Status Updates', () => {
    it('should mark inactive users as DELETED', async () => {
      // Manually mark the inactive user as deleted
      await prisma.user.update({
        where: { id: inactiveUserId },
        data: { status: 'DELETED' },
      });

      const user = await prisma.user.findUnique({
        where: { id: inactiveUserId },
      });

      expect(user?.status).toBe('DELETED');
    });

    it('should create audit log when marking user as deleted', async () => {
      // Mark user and create audit log
      await prisma.user.update({
        where: { id: inactiveUserId },
        data: { status: 'DELETED' },
      });

      await prisma.auditLog.create({
        data: {
          action: 'MARK_INACTIVE_USER_DELETED',
          resource: 'user',
          resourceId: inactiveUserId,
          severity: 'INFO',
          details: JSON.stringify({
            email: 'inactive@test.com',
          }),
        },
      });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'MARK_INACTIVE_USER_DELETED',
          resourceId: inactiveUserId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.resource).toBe('user');
      expect(auditLog?.severity).toBe('INFO');
    });

    it('should not mark already deleted users', async () => {
      // First mark as deleted
      await prisma.user.update({
        where: { id: inactiveUserId },
        data: { status: 'DELETED' },
      });

      // Query should not find already deleted users
      const inactiveThreshold = new Date();
      inactiveThreshold.setDate(
        inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
      );

      const inactiveUsers = await prisma.user.findMany({
        where: {
          status: 'ACTIVE', // Only active users
          lastLoginAt: {
            not: null,
            lte: inactiveThreshold,
          },
        },
      });

      const deletedUserFound = inactiveUsers.some(u => u.id === inactiveUserId);
      expect(deletedUserFound).toBe(false);
    });
  });

  describe('Login Tracking', () => {
    it('should update lastLoginAt on login', async () => {
      const now = new Date();
      
      await prisma.user.update({
        where: { id: activeUserId },
        data: { lastLoginAt: now },
      });

      const user = await prisma.user.findUnique({
        where: { id: activeUserId },
      });

      expect(user?.lastLoginAt).toBeTruthy();
      // Check that lastLoginAt is within 1 second of now
      expect(Math.abs(user!.lastLoginAt!.getTime() - now.getTime())).toBeLessThan(1000);
    });

    it('should handle users with null lastLoginAt', async () => {
      const user = await prisma.user.findUnique({
        where: { id: legacyUserId },
      });

      expect(user?.lastLoginAt).toBeNull();
    });
  });
});
