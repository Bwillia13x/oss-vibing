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

// Import repositories at module level for better performance
let userRepositoryModule: typeof import('@/lib/db/repositories') | null = null;

// Lazy load repository on first use
async function getUserRepository() {
  if (!userRepositoryModule) {
    try {
      userRepositoryModule = await import('@/lib/db/repositories');
    } catch (error) {
      console.warn('Database repository not available:', error);
    }
  }
  return userRepositoryModule;
}

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

    // Create or update user in database
    // Check if database repository is available
    let userId: string;
    let userRole: 'USER' | 'ADMIN' | 'INSTRUCTOR';
    
    try {
      const repositories = await getUserRepository();
      
      if (repositories) {
        // Try to find existing user
        const existingUser = await repositories.userRepository.findByEmail(userInfo.email);
        
        if (existingUser) {
          // Update existing user
          const updatedUser = await repositories.userRepository.update(existingUser.id, {
            name: userInfo.name || existingUser.name,
          });
          userId = updatedUser.id;
          userRole = updatedUser.role;
        } else {
          // Create new user
          const newUser = await repositories.userRepository.create({
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split('@')[0],
            role: 'USER',
          });
          userId = newUser.id;
          userRole = newUser.role;
        }
      } else {
        throw new Error('Repository not available');
      }
    } catch (error) {
      // If database is not available, use Google ID as fallback
      console.warn('Database not available, using Google ID:', error);
      userId = userInfo.id;
      userRole = 'USER';
    }

    // Create access and refresh tokens
    const accessToken = await createAccessToken({
      userId,
      email: userInfo.email,
      role: userRole,
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
