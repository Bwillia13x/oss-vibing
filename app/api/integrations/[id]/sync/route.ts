/**
 * Integration Sync API
 * 
 * Handles syncing data from third-party integrations
 * POST /api/integrations/[id]/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntegrationProvider } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';
import { syncIntegrationReferences } from '@/lib/integrations/reference-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sync data from an integration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const integrationId = params.id;

    // Validate integration ID
    const validIntegrations = ['zotero', 'mendeley'];
    if (!validIntegrations.includes(integrationId)) {
      return NextResponse.json(
        { error: 'Invalid integration ID' },
        { status: 400 }
      );
    }
    
    const syncStartTime = new Date();
    
    // Look up integration connection for this user and provider
    const provider =
      integrationId === 'zotero'
        ? IntegrationProvider.ZOTERO
        : IntegrationProvider.MENDELEY;

    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        {
          error: 'Integration not connected',
          code: 'integration_not_connected',
        },
        { status: 409 }
      );
    }

    // Perform reference sync
    const syncResult = await syncIntegrationReferences(connection);
    const itemsSynced = syncResult.created + syncResult.updated;
    
    // Log the sync
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SYNC_INTEGRATION',
        resource: 'integration',
        resourceId: integrationId,
        severity: 'INFO',
        details: JSON.stringify({
          integration: integrationId,
          itemsSynced,
          created: syncResult.created,
          updated: syncResult.updated,
          timestamp: syncStartTime.toISOString(),
          duration: Date.now() - syncStartTime.getTime(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      integration: integrationId,
      itemsSynced,
      lastSyncAt: syncStartTime.toISOString(),
      message: `Successfully synced ${itemsSynced} items from ${integrationId}`,
    });
  } catch (error) {
    console.error('Error syncing integration:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync integration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
