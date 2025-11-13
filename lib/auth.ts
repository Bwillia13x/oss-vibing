/**
 * Authentication and Authorization Middleware
 * Provides JWT-based authentication and role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

export type UserRole = 'student' | 'instructor' | 'admin' | 'institution-admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  institutionId?: string
  name?: string
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser
}

// JWT secret key (in production, this should be an environment variable)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vibe-university-secret-key-change-in-production'
)

/**
 * Create a JWT token for a user
 */
export async function createToken(user: AuthUser, expiresIn: string = '7d'): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.user as AuthUser
  } catch (error) {
    return null
  }
}

/**
 * Extract user from request headers
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  return await verifyToken(token)
}

/**
 * Authentication middleware - ensures user is authenticated
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getUserFromRequest(req)

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please provide a valid token.' },
      { status: 401 }
    )
  }

  return user
}

/**
 * Role-based authorization middleware
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(req)

  // If requireAuth returned an error response, pass it through
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const user = authResult as AuthUser

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { 
        error: 'Insufficient permissions. This action requires one of the following roles: ' + allowedRoles.join(', '),
        requiredRoles: allowedRoles,
        userRole: user.role
      },
      { status: 403 }
    )
  }

  return user
}

/**
 * Institution-specific authorization
 * Ensures user has access to the specified institution
 */
export async function requireInstitutionAccess(
  req: NextRequest,
  institutionId: string,
  allowedRoles: UserRole[]
): Promise<AuthUser | NextResponse> {
  const authResult = await requireRole(req, allowedRoles)

  // If requireRole returned an error response, pass it through
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const user = authResult as AuthUser

  // Institution admins and global admins can access any institution
  if (user.role === 'admin') {
    return user
  }

  // Institution-specific admins and instructors must match the institution
  if (user.institutionId !== institutionId) {
    return NextResponse.json(
      { 
        error: 'Access denied. You do not have permission to access this institution.',
        requestedInstitution: institutionId,
        userInstitution: user.institutionId
      },
      { status: 403 }
    )
  }

  return user
}

/**
 * Helper to check if user is admin or institution-admin
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'institution-admin'
}

/**
 * Helper to check if user is instructor
 */
export function isInstructor(user: AuthUser): boolean {
  return user.role === 'instructor' || isAdmin(user)
}

/**
 * Mock authentication for development/testing
 * In production, this would integrate with OAuth providers
 */
export async function mockAuthenticate(email: string, role: UserRole, institutionId?: string): Promise<string> {
  const user: AuthUser = {
    id: `user-${Date.now()}`,
    email,
    role,
    institutionId,
    name: email.split('@')[0]
  }

  return await createToken(user)
}
