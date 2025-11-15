/**
 * Zotero OAuth 2.0 Route
 * 
 * Handles OAuth flow for Zotero integration.
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
    console.error('Zotero OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=zotero_auth_failed`
    );
  }

  // Initiate OAuth flow
  if (!code) {
    // Generate state for CSRF protection
    const stateValue = generateRandomState();
    
    // Store state in session/database (simplified here)
    // In production, use a proper session store
    
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
    // In production, verify state matches what was sent
    
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
    const { access_token, userID, username } = tokenData;

    // Get current user from session
    // In production, use proper session management
    const currentUserId = 'current-user-id'; // TODO: Get from session

    // Store integration in database
    // Note: This requires an Integration model in Prisma schema
    // For now, we'll log it
    console.log('Zotero integration successful:', {
      userId: currentUserId,
      zoteroUserId: userID,
      zoteroUsername: username,
    });

    // In production, save to database:
    // await prisma.integration.upsert({
    //   where: {
    //     userId_provider: {
    //       userId: currentUserId,
    //       provider: 'zotero',
    //     },
    //   },
    //   create: {
    //     userId: currentUserId,
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
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
