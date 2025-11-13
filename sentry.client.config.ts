/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for client-side error tracking and performance monitoring.
 * Sentry helps catch, triage, and prioritize errors in production.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'dev';

Sentry.init({
  // Data Source Name - unique identifier for your Sentry project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Release version for tracking
  release: SENTRY_RELEASE,

  // Sample rate for error events (1.0 = 100% of errors)
  // In production, you might want to sample to reduce volume
  sampleRate: SENTRY_ENVIRONMENT === 'production' ? 1.0 : 1.0,

  // Performance Monitoring - Sample rate for transactions
  // Set to 0.1 (10%) in production to reduce overhead
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Replay session sampling
  // This sets the sample rate at 10% for sessions without errors
  // and 100% for sessions with errors
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Configure error filtering
  beforeSend(event, hint) {
    // Don't send events in development by default
    if (SENTRY_ENVIRONMENT === 'development' && !SENTRY_DSN) {
      return null;
    }

    // Filter out known browser extension errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        // Ignore Chrome extension errors
        if (message.includes('chrome-extension://')) {
          return null;
        }
        // Ignore Safari extension errors
        if (message.includes('safari-extension://')) {
          return null;
        }
      }
    }

    return event;
  },

  // Configure breadcrumbs (trail of events leading to error)
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
      return null;
    }
    return breadcrumb;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser navigation errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    
    // Network errors (user offline, CORS, etc.)
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    
    // User-cancelled requests
    'AbortError',
    'The user aborted a request',
    
    // Browser extension conflicts
    'Non-Error promise rejection captured',
    
    // Development hot reload
    'HMR',
    'Fast Refresh',
  ],
});

// Export for use in error boundaries
export { Sentry };
