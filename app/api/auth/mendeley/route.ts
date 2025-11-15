/**
 * Mendeley OAuth 2.0 Route
 * 
 * Handles OAuth flow for Mendeley integration.
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
    console.error('Mendeley OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=mendeley_auth_failed`
    );
  }

  // Initiate OAuth flow
  if (!code) {
    // Generate state for CSRF protection
    const stateValue = generateRandomState();
    
    // Store state in a cookie
    cookies().set('mendeley_oauth_state', stateValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    const authUrl = new URL('https://api.mendeley.com/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.MENDELEY_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_URL}/api/auth/mendeley`);
    authUrl.searchParams.set('scope', 'all');
    authUrl.searchParams.set('state', stateValue);

    return NextResponse.redirect(authUrl.toString());
  }

  try {
    // Validate state (CSRF protection)
    const storedState = cookies().get('mendeley_oauth_state')?.value;

    if (!storedState || storedState !== state) {
      console.error('CSRF: State mismatch');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=csrf_detected`
      );
    }

    // Clear the state cookie after validation
    cookies().delete('mendeley_oauth_state');
    
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
    const { access_token } = tokenData;

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
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/settings/integrations?error=unauthorized`
      );
    }

    // Store integration in database
    console.log('Mendeley integration successful:', {
      userId: user.id,
      mendeleyUserId,
      displayName: display_name,
    });

    // In production, save to database:
    // await prisma.integration.upsert({
    //   where: {
    //     userId_provider: {
    //       userId: user.id,
    //       provider: 'mendeley',
    //     },
    //   },
    //   create: {
    //     userId: user.id,
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
  return randomBytes(32).toString('hex');
}
