/**
 * Google OAuth Login Route
 * 
 * Initiates Google OAuth flow
 */

import { NextResponse } from 'next/server';
import { generateGoogleAuthUrl } from '@/lib/auth';
import { setCached, generateCacheKey, DEFAULT_TTL } from '@/lib/cache';

export async function GET() {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomUUID();

    // Store state in cache for verification (5 minutes)
    // NOTE: This uses cache storage which may not be reliable if Redis is unavailable
    // and server restarts between auth initiation and callback. For production,
    // consider using HTTP-only cookies or database storage for OAuth state.
    // Example with cookies:
    // response.cookies.set('oauth_state', state, {
    //   httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300
    // });
    const stateKey = generateCacheKey('oauth_state', state);
    await setCached(stateKey, { created: Date.now() }, DEFAULT_TTL.SHORT);

    // Generate Google OAuth URL
    const authUrl = await generateGoogleAuthUrl(state);

    if (!authUrl) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
