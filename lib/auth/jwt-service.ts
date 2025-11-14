/**
 * JWT Token Service
 * 
 * Handles JWT token creation, verification, and refresh token management
 * for secure session management.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Token configuration
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Create an access token
 */
export async function createAccessToken(payload: Omit<TokenPayload, 'type'>): Promise<string> {
  const token = await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Create a refresh token
 */
export async function createRefreshToken(payload: Omit<TokenPayload, 'type'>): Promise<string> {
  const token = await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Set authentication cookies
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();

  // Set access token cookie (shorter expiry)
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  // Set refresh token cookie (longer expiry)
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');
  return token?.value || null;
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('refresh_token');
  return token?.value || null;
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

/**
 * Get current user from access token
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAccessToken();
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const payload = await verifyToken(refreshToken);
  if (!payload || payload.type !== 'refresh') return null;

  // Create new access token
  const newAccessToken = await createAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  // Update access token cookie
  const cookieStore = await cookies();
  cookieStore.set('access_token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  return newAccessToken;
}
