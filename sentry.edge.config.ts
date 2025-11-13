/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for Edge Runtime (Vercel Edge Functions, Middleware).
 * Edge runtime has some limitations, so configuration is minimal.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'dev';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: SENTRY_RELEASE,
  
  // Lower sample rates for edge runtime
  sampleRate: 1.0,
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 0.5,

  // Minimal configuration for edge runtime
  beforeSend(event) {
    if (SENTRY_ENVIRONMENT === 'development' && !SENTRY_DSN) {
      return null;
    }
    return event;
  },
});

export { Sentry };
