/**
 * Zotero OAuth 2.0 Route
 * 
 * Handles OAuth flow for Zotero integration.
 * Week 2-3: OAuth Flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('Zotero OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=zotero_auth_failed`
    );
  }

  // Initiate OAuth flow
  if (!code) {
    // Generate state for CSRF protection
    const stateValue = generateRandomState();
    
    // Store state in a cookie
    cookies().set('zotero_oauth_state', stateValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    const authUrl = new URL('https://www.zotero.org/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.ZOTERO_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_URL}/api/auth/zotero`);
    authUrl.searchParams.set('scope', 'all');
    authUrl.searchParams.set('state', stateValue);

    return NextResponse.redirect(authUrl.toString());
  }

  try {
    // Validate state (CSRF protection)
    const storedState = cookies().get('zotero_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('CSRF: State mismatch');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=csrf_detected`
      );
    }

    // Clear the state cookie after validation
    cookies().delete('zotero_oauth_state');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.zotero.org/oauth/access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.ZOTERO_CLIENT_ID || '',
        client_secret: process.env.ZOTERO_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/zotero`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Zotero token exchange failed:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { userID, username } = tokenData;

    // Get current user from session
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=unauthorized`
      );
    }

    // Store integration in database
    // Note: This requires an Integration model in Prisma schema
    // For now, we'll log it
    console.log('Zotero integration successful:', {
      userId: user.id,
      zoteroUserId: userID,
      zoteroUsername: username,
    });

    // In production, save to database:
    // await prisma.integration.upsert({
    //   where: {
    //     userId_provider: {
    //       userId: user.id,
    //       provider: 'zotero',
    //     },
    //   },
    //   create: {
    //     userId: user.id,
    //     provider: 'zotero',
    //     accessToken: access_token,
    //     externalUserId: userID,
    //     metadata: { username },
    //   },
    //   update: {
    //     accessToken: access_token,
    //     externalUserId: userID,
    //     metadata: { username },
    //   },
    // });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?success=zotero`
    );
  } catch (error) {
    console.error('Zotero OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=zotero_connection_failed`
    );
  }
}

function generateRandomState(): string {
  return randomBytes(32).toString('hex');
}
