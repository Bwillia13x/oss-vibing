/**
 * FERPA Compliance Integration Tests
 * Tests for FERPA data protection, encryption, consent, and access logging
 */

import { describe, test, expect } from 'vitest';

describe('FERPA Encryption', () => {
  test('should encrypt data', async () => {
    const { encryptData } = await import('@/lib/compliance/encryption');
    
    const sensitiveData = 'Test SSN: 123-45-6789';
    const encrypted = encryptData(sensitiveData);
    
    expect(encrypted).toBeDefined();
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(sensitiveData);
  });

  test('should decrypt encrypted data', async () => {
    const { encryptData, decryptData } = await import('@/lib/compliance/encryption');
    
    const originalData = 'Test DOB: 01/01/2000';
    const encrypted = encryptData(originalData);
    const decrypted = decryptData(encrypted);
    
    expect(decrypted).toBe(originalData);
  });

  test('should encrypt and decrypt objects', async () => {
    const { encryptObject, decryptObject } = await import('@/lib/compliance/encryption');
    
    const testObj = {
      ssn: '123-45-6789',
      dob: '01/01/2000',
      address: '123 Test St'
    };
    
    const encrypted = encryptObject(testObj);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');
    
    const decrypted = decryptObject<typeof testObj>(encrypted);
    expect(decrypted).toEqual(testObj);
  });

  test('should hash data', async () => {
    const { hashData } = await import('@/lib/compliance/encryption');
    
    const data = 'sensitive-data';
    const hash = hashData(data);
    
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(data);
    expect(typeof hash).toBe('string');
  });

  test('should validate encryption configuration', async () => {
    const { validateEncryption } = await import('@/lib/compliance/encryption');
    
    const isValid = validateEncryption();
    expect(typeof isValid).toBe('boolean');
  });

  test('should generate different encrypted values for same input', async () => {
    const { encryptData } = await import('@/lib/compliance/encryption');
    
    const data = 'Test data';
    const encrypted1 = encryptData(data);
    const encrypted2 = encryptData(data);
    
    // Same data should produce different ciphertext due to random IV
    expect(encrypted1).not.toBe(encrypted2);
  });
});

describe('FERPA Consent Management', () => {
  test('should check user consent status', async () => {
    const { hasUserConsent } = await import('@/lib/compliance/ferpa');
    
    // Test with non-existent user
    const hasConsent = await hasUserConsent('nonexistent-user-id');
    
    expect(typeof hasConsent).toBe('boolean');
  });

  test('should record user consent', async () => {
    const { recordUserConsent, hasUserConsent } = await import('@/lib/compliance/ferpa');
    const { userRepository } = await import('@/lib/repositories');
    
    // Create test user
    const user = await userRepository.create({
      email: `consent-test${Date.now()}@example.com`,
      name: 'Consent Test',
      role: 'USER',
    });
    
    // Record consent (actual signature: userId, consentType, granted)
    await recordUserConsent(user.id, 'dataProcessing', true);
    await recordUserConsent(user.id, 'marketing', false);
    await recordUserConsent(user.id, 'thirdParty', false);
    
    // Verify consent
    const hasConsent = await hasUserConsent(user.id);
    expect(hasConsent).toBe(true);
    
    // Cleanup
    await userRepository.delete(user.id);
  });

  test('should export user data', async () => {
    const { exportUserData } = await import('@/lib/compliance/ferpa');
    const { userRepository } = await import('@/lib/repositories');
    
    // Create test user
    const user = await userRepository.create({
      email: `export-test${Date.now()}@example.com`,
      name: 'Export Test',
      role: 'USER',
    });
    
    // Export data
    const exported = await exportUserData(user.id);
    
    expect(exported).toBeDefined();
    expect(exported).toHaveProperty('user');
    expect(exported).toHaveProperty('documents');
    expect(exported).toHaveProperty('metadata');
    
    // Cleanup
    await userRepository.delete(user.id);
  });

  test('should request user data deletion', async () => {
    const { requestUserDataDeletion } = await import('@/lib/compliance/ferpa');
    const { userRepository } = await import('@/lib/repositories');
    
    // Create test user
    const user = await userRepository.create({
      email: `delete-request-test${Date.now()}@example.com`,
      name: 'Delete Request Test',
      role: 'USER',
    });
    
    // Request deletion
    const result = await requestUserDataDeletion(user.id);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.deletionDate).toBeDefined();
    
    // Cleanup
    await userRepository.delete(user.id);
  });
});

describe('FERPA Access Logging', () => {
  test('should log data access', async () => {
    const { logDataAccess } = await import('@/lib/compliance/ferpa');
    
    // Actual signature: userId, resource, action, resourceId?, details?
    await expect(
      logDataAccess(
        'test-student',
        'student_record',
        'view',
        'test-record-id',
        { fields: ['grades', 'profile'], accessedBy: 'test-instructor' }
      )
    ).resolves.not.toThrow();
  });

  test('should verify legitimate educational interest', async () => {
    const { verifyLegitimateEducationalInterest } = await import('@/lib/compliance/ferpa');
    
    // Actual signature: requestorId, targetUserId, resource
    const result = await verifyLegitimateEducationalInterest(
      'instructor-id',
      'student-id',
      'student_record'
    );
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('reason');
    expect(typeof result.allowed).toBe('boolean');
  });

  test('should track access for compliance reporting', async () => {
    const { logDataAccess } = await import('@/lib/compliance/ferpa');
    
    const accessTypes = ['view', 'update', 'delete', 'export'];
    
    for (const action of accessTypes) {
      // Actual signature: userId, resource, action, resourceId?, details?
      await expect(
        logDataAccess(
          'test-user',
          'test_resource',
          action,
          'test-id',
          { accessedBy: 'test-admin' }
        )
      ).resolves.not.toThrow();
    }
  });

  test('should verify parent access to student records', async () => {
    const { verifyParentAccess } = await import('@/lib/compliance/ferpa');
    
    // Actual signature: parentEmail, studentId
    const hasAccess = await verifyParentAccess(
      'parent@example.com',
      'student-id'
    );
    
    expect(typeof hasAccess).toBe('boolean');
  });
});

