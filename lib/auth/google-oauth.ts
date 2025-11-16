/**
 * Google OAuth Service
 * 
 * Handles Google OAuth authentication for .edu accounts
 * Uses Arctic library for OAuth 2.0 flow
 */

import { Google } from 'arctic';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

// Initialize Google OAuth client
let googleClient: Google | null = null;

/**
 * Get Google OAuth client
 */
export function getGoogleClient(): Google | null {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    return null;
  }

  if (!googleClient) {
    googleClient = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  }

  return googleClient;
}

/**
 * Generate Google OAuth authorization URL
 */
export async function generateGoogleAuthUrl(state: string, codeVerifier: string): Promise<string | null> {
  const client = getGoogleClient();
  if (!client) return null;

  const url = client.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email',
  ]);

  return url.toString();
}

/**
 * Validate authorization code and get tokens
 */
export async function validateGoogleAuthCode(code: string, codeVerifier: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
} | null> {
  const client = getGoogleClient();
  if (!client) return null;

  try {
    const tokens = await client.validateAuthorizationCode(code, codeVerifier);
    return {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken(),
      idToken: tokens.idToken(),
    };
  } catch (error) {
    console.error('Error validating Google auth code:', error);
    return null;
  }
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
} | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Google user info:', response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified_email: data.verified_email,
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
}

/**
 * Check if email is from an educational institution (.edu domain)
 */
export function isEduEmail(email: string): boolean {
  return email.toLowerCase().endsWith('.edu');
}

/**
 * Validate .edu email for institutional access
 */
export function validateEduEmail(email: string): {
  valid: boolean;
  reason?: string;
} {
  if (!email) {
    return { valid: false, reason: 'Email is required' };
  }

  if (!isEduEmail(email)) {
    return { valid: false, reason: 'Only .edu email addresses are allowed' };
  }

  // Additional validation could be added here
  // e.g., check against list of approved institutions

  return { valid: true };
}
