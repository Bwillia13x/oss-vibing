/**
 * Account Recovery Service
 * 
 * Handles password reset and account recovery workflows
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('JWT_SECRET not set, using development default (DO NOT USE IN PRODUCTION)');
}

const secret = new TextEncoder().encode(JWT_SECRET || 'development-secret-change-in-production');
const RECOVERY_TOKEN_EXPIRY = '1h'; // 1 hour

export interface RecoveryTokenPayload {
  userId: string;
  email: string;
  type: 'recovery';
}

/**
 * Generate a password recovery token
 */
export async function generateRecoveryToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email, type: 'recovery' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(RECOVERY_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify recovery token
 */
export async function verifyRecoveryToken(token: string): Promise<RecoveryTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const recoveryPayload = payload as unknown as RecoveryTokenPayload;

    if (recoveryPayload.type !== 'recovery') {
      return null;
    }

    return recoveryPayload;
  } catch (error) {
    console.error('Recovery token verification failed:', error);
    return null;
  }
}

/**
 * Send recovery email (placeholder - integrate with email service)
 */
export async function sendRecoveryEmail(email: string, token: string): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  const recoveryUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  console.log('='.repeat(80));
  console.log('PASSWORD RECOVERY EMAIL');
  console.log('='.repeat(80));
  console.log(`To: ${email}`);
  console.log(`Recovery URL: ${recoveryUrl}`);
  console.log('='.repeat(80));

  // In production, send actual email here
  // Example with SendGrid:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@vibeuniversity.edu',
  //   subject: 'Password Recovery',
  //   html: `Click here to reset your password: ${recoveryUrl}`
  // });

  return true;
}

/**
 * Store recovery attempt (for rate limiting)
 * 
 * WARNING: This uses in-memory storage and will NOT work correctly in 
 * distributed/multi-instance deployments. In production, use Redis or 
 * database to store rate limit data.
 * 
 * Example with Redis:
 * const key = `recovery:${email}`;
 * const count = await redis.incr(key);
 * if (count === 1) await redis.expire(key, 3600);
 * if (count > 3) return { allowed: false, reason: '...' };
 */
const recoveryAttempts = new Map<string, { count: number; lastAttempt: number }>();

/**
 * Check if recovery request is allowed (rate limiting)
 */
export function isRecoveryAllowed(email: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const attempt = recoveryAttempts.get(email);

  if (!attempt) {
    recoveryAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Allow 3 attempts per hour
  const hourAgo = now - 60 * 60 * 1000;
  if (attempt.lastAttempt < hourAgo) {
    recoveryAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (attempt.count >= 3) {
    return { allowed: false, reason: 'Too many recovery attempts. Please try again later.' };
  }

  recoveryAttempts.set(email, { count: attempt.count + 1, lastAttempt: now });
  return { allowed: true };
}

/**
 * Clean up old recovery attempts (call periodically)
 */
export function cleanupRecoveryAttempts(): void {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  for (const [email, attempt] of recoveryAttempts.entries()) {
    if (attempt.lastAttempt < hourAgo) {
      recoveryAttempts.delete(email);
    }
  }
}

// Cleanup interval management
let cleanupInterval: NodeJS.Timeout | null = null;

// Clean up every 15 minutes
if (typeof setInterval !== 'undefined' && !cleanupInterval) {
  cleanupInterval = setInterval(cleanupRecoveryAttempts, 15 * 60 * 1000);
}
