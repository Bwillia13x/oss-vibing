/**
 * Automated Data Retention Cleanup Job
 * 
 * Implements automated cleanup of data based on FERPA retention policies.
 * This job should be run as a scheduled task (e.g., daily cron job).
 * 
 * @see lib/compliance/ferpa.ts for retention policies
 */

import { PrismaClient } from '@prisma/client';
import { RETENTION_POLICIES, permanentlyDeleteUserData } from './ferpa';

const prisma = new PrismaClient();

interface CleanupResult {
  deletedUsers: number;
  deletedDocuments: number;
  deletedAuditLogs: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Clean up users marked for deletion past retention period
 */
async function cleanupDeletedUsers(): Promise<{
  count: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const deletionThreshold = new Date();
  deletionThreshold.setDate(
    deletionThreshold.getDate() - RETENTION_POLICIES.DELETED_USER_DATA
  );

  try {
    // Find users marked as deleted and past retention period
    const usersToDelete = await prisma.user.findMany({
      where: {
        status: 'DELETED',
        updatedAt: {
          lte: deletionThreshold,
        },
      },
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
    });

    console.log(
      `Found ${usersToDelete.length} users to permanently delete`
    );

    let deletedCount = 0;

    for (const user of usersToDelete) {
      try {
        await permanentlyDeleteUserData(user.id);
        deletedCount++;
        console.log(
          `Permanently deleted user ${user.id} (deleted on ${user.updatedAt})`
        );
      } catch (error) {
        const errorMsg = `Failed to delete user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { count: deletedCount, errors };
  } catch (error) {
    const errorMsg = `Failed to fetch users for deletion: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    return { count: 0, errors: [errorMsg] };
  }
}

/**
 * Clean up old documents based on retention policy
 * Note: Only deletes documents from deleted users
 */
async function cleanupOldDocuments(): Promise<{
  count: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // For now, only clean up documents from users who have been fully deleted
    // In the future, this could include archiving old documents
    const result = await prisma.document.deleteMany({
      where: {
        user: {
          status: 'DELETED',
        },
      },
    });

    console.log(
      `Cleaned up ${result.count} documents from deleted users`
    );

    return { count: result.count, errors };
  } catch (error) {
    const errorMsg = `Failed to clean up documents: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    return { count: 0, errors: [errorMsg] };
  }
}

/**
 * Clean up old audit logs based on retention policy
 */
async function cleanupOldAuditLogs(): Promise<{
  count: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const retentionThreshold = new Date();
  retentionThreshold.setDate(
    retentionThreshold.getDate() - RETENTION_POLICIES.AUDIT_LOGS
  );

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lte: retentionThreshold,
        },
      },
    });

    console.log(
      `Cleaned up ${result.count} audit logs older than ${RETENTION_POLICIES.AUDIT_LOGS} days`
    );

    return { count: result.count, errors };
  } catch (error) {
    const errorMsg = `Failed to clean up audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    return { count: 0, errors: [errorMsg] };
  }
}

/**
 * Clean up inactive user accounts
 * Marks accounts as DELETED if they haven't logged in for the threshold period
 */
async function cleanupInactiveAccounts(): Promise<{
  count: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const inactiveThreshold = new Date();
  inactiveThreshold.setDate(
    inactiveThreshold.getDate() - RETENTION_POLICIES.INACTIVE_ACCOUNTS
  );

  try {
    // Find users who haven't logged in within the threshold period
    // Users without lastLoginAt are considered active (legacy users)
    const inactiveUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        lastLoginAt: {
          not: null,
          lte: inactiveThreshold,
        },
      },
      select: {
        id: true,
        email: true,
        lastLoginAt: true,
      },
    });

    console.log(
      `Found ${inactiveUsers.length} inactive users (no login for ${RETENTION_POLICIES.INACTIVE_ACCOUNTS} days)`
    );

    let markedCount = 0;

    for (const user of inactiveUsers) {
      try {
        // Mark user as DELETED (soft delete)
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'DELETED' },
        });

        // Create audit log for the action
        await prisma.auditLog.create({
          data: {
            action: 'MARK_INACTIVE_USER_DELETED',
            resource: 'user',
            resourceId: user.id,
            severity: 'INFO',
            details: JSON.stringify({
              email: user.email,
              lastLoginAt: user.lastLoginAt,
              inactiveDays: Math.floor(
                (new Date().getTime() - user.lastLoginAt!.getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            }),
          },
        });

        markedCount++;
        console.log(
          `Marked inactive user ${user.id} as deleted (last login: ${user.lastLoginAt})`
        );
      } catch (error) {
        const errorMsg = `Failed to mark user ${user.id} as deleted: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { count: markedCount, errors };
  } catch (error) {
    const errorMsg = `Failed to query inactive users: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    return { count: 0, errors: [errorMsg] };
  }
}

/**
 * Run all retention cleanup tasks
 */
export async function runRetentionCleanup(): Promise<CleanupResult> {
  console.log('Starting retention cleanup job...');
  const startTime = Date.now();

  const result: CleanupResult = {
    deletedUsers: 0,
    deletedDocuments: 0,
    deletedAuditLogs: 0,
    errors: [],
    timestamp: new Date(),
  };

  // 1. Clean up deleted users past retention period
  const usersResult = await cleanupDeletedUsers();
  result.deletedUsers = usersResult.count;
  result.errors.push(...usersResult.errors);

  // 2. Clean up old documents
  const documentsResult = await cleanupOldDocuments();
  result.deletedDocuments = documentsResult.count;
  result.errors.push(...documentsResult.errors);

  // 3. Clean up old audit logs
  const auditLogsResult = await cleanupOldAuditLogs();
  result.deletedAuditLogs = auditLogsResult.count;
  result.errors.push(...auditLogsResult.errors);

  // 4. Mark inactive accounts
  const inactiveResult = await cleanupInactiveAccounts();
  result.errors.push(...inactiveResult.errors);

  const duration = Date.now() - startTime;
  console.log(`Retention cleanup completed in ${duration}ms`);
  console.log(`Results:`, {
    deletedUsers: result.deletedUsers,
    deletedDocuments: result.deletedDocuments,
    deletedAuditLogs: result.deletedAuditLogs,
    errors: result.errors.length,
  });

  // Log the cleanup to audit log
  try {
    await prisma.auditLog.create({
      data: {
        action: 'RETENTION_CLEANUP',
        resource: 'system',
        resourceId: 'retention-job',
        severity: result.errors.length > 0 ? 'WARNING' : 'INFO',
        details: JSON.stringify({
          deletedUsers: result.deletedUsers,
          deletedDocuments: result.deletedDocuments,
          deletedAuditLogs: result.deletedAuditLogs,
          errors: result.errors,
          duration,
        }),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log cleanup to audit log:', error);
  }

  return result;
}

/**
 * CLI entry point for running as a standalone job
 */
if (require.main === module) {
  runRetentionCleanup()
    .then((result) => {
      console.log('Cleanup job completed successfully');
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Cleanup job failed:', error);
      process.exit(1);
    });
}
