/**
 * Integration Disconnect API
 * 
 * Handles disconnecting third-party integrations
 * POST /api/integrations/[id]/disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntegrationProvider } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Disconnect an integration
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const integrationId = segments[segments.length - 2];

    // Validate integration ID
    const validIntegrations = ['zotero', 'mendeley'];
    if (!validIntegrations.includes(integrationId)) {
      return NextResponse.json(
        { error: 'Invalid integration ID' },
        { status: 400 }
      );
    }
    
    const provider =
      integrationId === 'zotero'
        ? IntegrationProvider.ZOTERO
        : IntegrationProvider.MENDELEY;

    // Delete integration connection if it exists
    const existing = await prisma.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider,
        },
      },
    });

    if (existing) {
      await prisma.integrationConnection.delete({
        where: {
          userId_provider: {
            userId: user.id,
            provider,
          },
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DISCONNECT_INTEGRATION',
        resource: 'integration',
        resourceId: integrationId,
        severity: 'INFO',
        details: JSON.stringify({
          integration: integrationId,
          hadConnection: Boolean(existing),
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
