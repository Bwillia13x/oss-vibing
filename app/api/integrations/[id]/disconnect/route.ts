/**
 * Integration Disconnect API
 * 
 * Handles disconnecting third-party integrations
 * POST /api/integrations/[id]/disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Disconnect an integration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const integrationId = params.id;

    // Validate integration ID
    const validIntegrations = ['zotero', 'mendeley'];
    if (!validIntegrations.includes(integrationId)) {
      return NextResponse.json(
        { error: 'Invalid integration ID' },
        { status: 400 }
      );
    }

    // TODO: Get user ID from auth session
    // For now, we'll use a placeholder
    // const userId = await getCurrentUserId(request);
    
    // In a production implementation, you would:
    // 1. Delete OAuth tokens from secure storage
    // 2. Revoke access tokens with the provider
    // 3. Clear any cached data
    // 4. Log the disconnection
    
    // For now, we'll just log the action
    await prisma.auditLog.create({
      data: {
        action: 'DISCONNECT_INTEGRATION',
        resource: 'integration',
        resourceId: integrationId,
        severity: 'INFO',
        details: JSON.stringify({
          integration: integrationId,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      integration: integrationId,
      message: `Successfully disconnected from ${integrationId}`,
    });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect integration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