describe('FERPA Data Retention', () => {
  test('should have defined retention policies', async () => {
    const { RETENTION_POLICIES } = await import('@/lib/compliance/ferpa');
    
    expect(RETENTION_POLICIES).toBeDefined();
    expect(RETENTION_POLICIES.ACTIVE_DOCUMENTS).toBeGreaterThan(0);
    expect(RETENTION_POLICIES.AUDIT_LOGS).toBeGreaterThan(0);
    expect(RETENTION_POLICIES.DELETED_USER_DATA).toBeGreaterThan(0);
    expect(RETENTION_POLICIES.INACTIVE_ACCOUNTS).toBeGreaterThan(0);
  });

  test('should cleanup expired data', async () => {
    const { cleanupExpiredData } = await import('@/lib/compliance/ferpa');
    
    const result = await cleanupExpiredData();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('deletedUsers');
    expect(result).toHaveProperty('deletedAuditLogs');
    expect(typeof result.deletedUsers).toBe('number');
    expect(typeof result.deletedAuditLogs).toBe('number');
  });

  test('should run retention cleanup', async () => {
    const { runRetentionCleanup } = await import('@/lib/compliance/retention-cleanup');
    
    const result = await runRetentionCleanup();
    
    expect(result).toBeDefined();
    expect(typeof result.deleted).toBe('number');
    expect(result.deleted).toBeGreaterThanOrEqual(0);
  });

  test('should perform data minimization audit', async () => {
    const { performDataMinimizationAudit } = await import('@/lib/compliance/ferpa');
    const { userRepository } = await import('@/lib/repositories');
    
    // Create test user
    const user = await userRepository.create({
      email: `audit-test${Date.now()}@example.com`,
      name: 'Audit Test',
      role: 'USER',
    });
    
    const audit = await performDataMinimizationAudit(user.id);
    
    expect(audit).toBeDefined();
    expect(audit).toHaveProperty('unnecessaryFields');
    expect(audit).toHaveProperty('recommendations');
    expect(Array.isArray(audit.unnecessaryFields)).toBe(true);
    expect(Array.isArray(audit.recommendations)).toBe(true);
    
    // Cleanup
    await userRepository.delete(user.id);
  });
});

describe('FERPA Directory Disclosure', () => {
  test('should get directory disclosure settings', async () => {
    const { getDirectoryDisclosureSettings } = await import('@/lib/compliance/ferpa');
    
    const settings = await getDirectoryDisclosureSettings('test-institution');
    
    expect(settings).toBeDefined();
    expect(settings).toHaveProperty('allowName');
    expect(settings).toHaveProperty('allowEmail');
    expect(settings).toHaveProperty('allowMajor');
    expect(typeof settings.allowName).toBe('boolean');
  });

  test('should update directory disclosure settings', async () => {
    const { updateDirectoryDisclosureSettings } = await import('@/lib/compliance/ferpa');
    const { userRepository } = await import('@/lib/repositories');
    
    // Create a user for the test
    const user = await userRepository.create({
      email: `disclosure-test${Date.now()}@example.com`,
      name: 'Disclosure Test',
      role: 'USER',
    });
    
    const newSettings = {
      allowName: true,
      allowEmail: false,
      allowMajor: true,
    };
    
    await expect(
      updateDirectoryDisclosureSettings(user.id, newSettings)
    ).resolves.not.toThrow();
    
    // Cleanup
    await userRepository.delete(user.id);
  });
});

describe('FERPA Compliance Validation', () => {
  test('should validate encryption configuration', async () => {
    const { validateEncryption } = await import('@/lib/compliance/encryption');
    
    const isValid = validateEncryption();
    expect(typeof isValid).toBe('boolean');
  });

  test('should generate compliance report', async () => {
    const { generateComplianceReport } = await import('@/lib/compliance/ferpa');
    
    const report = await generateComplianceReport('test-institution');
    
    expect(report).toBeDefined();
    expect(report).toHaveProperty('totalUsers');
    expect(report).toHaveProperty('activeConsents');
    expect(report).toHaveProperty('compliance');
    expect(report).toHaveProperty('recommendations');
    expect(typeof report.totalUsers).toBe('number');
  });

  test('should validate institution compliance', async () => {
    const { generateComplianceReport } = await import('@/lib/compliance/ferpa');
    
    // Generate report without institution (overall compliance)
    const report = await generateComplianceReport();
    
    expect(report).toBeDefined();
    expect(report).toHaveProperty('totalUsers');
    expect(report).toHaveProperty('compliance');
    expect(typeof report.totalUsers).toBe('number');
  });
});
