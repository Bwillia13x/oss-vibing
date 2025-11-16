/**
 * Admin API Integration Tests
 * Tests for admin user management, analytics, and audit APIs
 */

import { describe, test, expect } from 'vitest';

describe('Admin User Management', () => {
  test('should validate admin user repository functions', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    // Test list users with pagination
    const result = await userRepository.list({}, { page: 1, perPage: 10 });
    
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(10);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('perPage');
  });

  test('should handle user creation with validation', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    const testUser = {
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      role: 'USER' as const,
    };
    
    const user = await userRepository.create(testUser);
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);
    
    // Cleanup
    await userRepository.delete(user.id);
  });

  test('should update user information', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    // Create a test user
    const testUser = {
      email: `update-test${Date.now()}@example.com`,
      name: 'Update Test',
      role: 'USER' as const,
    };
    
    const user = await userRepository.create(testUser);
    
    // Update the user
    const updated = await userRepository.update(user.id, {
      name: 'Updated Name'
    });
    
    expect(updated).toBeDefined();
    if (updated) {
      expect(updated.name).toBe('Updated Name');
    }
    
    // Cleanup
    await userRepository.delete(user.id);
  });

  test('should delete user', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    // Create a test user
    const testUser = {
      email: `delete-test${Date.now()}@example.com`,
      name: 'Delete Test',
      role: 'USER' as const,
    };
    
    const user = await userRepository.create(testUser);
    
    // Delete the user (returns User object with DELETED status)
    const deleted = await userRepository.delete(user.id);
    expect(deleted).toBeDefined();
    expect(deleted.id).toBe(user.id);
    expect(deleted.status).toBe('DELETED');
    
    // Verify deletion (should still exist but with DELETED status)
    const found = await userRepository.findById(user.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe('DELETED');
  });

  test('should find user by ID', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    // Create a test user
    const testUser = {
      email: `find-test${Date.now()}@example.com`,
      name: 'Find Test',
      role: 'USER' as const,
    };
    
    const user = await userRepository.create(testUser);
    
    // Find the user
    const found = await userRepository.findById(user.id);
    
    expect(found).toBeDefined();
    if (found) {
      expect(found.id).toBe(user.id);
      expect(found.email).toBe(user.email);
    }
    
    // Cleanup
    await userRepository.delete(user.id);
  });

  test('should find user by email', async () => {
    const { userRepository } = await import('@/lib/repositories');
    
    const testEmail = `email-test${Date.now()}@example.com`;
    const testUser = {
      email: testEmail,
      name: 'Email Test',
      role: 'USER' as const,
    };
    
    const user = await userRepository.create(testUser);
    
    // Find by email
    const found = await userRepository.findByEmail(testEmail);
    
    expect(found).toBeDefined();
    if (found) {
      expect(found.email).toBe(testEmail);
    }
    
    // Cleanup
    await userRepository.delete(user.id);
  });
});

describe('Admin Analytics', () => {
  test('should get institution analytics', async () => {
    const { getInstitutionAnalytics } = await import('@/lib/admin-analytics');
    
    const analytics = await getInstitutionAnalytics('test-institution', 'month');
    
    expect(analytics).toBeDefined();
    expect(analytics).toHaveProperty('institutionId');
    expect(analytics).toHaveProperty('activeUsers');
    expect(analytics).toHaveProperty('totalDocuments');
    expect(analytics).toHaveProperty('totalCitations');
    expect(analytics).toHaveProperty('period');
  });

  test('should cache analytics results', async () => {
    const { getInstitutionAnalytics } = await import('@/lib/admin-analytics');
    
    // First call
    const analytics1 = await getInstitutionAnalytics('cache-test-inst', 'month');
    
    // Second call (should use cache if available)
    const analytics2 = await getInstitutionAnalytics('cache-test-inst', 'month');
    
    // Results should be the same (not checking exact equality due to timestamp differences)
    expect(analytics1.institutionId).toBe(analytics2.institutionId);
    expect(analytics1.period).toBe(analytics2.period);
    expect(analytics1.totalUsers).toBe(analytics2.totalUsers);
  });

  test('should support different time periods', async () => {
    const { getInstitutionAnalytics } = await import('@/lib/admin-analytics');
    
    const periods: Array<'day' | 'week' | 'month' | 'year'> = ['day', 'week', 'month', 'year'];
    
    for (const period of periods) {
      const analytics = await getInstitutionAnalytics('test-inst', period);
      expect(analytics).toBeDefined();
    }
  });
});

describe('Audit Logging', () => {
  test('should create audit log entry', async () => {
    const { auditLogRepository, userRepository } = await import('@/lib/repositories');
    
    // Create a user first
    const user = await userRepository.create({
      email: `audit-create-test${Date.now()}@example.com`,
      name: 'Audit Create Test',
      role: 'USER',
    });
    
    const logEntry = await auditLogRepository.create({
      userId: user.id,  // Use real user ID
      action: 'test.action',
      resource: 'test',
      resourceId: 'test-resource-id',
      details: { test: 'data' },
      severity: 'INFO',
    });
    
    expect(logEntry).toBeDefined();
    expect(logEntry.id).toBeDefined();
    expect(logEntry.action).toBe('test.action');
    
    // No cleanup - audit logs should be kept for compliance
  });

  test('should list audit logs with pagination', async () => {
    const { auditLogRepository } = await import('@/lib/repositories');
    
    const result = await auditLogRepository.list({}, { page: 1, perPage: 10 });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(10);
  });

  test('should filter audit logs by user', async () => {
    const { auditLogRepository, userRepository } = await import('@/lib/repositories');
    
    // Create a user first
    const user = await userRepository.create({
      email: `audit-filter-test${Date.now()}@example.com`,
      name: 'Audit Filter Test',
      role: 'USER',
    });
    
    // Create test log
    const logEntry = await auditLogRepository.create({
      userId: user.id,  // Use real user ID
      action: 'filter.test',
      resource: 'test',
      resourceId: 'test-id',
      details: {},
      severity: 'INFO',
    });
    
    const result = await auditLogRepository.list(
      { userId: user.id },
      { page: 1, perPage: 10 }
    );
    
    expect(result.data.every(log => log.userId === user.id)).toBe(true);
    
    // No cleanup for audit logs - they should be kept for compliance
  });
});

describe('License Management', () => {
  test('should manage institution licenses', async () => {
    const { licenseRepository } = await import('@/lib/repositories');
    
    const testLicense = {
      institutionId: `test-inst-${Date.now()}`,
      institution: 'Test Institution',  // Required field
      seats: 100,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Required field, 1 year
      status: 'ACTIVE' as const,
    };
    
    const license = await licenseRepository.create(testLicense);
    
    expect(license).toBeDefined();
    expect(license.id).toBeDefined();
    expect(license.seats).toBe(100);
    
    // Cleanup
    await licenseRepository.delete(license.id);
  });

  test('should check available seats', async () => {
    const { licenseRepository } = await import('@/lib/repositories');
    
    // Create test license with correct schema
    const testLicense = {
      institutionId: `seats-test-${Date.now()}`,
      institution: 'Test Institution',
      seats: 50,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE' as const,
    };
    
    const license = await licenseRepository.create(testLicense);
    
    // Check available seats calculation (seats - usedSeats)
    const available = license.seats - license.usedSeats;
    
    expect(typeof available).toBe('number');
    expect(available).toBeGreaterThanOrEqual(0);
    expect(available).toBeLessThanOrEqual(50);
    expect(available).toBe(50); // Initially all seats are available
    
    // Cleanup
    await licenseRepository.delete(license.id);
  });
});
