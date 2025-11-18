/**
 * Data Retention Cleanup API
 * 
 * Manually trigger the automated retention cleanup job.
 * This endpoint should be restricted to admin users only.
 * 
 * POST /api/compliance/cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { runRetentionCleanup } from '@/lib/compliance/retention-cleanup';
import { requireInstitutionAccess } from '@/lib/auth';
import { UnauthorizedError, formatErrorResponse } from '@/lib/errors/api-errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Manually trigger retention cleanup
 * 
 * @requires Admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    // Note: Using a system-level institution check, or we could check user role directly
    const authResult = await requireInstitutionAccess(request, 'system', ['admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    console.log('Manual retention cleanup triggered by admin');
    
    const result = await runRetentionCleanup();
    
    return NextResponse.json({
      success: true,
      result: {
        deletedUsers: result.deletedUsers,
        deletedDocuments: result.deletedDocuments,
        deletedAuditLogs: result.deletedAuditLogs,
        timestamp: result.timestamp,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Retention cleanup failed:', error);
    
    if (error instanceof UnauthorizedError) {
      return formatErrorResponse(error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run retention cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get information about retention cleanup schedule and policies
 */
export async function GET() {
  return NextResponse.json({
    schedule: {
      recommended: 'Daily at 2:00 AM UTC',
      implementation: 'Use cron job or scheduled task to call POST /api/compliance/cleanup',
    },
    policies: {
      deletedUserData: '90 days',
      auditLogs: '1825 days (5 years)',
      activeDocuments: '2555 days (7 years)',
      inactiveAccounts: '730 days (2 years)',
    },
    endpoints: {
      trigger: 'POST /api/compliance/cleanup',
      info: 'GET /api/compliance/cleanup',
    },
  });
}
