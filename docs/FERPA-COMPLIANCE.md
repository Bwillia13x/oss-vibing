# FERPA Compliance Documentation

## Overview

This document outlines the FERPA (Family Educational Rights and Privacy Act) compliance features implemented in Vibe University, ensuring the protection of student educational records in accordance with federal regulations.

## Table of Contents

1. [What is FERPA?](#what-is-ferpa)
2. [Implementation Overview](#implementation-overview)
3. [Data Protection](#data-protection)
4. [Access Controls](#access-controls)
5. [Audit Logging](#audit-logging)
6. [Data Retention](#data-retention)
7. [Student Rights](#student-rights)
8. [Administrator Guide](#administrator-guide)
9. [Compliance Reporting](#compliance-reporting)
10. [Troubleshooting](#troubleshooting)

## What is FERPA?

The Family Educational Rights and Privacy Act (FERPA) is a federal law that protects the privacy of student education records. It gives parents and eligible students (those who are 18 years of age or older) certain rights with respect to their education records.

### Key FERPA Requirements

- **Privacy Protection**: Educational records must be kept confidential
- **Consent Required**: Written consent needed for disclosure (with exceptions)
- **Right to Access**: Students/parents can inspect and review records
- **Right to Amend**: Students/parents can request corrections
- **Legitimate Educational Interest**: Access limited to those with legitimate need
- **Annual Notification**: Institutions must notify about FERPA rights annually

## Implementation Overview

### Core Components

1. **Encryption** (`lib/compliance/encryption.ts`)
   - AES-256-GCM encryption for sensitive data
   - Secure key management
   - Data hashing for verification

2. **FERPA Service** (`lib/compliance/ferpa.ts`)
   - Consent management
   - Data export (right to access)
   - Data deletion (right to be forgotten)
   - Educational interest verification
   - Parent access verification

3. **Retention Policies** (`lib/compliance/retention-cleanup.ts`)
   - Automated data retention enforcement
   - Scheduled cleanup jobs
   - Compliance with record-keeping requirements

## Data Protection

### Encryption at Rest

All personally identifiable information (PII) is encrypted before storage using AES-256-GCM encryption.

#### Encrypted Data Fields

- Student Social Security Numbers (SSN)
- Date of Birth (DOB)
- Home Address
- Phone Numbers
- Other sensitive personal information

#### Usage Example

```typescript
import { encryptData, decryptData } from '@/lib/compliance/encryption';

// Encrypting sensitive data
const ssn = '123-45-6789';
const encrypted = encryptData(ssn);

// Decrypting when needed
const decrypted = decryptData(encrypted);
```

#### Encrypting Objects

```typescript
import { encryptObject, decryptObject } from '@/lib/compliance/encryption';

const sensitiveData = {
  ssn: '123-45-6789',
  dob: '01/01/2000',
  address: '123 Main St, City, State'
};

// Encrypt entire object
const encrypted = encryptObject(sensitiveData);

// Decrypt when authorized
const decrypted = decryptObject(encrypted);
```

### Data Hashing

For verification purposes without storing plaintext:

```typescript
import { hashData } from '@/lib/compliance/encryption';

const ssn = '123-45-6789';
const hash = hashData(ssn);
// Store hash for verification, never the original
```

## Access Controls

### Consent Management

Students must provide explicit consent before their educational records can be accessed or shared.

#### Recording Consent

```typescript
import { recordUserConsent } from '@/lib/compliance/ferpa';

await recordUserConsent(userId, {
  dataProcessing: true,
  marketing: false,
  thirdParty: false
});
```

#### Checking Consent

```typescript
import { hasUserConsent } from '@/lib/compliance/ferpa';

const hasConsent = await hasUserConsent(userId);
if (!hasConsent) {
  // Deny access or request consent
}
```

### Legitimate Educational Interest

Access to student records is restricted to school officials with a legitimate educational interest.

```typescript
import { verifyLegitimateEducationalInterest } from '@/lib/compliance/ferpa';

const isLegitimate = await verifyLegitimateEducationalInterest({
  accessorId: instructorId,
  studentId: studentId,
  purpose: 'Grading assignment',
  institutionId: institutionId
});

if (!isLegitimate) {
  throw new Error('Access denied: No legitimate educational interest');
}
```

### Parent Access

Parents of students under 18 years of age have rights to access educational records.

```typescript
import { verifyParentAccess } from '@/lib/compliance/ferpa';

const hasAccess = await verifyParentAccess({
  parentId: parentId,
  studentId: studentId,
  studentAge: 16 // Under 18
});
```

## Audit Logging

All access to student educational records is logged for compliance and security purposes.

### Logging Data Access

```typescript
import { logDataAccess } from '@/lib/compliance/ferpa';

await logDataAccess({
  userId: studentId,
  accessedBy: instructorId,
  action: 'view',
  resource: 'student_grades',
  resourceId: gradeId,
  details: {
    course: 'CSCI 101',
    timestamp: new Date().toISOString()
  }
});
```

### Audit Log Fields

- **userId**: Student whose data was accessed
- **accessedBy**: User who accessed the data
- **action**: Type of access (view, update, delete, export)
- **resource**: Type of resource accessed
- **resourceId**: Specific record ID
- **details**: Additional context (JSON)
- **timestamp**: When access occurred
- **ipAddress**: IP address of accessor (captured automatically)

## Data Retention

### Retention Policies

Defined in `lib/compliance/ferpa.ts`:

```typescript
export const RETENTION_POLICIES = {
  ACTIVE_DOCUMENTS: 365 * 7,    // 7 years for active records
  AUDIT_LOGS: 365 * 5,          // 5 years for audit logs
  DELETED_USER_DATA: 90,        // 90 days after deletion request
  INACTIVE_ACCOUNTS: 365 * 2,   // 2 years of inactivity
};
```

### Automated Cleanup

A scheduled job runs daily to enforce retention policies:

```bash
# Manual execution
npm run retention:cleanup
```

Or programmatically:

```typescript
import { runRetentionCleanup } from '@/lib/compliance/retention-cleanup';

const result = await runRetentionCleanup();
console.log(`Deleted ${result.deleted} expired records`);
```

### Data Minimization Audit

Regularly audit data to ensure only necessary information is retained:

```typescript
import { performDataMinimizationAudit } from '@/lib/compliance/ferpa';

const audit = await performDataMinimizationAudit(userId);
console.log('Recommendations:', audit.recommendations);
```

## Student Rights

### Right to Access (Data Export)

Students have the right to access all their educational records.

```typescript
import { exportUserData } from '@/lib/compliance/ferpa';

const exportData = await exportUserData(userId);
// Returns: {
//   user: {...},
//   documents: [...],
//   references: [...],
//   citations: [...],
//   auditLogs: [...],
//   metadata: {...}
// }
```

### Right to Request Deletion

Students can request deletion of their data (subject to legal retention requirements).

```typescript
import { requestUserDataDeletion } from '@/lib/compliance/ferpa';

const result = await requestUserDataDeletion(userId);
console.log(`Deletion scheduled for: ${result.deletionDate}`);
```

**Note**: Some records must be retained for legal/regulatory reasons even after deletion request.

### Directory Information

Students can opt out of directory information disclosure.

```typescript
import { 
  getDirectoryDisclosureSettings,
  updateDirectoryDisclosureSettings 
} from '@/lib/compliance/ferpa';

// Get current settings
const settings = await getDirectoryDisclosureSettings(institutionId);

// Update settings
await updateDirectoryDisclosureSettings(institutionId, {
  allowedFields: ['name', 'major', 'year'],
  requireOptIn: true,
  notificationPeriod: 14 // days
});
```

## Administrator Guide

### Setting Up FERPA Compliance

1. **Environment Configuration**

Add to `.env`:
```bash
# 64-character hex string (32 bytes) for AES-256
ENCRYPTION_KEY=your_64_character_hex_string_here

# Generate with: openssl rand -hex 32
```

2. **Verify Encryption**

```typescript
import { validateEncryption } from '@/lib/compliance/encryption';

const isValid = validateEncryption();
if (!isValid) {
  console.error('Encryption not properly configured');
}
```

3. **Schedule Retention Cleanup**

In `package.json`:
```json
{
  "scripts": {
    "retention:cleanup": "tsx lib/compliance/retention-cleanup.ts"
  }
}
```

Set up a cron job or use your platform's scheduler to run daily at 2 AM.

### Monitoring Compliance

#### Generate Compliance Report

```typescript
import { generateComplianceReport } from '@/lib/compliance/ferpa';

// For specific institution
const report = await generateComplianceReport(institutionId);

// Overall compliance
const overallReport = await generateComplianceReport();

console.log(report);
// {
//   institutionId: '...',
//   generatedAt: '...',
//   dataRetention: { ... },
//   accessControls: { ... },
//   auditTrail: { ... },
//   recommendations: [...]
// }
```

### Responding to Data Requests

#### Export Request

```typescript
// 1. Verify requester identity
// 2. Confirm authorization (student or parent)
// 3. Export data
const data = await exportUserData(studentId);

// 4. Provide secure download link or encrypted file
// 5. Log the export action
await logDataAccess({
  userId: studentId,
  accessedBy: requesterId,
  action: 'export',
  resource: 'full_export',
  resourceId: studentId,
  details: { requestDate: new Date() }
});
```

#### Deletion Request

```typescript
// 1. Verify requester identity
// 2. Confirm no legal hold
// 3. Request deletion
const result = await requestUserDataDeletion(studentId);

// 4. Inform student of deletion timeline
// 5. Monitor automated cleanup
```

## Compliance Reporting

### Access Logs Report

```typescript
import { prisma } from '@/lib/db/client';

const logs = await prisma.auditLog.findMany({
  where: {
    action: { in: ['view', 'export', 'delete'] },
    timestamp: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31')
    }
  },
  orderBy: { timestamp: 'desc' }
});
```

### Encryption Compliance

```typescript
import { validateEncryption } from '@/lib/compliance/encryption';

if (!validateEncryption()) {
  // Alert administrators
  console.error('CRITICAL: Encryption not properly configured');
}
```

### Retention Policy Compliance

```typescript
import { cleanupExpiredData } from '@/lib/compliance/ferpa';

const result = await cleanupExpiredData();
console.log(`Compliance cleanup completed:`);
console.log(`- Users deleted: ${result.deletedUsers}`);
console.log(`- Documents archived: ${result.archivedDocuments}`);
console.log(`- Audit logs deleted: ${result.deletedAuditLogs}`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}
```

## Troubleshooting

### Common Issues

#### 1. Encryption Key Not Set

**Error**: `ENCRYPTION_KEY not configured`

**Solution**:
```bash
# Generate a new key
openssl rand -hex 32

# Add to .env
ENCRYPTION_KEY=<generated_key>
```

#### 2. Consent Not Found

**Error**: Student access denied due to missing consent

**Solution**: Implement consent collection flow in your application:
```typescript
// Prompt student for consent
await recordUserConsent(userId, {
  dataProcessing: true,
  marketing: false,
  thirdParty: false
});
```

#### 3. Audit Logs Growing Too Large

**Solution**: Ensure retention cleanup is running regularly:
```bash
npm run retention:cleanup
```

Check cleanup results and adjust retention policies if needed.

#### 4. Unauthorized Access Attempts

**Solution**: Review audit logs and strengthen access controls:
```typescript
// Check for failed access attempts
const failedAttempts = await prisma.auditLog.findMany({
  where: {
    action: 'access_denied',
    timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }
});
```

## Security Best Practices

1. **Encryption Keys**
   - Store encryption keys in secure environment variables
   - Never commit keys to version control
   - Rotate keys periodically
   - Use different keys for different environments

2. **Access Controls**
   - Implement role-based access control (RBAC)
   - Require multi-factor authentication for sensitive operations
   - Regular access reviews
   - Principle of least privilege

3. **Audit Logging**
   - Log all access to educational records
   - Protect audit logs from modification
   - Regular review of access patterns
   - Alert on suspicious activity

4. **Data Retention**
   - Automate retention policy enforcement
   - Regular compliance audits
   - Document retention decisions
   - Secure disposal of expired data

## Compliance Checklist

- [ ] Encryption key properly configured
- [ ] All PII fields encrypted at rest
- [ ] Consent mechanism implemented
- [ ] Access logging enabled
- [ ] Retention policies configured
- [ ] Automated cleanup scheduled
- [ ] Annual FERPA notification sent to students
- [ ] Staff trained on FERPA requirements
- [ ] Incident response plan documented
- [ ] Regular compliance audits scheduled

## References

- [FERPA Official Website](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- [FERPA Regulations (34 CFR Part 99)](https://www.ecfr.gov/current/title-34/subtitle-A/part-99)
- [Student Privacy Best Practices](https://studentprivacy.ed.gov/)
- [EDUCAUSE FERPA Resources](https://www.educause.edu/focus-areas-and-initiatives/policy-and-security/cybersecurity-program/resources/information-security-guide/toolkits/ferpa-compliance)

## Support

For FERPA compliance questions or issues:
- Technical: See troubleshooting section above
- Legal: Consult your institution's legal counsel
- Policy: Contact your institution's registrar or compliance officer

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Maintained By**: Engineering Team
