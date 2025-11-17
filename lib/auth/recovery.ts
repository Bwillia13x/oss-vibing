/**
 * Account Recovery Service
 * 
 * Handles password reset and account recovery workflows
 */

import { SignJWT, jwtVerify } from 'jose';

// Lazy evaluation to avoid build-time errors
const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    console.warn('JWT_SECRET not set, using development default (DO NOT USE IN PRODUCTION)');
  }
  
  return JWT_SECRET || 'development-secret-change-in-production';
};

const getSecret = () => new TextEncoder().encode(getJWTSecret());
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
    .sign(getSecret());

  return token;
}

/**
 * Verify recovery token
 */
export async function verifyRecoveryToken(token: string): Promise<RecoveryTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
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
 * Send recovery email
 * Supports SendGrid and AWS SES with fallback to console logging
 */
export async function sendRecoveryEmail(email: string, token: string): Promise<boolean> {
  const recoveryUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  
  const emailContent = {
    to: email,
    subject: 'Password Recovery - Vibe University',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Recovery Request</h2>
        <p>You requested to reset your password for Vibe University.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${recoveryUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${recoveryUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `Password Recovery\n\nYou requested to reset your password for Vibe University.\n\nClick here to reset your password: ${recoveryUrl}\n\nThis link will expire in 1 hour.`
  };

  // Try SendGrid if configured
  if (process.env.SENDGRID_API_KEY) {
    return await sendWithSendGrid(emailContent);
  }
  
  // Try AWS SES if configured
  if (process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY) {
    return await sendWithAwsSes(emailContent);
  }
  
  // Fallback to console logging for development
  console.log('='.repeat(80));
  console.log('PASSWORD RECOVERY EMAIL (No email service configured)');
  console.log('='.repeat(80));
  console.log(`To: ${email}`);
  console.log(`Subject: ${emailContent.subject}`);
  console.log(`Recovery URL: ${recoveryUrl}`);
  console.log('='.repeat(80));
  console.log('\nTo enable email sending, configure one of:');
  console.log('- SENDGRID_API_KEY (SendGrid)');
  console.log('- AWS_SES_ACCESS_KEY_ID + AWS_SES_SECRET_ACCESS_KEY (AWS SES)');
  console.log('='.repeat(80));

  return true;
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(emailContent: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: emailContent.to }],
        }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@vibeuniversity.edu',
          name: 'Vibe University',
        },
        subject: emailContent.subject,
        content: [
          {
            type: 'text/plain',
            value: emailContent.text,
          },
          {
            type: 'text/html',
            value: emailContent.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    console.log(`Email sent successfully via SendGrid to: ${emailContent.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email failed:', error);
    return false;
  }
}

/**
 * Send email using AWS SES
 */
async function sendWithAwsSes(emailContent: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    // Note: This is a simplified implementation
    // In production, use AWS SDK v3: @aws-sdk/client-ses
    const region = process.env.AWS_SES_REGION || 'us-east-1';
    const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@vibeuniversity.edu';
    
    // For now, log that SES is configured but not fully implemented
    console.log('AWS SES is configured but requires @aws-sdk/client-ses package');
    console.log('Install with: npm install @aws-sdk/client-ses');
    console.log(`Would send email to: ${emailContent.to} from: ${fromEmail} in region: ${region}`);
    
    // Return false to trigger fallback
    return false;
  } catch (error) {
    console.error('AWS SES email failed:', error);
    return false;
  }
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
