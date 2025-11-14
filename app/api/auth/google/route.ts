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
