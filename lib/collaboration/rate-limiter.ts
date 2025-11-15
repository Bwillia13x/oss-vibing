/**
 * Rate Limiting for WebSocket Connections
 * 
 * Prevents abuse by limiting the number of actions a user can perform.
 * Implements per-user rate limiting for WebSocket messages.
 * 
 * Critical for Production - Week 1-2
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter for WebSocket connections (per user)
const connectionRateLimiter = new RateLimiterMemory({
  points: 10, // 10 connections
  duration: 60, // Per 60 seconds (1 minute)
});

// Rate limiter for WebSocket messages (per user)
const messageRateLimiter = new RateLimiterMemory({
  points: 100, // 100 messages
  duration: 60, // Per 60 seconds (1 minute)
});

// Rate limiter for document updates (per user)
const updateRateLimiter = new RateLimiterMemory({
  points: 50, // 50 updates
  duration: 10, // Per 10 seconds
});

/**
 * Check if user can establish a new WebSocket connection
 */
export async function checkConnectionRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  try {
    const result = await connectionRateLimiter.consume(userId);
    
    return {
      allowed: true,
      remaining: result.remainingPoints,
      resetAt: new Date(Date.now() + result.msBeforeNext),
    };
  } catch (error: any) {
    if (error.remainingPoints !== undefined) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + error.msBeforeNext),
      };
    }
    
    console.error('Rate limit check error:', error);
    return {
      allowed: true, // Allow on error to avoid blocking legitimate users
      remaining: 0,
      resetAt: new Date(),
    };
  }
}

/**
 * Check if user can send a WebSocket message
 */
export async function checkMessageRateLimit(userId: string): Promise<boolean> {
  try {
    await messageRateLimiter.consume(userId);
    return true;
  } catch (error) {
    console.warn(`Message rate limit exceeded for user ${userId}`);
    return false;
  }
}

/**
 * Check if user can send a document update
 */
export async function checkUpdateRateLimit(userId: string): Promise<boolean> {
  try {
    await updateRateLimiter.consume(userId);
    return true;
  } catch (error) {
    console.warn(`Update rate limit exceeded for user ${userId}`);
    return false;
  }
}

/**
 * Get remaining points for a user
 */
export async function getRateLimitStatus(userId: string): Promise<{
  connections: number;
  messages: number;
  updates: number;
}> {
  try {
    const [conn, msg, upd] = await Promise.all([
      connectionRateLimiter.get(userId),
      messageRateLimiter.get(userId),
      updateRateLimiter.get(userId),
    ]);

    return {
      connections: conn?.remainingPoints ?? 10,
      messages: msg?.remainingPoints ?? 100,
      updates: upd?.remainingPoints ?? 50,
    };
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return {
      connections: 0,
      messages: 0,
      updates: 0,
    };
  }
}

/**
 * Reset rate limits for a user (admin function)
 */
export async function resetRateLimits(userId: string): Promise<void> {
  try {
    await Promise.all([
      connectionRateLimiter.delete(userId),
      messageRateLimiter.delete(userId),
      updateRateLimiter.delete(userId),
    ]);
    
    console.log(`Rate limits reset for user ${userId}`);
  } catch (error) {
    console.error('Error resetting rate limits:', error);
  }
}
