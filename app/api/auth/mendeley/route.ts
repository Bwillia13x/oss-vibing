/**
 * Mendeley OAuth 2.0 Route
 * 
 * Handles OAuth flow for Mendeley integration.
 * Week 2-3: OAuth Flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('Mendeley OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=mendeley_auth_failed`
    );
  }

  // Initiate OAuth flow
  if (!code) {
    // Generate state for CSRF protection
    const stateValue = generateRandomState();
    
    const authUrl = new URL('https://api.mendeley.com/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.MENDELEY_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_URL}/api/auth/mendeley`);
    authUrl.searchParams.set('scope', 'all');
    authUrl.searchParams.set('state', stateValue);

    return NextResponse.redirect(authUrl.toString());
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mendeley.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.MENDELEY_CLIENT_ID}:${process.env.MENDELEY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/mendeley`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Mendeley token exchange failed:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user profile from Mendeley
    const profileResponse = await fetch('https://api.mendeley.com/profiles/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    const { id: mendeleyUserId, display_name } = profile;

    // Get current user from session
    const currentUserId = 'current-user-id'; // TODO: Get from session

    // Store integration in database
    console.log('Mendeley integration successful:', {
      userId: currentUserId,
      mendeleyUserId,
      displayName: display_name,
    });

    // In production, save to database:
    // await prisma.integration.upsert({
    //   where: {
    //     userId_provider: {
    //       userId: currentUserId,
    //       provider: 'mendeley',
    //     },
    //   },
    //   create: {
    //     userId: currentUserId,
    //     provider: 'mendeley',
    //     accessToken: access_token,
    //     refreshToken: refresh_token,
    //     externalUserId: mendeleyUserId,
    //     expiresAt: new Date(Date.now() + expires_in * 1000),
    //     metadata: { display_name },
    //   },
    //   update: {
    //     accessToken: access_token,
    //     refreshToken: refresh_token,
    //     externalUserId: mendeleyUserId,
    //     expiresAt: new Date(Date.now() + expires_in * 1000),
    //     metadata: { display_name },
    //   },
    // });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?success=mendeley`
    );
  } catch (error) {
    console.error('Mendeley OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=mendeley_connection_failed`
    );
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
