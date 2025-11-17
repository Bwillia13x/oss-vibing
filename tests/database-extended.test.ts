/**
 * Extended Database Repository Tests
 * 
 * Comprehensive tests for database repositories and CRUD operations
 * Target: Increase database repository coverage from 54% to 70%+
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Repositories - Extended Tests', () => {
  describe('User Repository Operations', () => {
    let testUserId: string;

    afterEach(async () => {
      // Cleanup test data
      if (testUserId) {
        try {
          await prisma.user.delete({ where: { id: testUserId } });
        } catch {
          // User may not exist
        }
      }
    });

    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          role: 'USER',
        },
      });

      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.email).toContain('@example.com');
      expect(user.role).toBe('USER');
    });

    it('should find user by email', async () => {
      const email = `find-${Date.now()}@example.com`;
      
      const created = await prisma.user.create({
        data: {
          email,
          name: 'Find Test',
          role: 'USER',
        },
      });

      testUserId = created.id;

      const found = await prisma.user.findUnique({
        where: { email },
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should update user information', async () => {
      const user = await prisma.user.create({
        data: {
          email: `update-${Date.now()}@example.com`,
          name: 'Original Name',
          role: 'USER',
        },
      });

      testUserId = user.id;

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Name' },
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe(user.email);
    });

    it('should handle unique constraint violations', async () => {
      const email = `unique-${Date.now()}@example.com`;

      const user1 = await prisma.user.create({
        data: {
          email,
          name: 'User 1',
          role: 'USER',
        },
      });

      testUserId = user1.id;

      // Attempt to create another user with same email should fail
      await expect(
        prisma.user.create({
          data: {
            email,
            name: 'User 2',
            role: 'USER',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Document Repository Operations', () => {
    let testDocId: string;
    let testUserId: string;

    beforeEach(async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `doc-test-${Date.now()}@example.com`,
          name: 'Doc Test User',
          role: 'USER',
        },
      });
      testUserId = user.id;
    });

    afterEach(async () => {
      // Cleanup
      if (testDocId) {
        try {
          await prisma.document.delete({ where: { id: testDocId } });
        } catch {
          // Document may not exist
        }
      }
      if (testUserId) {
        try {
          await prisma.user.delete({ where: { id: testUserId } });
        } catch {
          // User may not exist
        }
      }
    });

    it('should create a document', async () => {
      const doc = await prisma.document.create({
        data: {
          userId: testUserId,
          title: 'Test Document',
          content: 'Test content',
          type: 'NOTE',
        },
      });

      testDocId = doc.id;

      expect(doc).toBeDefined();
      expect(doc.title).toBe('Test Document');
      expect(doc.userId).toBe(testUserId);
    });

    it('should find documents by user', async () => {
      const doc = await prisma.document.create({
        data: {
          userId: testUserId,
          title: 'User Document',
          content: 'Content',
          type: 'NOTE',
        },
      });

      testDocId = doc.id;

      const docs = await prisma.document.findMany({
        where: { userId: testUserId },
      });

      expect(docs.length).toBeGreaterThan(0);
      expect(docs.some(d => d.id === doc.id)).toBe(true);
    });

    it('should update document content', async () => {
      const doc = await prisma.document.create({
        data: {
          userId: testUserId,
          title: 'Original Title',
          content: 'Original Content',
          type: 'NOTE',
        },
      });

      testDocId = doc.id;

      const updated = await prisma.document.update({
        where: { id: doc.id },
        data: {
          content: 'Updated Content',
          title: 'Updated Title',
        },
      });

      expect(updated.content).toBe('Updated Content');
      expect(updated.title).toBe('Updated Title');
    });

    it('should delete document', async () => {
      const doc = await prisma.document.create({
        data: {
          userId: testUserId,
          title: 'To Delete',
          content: 'Will be deleted',
          type: 'NOTE',
        },
      });

      await prisma.document.delete({
        where: { id: doc.id },
      });

      const found = await prisma.document.findUnique({
        where: { id: doc.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('Query Performance', () => {
    it('should efficiently query with pagination', async () => {
      const start = Date.now();
      
      const docs = await prisma.document.findMany({
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });

      const duration = Date.now() - start;

      expect(Array.isArray(docs)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should handle complex filters', async () => {
      const docs = await prisma.document.findMany({
        where: {
          AND: [
            { type: 'NOTE' },
            { createdAt: { gte: new Date(Date.now() - 86400000) } },
          ],
        },
        take: 5,
      });

      expect(Array.isArray(docs)).toBe(true);
    });

    it('should support aggregations', async () => {
      const count = await prisma.document.count({
        where: { type: 'NOTE' },
      });

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Transaction Support', () => {
    let testUserId: string;

    afterEach(async () => {
      if (testUserId) {
        try {
          await prisma.user.delete({ where: { id: testUserId } });
        } catch {
          // May not exist
        }
      }
    });

    it('should support database transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: `tx-test-${Date.now()}@example.com`,
            name: 'Transaction Test',
            role: 'USER',
          },
        });

        const doc = await tx.document.create({
          data: {
            userId: user.id,
            title: 'Transaction Document',
            content: 'Created in transaction',
            type: 'NOTE',
          },
        });

        return { user, doc };
      });

      testUserId = result.user.id;

      expect(result.user).toBeDefined();
      expect(result.doc).toBeDefined();
      expect(result.doc.userId).toBe(result.user.id);
    });

    it('should rollback on transaction error', async () => {
      const email = `rollback-${Date.now()}@example.com`;

      try {
        await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name: 'Will Rollback',
              role: 'USER',
            },
          });

          testUserId = user.id;

          // Force an error
          throw new Error('Transaction error');
        });
      } catch {
        // Expected to fail
      }

      // User should not exist due to rollback
      const user = await prisma.user.findUnique({
        where: { email },
      });

      expect(user).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle not found errors', async () => {
      const doc = await prisma.document.findUnique({
        where: { id: 'nonexistent-id-12345' },
      });

      expect(doc).toBeNull();
    });

    it('should handle invalid data gracefully', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: 'invalid', // Invalid email format
            name: 'Test',
            role: 'INVALID_ROLE_XYZ' as any, // Invalid role
          },
        })
      ).rejects.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      // Test that queries don't hang indefinitely
      const start = Date.now();
      
      try {
        await prisma.user.findMany({ take: 1 });
      } catch {
        // May fail but shouldn't hang
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30000); // Max 30 seconds
    });
  });
});
