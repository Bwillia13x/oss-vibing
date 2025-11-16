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
    
    // Record consent
    await recordUserConsent(user.id, {
      dataProcessing: true,
      marketing: false,
      thirdParty: false,
    });
    
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
    
    await expect(
      logDataAccess({
        userId: 'test-student',
        accessedBy: 'test-instructor',
        action: 'view',
        resource: 'student_record',
        resourceId: 'test-record-id',
        details: { fields: ['grades', 'profile'] },
      })
    ).resolves.not.toThrow();
  });

  test('should verify legitimate educational interest', async () => {
    const { verifyLegitimateEducationalInterest } = await import('@/lib/compliance/ferpa');
    
    const isLegitimate = await verifyLegitimateEducationalInterest({
      accessorId: 'instructor-id',
      studentId: 'student-id',
      purpose: 'Grading assignment',
      institutionId: 'test-institution',
    });
    
    expect(typeof isLegitimate).toBe('boolean');
  });

  test('should track access for compliance reporting', async () => {
    const { logDataAccess } = await import('@/lib/compliance/ferpa');
    
    const accessTypes = ['view', 'update', 'delete', 'export'];
    
    for (const action of accessTypes) {
      await expect(
        logDataAccess({
          userId: 'test-user',
          accessedBy: 'test-admin',
          action,
          resource: 'test_resource',
          resourceId: 'test-id',
          details: {},
        })
      ).resolves.not.toThrow();
    }
  });

  test('should verify parent access to student records', async () => {
    const { verifyParentAccess } = await import('@/lib/compliance/ferpa');
    
    const hasAccess = await verifyParentAccess({
      parentId: 'parent-id',
      studentId: 'student-id',
      studentAge: 16, // Under 18
    });
    
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
    expect(result).toHaveProperty('archivedDocuments');
    expect(result).toHaveProperty('deletedAuditLogs');
    expect(result).toHaveProperty('errors');
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
    expect(audit).toHaveProperty('userId');
    expect(audit).toHaveProperty('recommendations');
    
    // Cleanup
    await userRepository.delete(user.id);
  });
});

describe('FERPA Directory Disclosure', () => {
  test('should get directory disclosure settings', async () => {
    const { getDirectoryDisclosureSettings } = await import('@/lib/compliance/ferpa');
    
    const settings = await getDirectoryDisclosureSettings('test-institution');
    
    expect(settings).toBeDefined();
    expect(settings).toHaveProperty('allowedFields');
    expect(Array.isArray(settings.allowedFields)).toBe(true);
  });

  test('should update directory disclosure settings', async () => {
    const { updateDirectoryDisclosureSettings } = await import('@/lib/compliance/ferpa');
    
    const newSettings = {
      allowedFields: ['name', 'email'],
      requireOptIn: true,
      notificationPeriod: 14,
    };
    
    await expect(
      updateDirectoryDisclosureSettings('test-institution', newSettings)
    ).resolves.not.toThrow();
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
    expect(report).toHaveProperty('institutionId');
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('dataRetention');
    expect(report).toHaveProperty('accessControls');
    expect(report).toHaveProperty('auditTrail');
  });

  test('should validate institution compliance', async () => {
    const { generateComplianceReport } = await import('@/lib/compliance/ferpa');
    
    // Generate report without institution (overall compliance)
    const report = await generateComplianceReport();
    
    expect(report).toBeDefined();
    expect(report.generatedAt).toBeDefined();
  });
});
