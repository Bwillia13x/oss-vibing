/**
 * Google OAuth Callback Route
 * 
 * Handles Google OAuth callback and creates user session
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateGoogleAuthCode,
  getGoogleUserInfo,
  validateEduEmail,
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from '@/lib/auth';
import { getCached, deleteCached, generateCacheKey } from '@/lib/cache';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/auth/error?message=Invalid callback parameters', req.url)
      );
    }

    // Verify state (CSRF protection)
    const stateKey = generateCacheKey('oauth_state', state);
    const storedState = await getCached(stateKey);
    if (!storedState) {
      return NextResponse.redirect(
        new URL('/auth/error?message=Invalid or expired state', req.url)
      );
    }

    // Clean up state
    await deleteCached(stateKey);

    // Validate authorization code and get tokens
    const tokens = await validateGoogleAuthCode(code);
    if (!tokens) {
      return NextResponse.redirect(
        new URL('/auth/error?message=Failed to validate authorization code', req.url)
      );
    }

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.accessToken);
    if (!userInfo) {
      return NextResponse.redirect(
        new URL('/auth/error?message=Failed to fetch user information', req.url)
      );
    }

    // Validate .edu email
    const emailValidation = validateEduEmail(userInfo.email);
    if (!emailValidation.valid) {
      return NextResponse.redirect(
        new URL(`/auth/error?message=${encodeURIComponent(emailValidation.reason || 'Invalid email')}`, req.url)
      );
    }

    // TODO: Create or update user in database
    // IMPORTANT: This is a placeholder implementation for development.
    // In production, you MUST implement proper user lookup/creation:
    //
    // let user = await prisma.user.findUnique({ where: { email: userInfo.email } });
    // if (!user) {
    //   user = await prisma.user.create({
    //     data: {
    //       email: userInfo.email,
    //       name: userInfo.name,
    //       role: 'USER',
    //       status: 'ACTIVE',
    //     },
    //   });
    // }
    // const userId = user.id; // Use database ID, not Google ID
    //
    // For now, we'll create tokens with the Google user info
    const userId = userInfo.id; // WARNING: Using Google ID - replace with database user ID in production

    // Create access and refresh tokens
    const accessToken = await createAccessToken({
      userId,
      email: userInfo.email,
      role: 'USER', // Default role, should come from database
    });

    const refreshToken = await createRefreshToken({
      userId,
      email: userInfo.email,
      role: 'USER',
    });

    // Set auth cookies
    await setAuthCookies(accessToken, refreshToken);

    // Redirect to home page
    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/auth/error?message=Authentication failed', req.url)
    );
  }
}
