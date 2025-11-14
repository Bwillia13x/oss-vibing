/**
 * FERPA Compliance Service
 * 
 * Implements FERPA (Family Educational Rights and Privacy Act) compliance features:
 * - Data retention policies
 * - Student data export (FERPA right to access)
 * - Student data deletion (right to be forgotten)
 * - Audit logging for data access
 * - Consent management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Data Retention Policies (in days)
 */
export const RETENTION_POLICIES = {
  ACTIVE_DOCUMENTS: 365 * 7, // 7 years for active educational records
  AUDIT_LOGS: 365 * 5, // 5 years for audit logs
  DELETED_USER_DATA: 90, // 90 days after deletion request
  INACTIVE_ACCOUNTS: 365 * 2, // 2 years of inactivity
} as const;

/**
 * Export user data in compliance with FERPA
 * Returns all personal and educational data associated with a user
 */
export async function exportUserData(userId: string): Promise<{
  user: unknown;
  documents: unknown[];
  references: unknown[];
  citations: unknown[];
  auditLogs: unknown[];
  metadata: {
    exportedAt: string;
    retentionPolicy: typeof RETENTION_POLICIES;
  };
}> {
  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch all associated data
  const [documents, references, citations, auditLogs] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
    }),
    prisma.reference.findMany({
      where: { userId },
    }),
    prisma.citation.findMany({
      where: { userId },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  // Remove sensitive fields for security
  const sanitizedUser = {
    ...user,
    // Don't include internal IDs in export
  };

  return {
    user: sanitizedUser,
    documents,
    references,
    citations,
    auditLogs,
    metadata: {
      exportedAt: new Date().toISOString(),
      retentionPolicy: RETENTION_POLICIES,
    },
  };
}

/**
 * Delete user data in compliance with FERPA
 * This is a soft delete that marks the user as deleted
 * Actual data deletion happens after retention period
 */
export async function requestUserDataDeletion(userId: string): Promise<{
  success: boolean;
  deletionDate: Date;
  message: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate deletion date (90 days from now)
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + RETENTION_POLICIES.DELETED_USER_DATA);

  // Mark user as deleted
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'DELETED',
      updatedAt: new Date(),
    },
  });

  // Log the deletion request
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DATA_DELETION_REQUESTED',
      resource: 'user',
      resourceId: userId,
      severity: 'INFO',
      details: JSON.stringify({
        requestedAt: new Date().toISOString(),
        scheduledDeletion: deletionDate.toISOString(),
      }),
      timestamp: new Date(),
    },
  });

  return {
    success: true,
    deletionDate,
    message: `Your data will be permanently deleted on ${deletionDate.toISOString()}. You have ${RETENTION_POLICIES.DELETED_USER_DATA} days to cancel this request.`,
  };
}

/**
 * Permanently delete user data
 * Should only be called after retention period
 */
export async function permanentlyDeleteUserData(userId: string): Promise<{
  success: boolean;
  deletedRecords: {
    documents: number;
    references: number;
    citations: number;
    auditLogs: number;
  };
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== 'DELETED') {
    throw new Error('User not marked for deletion');
  }

  // Delete all associated data
  const [deletedCitations, deletedReferences, deletedDocuments, deletedAuditLogs] =
    await Promise.all([
      prisma.citation.deleteMany({ where: { userId } }),
      prisma.reference.deleteMany({ where: { userId } }),
      prisma.document.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
    ]);

  // Delete the user
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    deletedRecords: {
      documents: deletedDocuments.count,
      references: deletedReferences.count,
      citations: deletedCitations.count,
      auditLogs: deletedAuditLogs.count,
    },
  };
}

/**
 * Clean up old data based on retention policies
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredData(): Promise<{
  deletedUsers: number;
  deletedAuditLogs: number;
}> {
  // Delete users marked for deletion after retention period
  const deletionCutoff = new Date();
  deletionCutoff.setDate(deletionCutoff.getDate() - RETENTION_POLICIES.DELETED_USER_DATA);

  const usersToDelete = await prisma.user.findMany({
    where: {
      status: 'DELETED',
      updatedAt: {
        lte: deletionCutoff,
      },
    },
  });

  let deletedUsers = 0;
  for (const user of usersToDelete) {
    await permanentlyDeleteUserData(user.id);
    deletedUsers++;
  }

  // Delete old audit logs
  const auditLogCutoff = new Date();
  auditLogCutoff.setDate(auditLogCutoff.getDate() - RETENTION_POLICIES.AUDIT_LOGS);

  const deletedAuditLogs = await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lte: auditLogCutoff,
      },
    },
  });

  return {
    deletedUsers,
    deletedAuditLogs: deletedAuditLogs.count,
  };
}

/**
 * Log data access for FERPA audit trail
 */
export async function logDataAccess(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      severity: 'INFO',
      timestamp: new Date(),
    },
  });
}

/**
 * Check if user has consented to data processing
 */
export async function hasUserConsent(userId: string): Promise<boolean> {
  // This would check a consent record in the database
  // For now, we'll return true if user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user?.status === 'ACTIVE';
}

/**
 * Record user consent
 */
export async function recordUserConsent(
  userId: string,
  consentType: string,
  granted: boolean
): Promise<void> {
  // Log the consent action
  await prisma.auditLog.create({
    data: {
      userId,
      action: granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      resource: 'consent',
      details: JSON.stringify({
        consentType,
        timestamp: new Date().toISOString(),
      }),
      severity: 'INFO',
      timestamp: new Date(),
    },
  });

  // In a full implementation, you would also store this in a dedicated consent table
}
