/**
 * Consent Management API
 * 
 * FERPA compliance endpoint for managing user consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordUserConsent, hasUserConsent } from '@/lib/compliance/ferpa';

export async function GET(_req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has consented
    const hasConsent = await hasUserConsent(user.userId);

    return NextResponse.json({
      userId: user.userId,
      hasConsent,
    });
  } catch (error) {
    console.error('Error checking consent:', error);
    return NextResponse.json(
      { error: 'Failed to check consent' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { consentType, granted } = body;

    if (!consentType || typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Record consent
    await recordUserConsent(user.userId, consentType, granted);

    return NextResponse.json({
      success: true,
      consentType,
      granted,
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}
