/**
 * Authentication Middleware
 * 
 * Provides middleware functions for protecting routes and checking permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, refreshAccessToken } from './jwt-service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    // Try to get user from access token
    let user = await getCurrentUser();

    // If no valid access token, try to refresh
    if (!user) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        user = await getCurrentUser();
      }
    }

    // If still no user, return 401
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Attach user to request
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    // Call the handler
    return handler(authReq);
  };
}

/**
 * Middleware to require specific role(s)
 */
export async function requireRole(
  roles: string | string[],
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    // First check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check role
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Attach user to request
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    // Call the handler
    return handler(authReq);
  };
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return requireRole('ADMIN', handler);
}

/**
 * Middleware to require instructor or admin role
 */
export async function requireInstructor(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return requireRole(['ADMIN', 'INSTRUCTOR'], handler);
}

/**
 * Get user from request (returns null if not authenticated)
 */
export async function getUser(req: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };
}
