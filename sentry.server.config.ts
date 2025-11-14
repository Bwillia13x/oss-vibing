/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for server-side error tracking and performance monitoring.
 * Server-side monitoring captures API errors, database issues, and server crashes.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'dev';

Sentry.init({
  // Data Source Name - unique identifier for your Sentry project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Release version for tracking
  release: SENTRY_RELEASE,

  // Sample rate for error events (1.0 = 100% of errors)
  sampleRate: 1.0,

  // Performance Monitoring - Sample rate for transactions
  // Lower in production to reduce overhead
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Configure error filtering
  beforeSend(event, _hint) {
    // Don't send events in development by default
    if (SENTRY_ENVIRONMENT === 'development' && !SENTRY_DSN) {
      return null;
    }

    // Add server context
    if (event.contexts) {
      event.contexts.runtime = {
        name: 'node',
        version: process.version,
      };
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Expected API errors
    'NotFound',
    'Unauthorized',
    'Forbidden',
    
    // Rate limiting
    'TooManyRequests',
    
    // External API timeouts (not our fault)
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
  ],
});

// Export for use in API routes
export { Sentry };
