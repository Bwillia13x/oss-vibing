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
    expect(result).toHaveProperty('pagination');
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
    
    // Delete the user
    const deleted = await userRepository.delete(user.id);
    expect(deleted).toBe(true);
    
    // Verify deletion
    const found = await userRepository.findById(user.id);
    expect(found).toBeNull();
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
    
    const analytics = await getInstitutionAnalytics('test-institution', '30d');
    
    expect(analytics).toBeDefined();
    expect(analytics).toHaveProperty('activeUsers');
    expect(analytics).toHaveProperty('documentsCreated');
    expect(analytics).toHaveProperty('citationsAdded');
  });

  test('should cache analytics results', async () => {
    const { getInstitutionAnalytics } = await import('@/lib/admin-analytics');
    
    // First call
    const analytics1 = await getInstitutionAnalytics('cache-test-inst', '30d');
    
    // Second call (should use cache if available)
    const analytics2 = await getInstitutionAnalytics('cache-test-inst', '30d');
    
    // Results should be consistent
    expect(analytics1).toEqual(analytics2);
  });

  test('should support different time periods', async () => {
    const { getInstitutionAnalytics } = await import('@/lib/admin-analytics');
    
    const periods = ['7d', '30d', '90d'];
    
    for (const period of periods) {
      const analytics = await getInstitutionAnalytics('test-inst', period);
      expect(analytics).toBeDefined();
    }
  });
});

describe('Audit Logging', () => {
  test('should create audit log entry', async () => {
    const { auditLogRepository } = await import('@/lib/repositories');
    
    const logEntry = await auditLogRepository.create({
      userId: 'test-user-id',
      action: 'test.action',
      resource: 'test',
      resourceId: 'test-resource-id',
      details: { test: 'data' },
      severity: 'INFO',
    });
    
    expect(logEntry).toBeDefined();
    expect(logEntry.id).toBeDefined();
    expect(logEntry.action).toBe('test.action');
    
    // Cleanup
    await auditLogRepository.delete(logEntry.id);
  });

  test('should list audit logs with pagination', async () => {
    const { auditLogRepository } = await import('@/lib/repositories');
    
    const result = await auditLogRepository.list({}, { page: 1, perPage: 10 });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(10);
  });

  test('should filter audit logs by user', async () => {
    const { auditLogRepository } = await import('@/lib/repositories');
    
    const userId = 'filter-test-user';
    
    // Create test log
    const logEntry = await auditLogRepository.create({
      userId,
      action: 'filter.test',
      resource: 'test',
      resourceId: 'test-id',
      details: {},
      severity: 'INFO',
    });
    
    const result = await auditLogRepository.list(
      { userId },
      { page: 1, perPage: 10 }
    );
    
    expect(result.data.every(log => log.userId === userId)).toBe(true);
    
    // Cleanup
    await auditLogRepository.delete(logEntry.id);
  });
});

describe('License Management', () => {
  test('should manage institution licenses', async () => {
    const { licenseRepository } = await import('@/lib/repositories');
    
    const testLicense = {
      institutionId: `test-inst-${Date.now()}`,
      plan: 'ENTERPRISE' as const,
      seats: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
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
    
    const testLicense = {
      institutionId: `seats-test-${Date.now()}`,
      plan: 'ENTERPRISE' as const,
      seats: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
    
    const license = await licenseRepository.create(testLicense);
    
    const available = await licenseRepository.getAvailableSeats(license.institutionId);
    
    expect(typeof available).toBe('number');
    expect(available).toBeGreaterThanOrEqual(0);
    expect(available).toBeLessThanOrEqual(50);
    
    // Cleanup
    await licenseRepository.delete(license.id);
  });
});
