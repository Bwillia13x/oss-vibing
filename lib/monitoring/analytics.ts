/**
 * Analytics Module
 * 
 * Provides privacy-focused usage analytics tracking for understanding
 * user behavior and feature adoption.
 * 
 * Features:
 * - Page view tracking
 * - Feature usage tracking
 * - User journey tracking
 * - Conversion funnel tracking
 * - Privacy-compliant (GDPR, FERPA)
 * 
 * @module lib/monitoring/analytics
 */

/**
 * Analytics event types
 */
export type AnalyticsEvent =
  // Page events
  | 'page_view'
  | 'page_exit'
  
  // User events
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  
  // Document events
  | 'document_create'
  | 'document_edit'
  | 'document_delete'
  | 'document_export'
  
  // Tool events
  | 'tool_use'
  | 'citation_add'
  | 'citation_verify'
  
  // Export events
  | 'export_pdf'
  | 'export_docx'
  | 'export_pptx'
  | 'export_xlsx'
  
  // Feature events
  | 'feature_discover'
  | 'feature_enable'
  | 'feature_disable'
  
  // Error events
  | 'error_occur'
  | 'error_recover';

/**
 * Analytics event properties
 */
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics configuration
 */
interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  respectDoNotTrack: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  respectDoNotTrack: true,
};

let config: AnalyticsConfig = { ...defaultConfig };

/**
 * Check if user has Do Not Track enabled
 */
function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const dnt = navigator.doNotTrack || (window as any).doNotTrack;
  return dnt === '1' || dnt === 'yes';
}

/**
 * Check if analytics should be tracked
 */
function shouldTrack(): boolean {
  if (!config.enabled) {
    return false;
  }

  if (config.respectDoNotTrack && isDoNotTrackEnabled()) {
    return false;
  }

  return true;
}

/**
 * Initialize analytics
 * 
 * @param options - Configuration options
 */
export function initAnalytics(options?: Partial<AnalyticsConfig>): void {
  config = {
    ...defaultConfig,
    ...options,
  };

  if (config.debug) {
    console.log('[Analytics] Initialized', config);
  }
}

/**
 * Track an analytics event
 * 
 * @param event - Event name
 * @param properties - Event properties
 * 
 * @example
 * ```typescript
 * trackEvent('document_create', {
 *   documentType: 'essay',
 *   template: 'apa',
 * });
 * ```
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  if (!shouldTrack()) {
    if (config.debug) {
      console.log('[Analytics] Event skipped (tracking disabled)', event, properties);
    }
    return;
  }

  // Log in debug mode
  if (config.debug) {
    console.log('[Analytics] Event', event, properties);
  }

  // In production, you would send to your analytics service
  // For now, we just use Vercel Analytics if available
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', event, properties);
  }

  // Store locally for dashboard
  storeEventLocally(event, properties);
}

/**
 * Track page view
 * 
 * @param path - Page path
 * @param title - Page title
 * @param properties - Additional properties
 */
export function trackPageView(
  path: string,
  title?: string,
  properties?: AnalyticsProperties
): void {
  trackEvent('page_view', {
    path,
    title,
    ...properties,
  });
}

/**
 * Track user action
 * 
 * @param action - Action name
 * @param properties - Action properties
 */
export function trackUserAction(
  action: string,
  properties?: AnalyticsProperties
): void {
  trackEvent('tool_use', {
    action,
    ...properties,
  });
}

/**
 * Track feature usage
 * 
 * @param feature - Feature name
 * @param action - Action performed
 * @param properties - Additional properties
 */
export function trackFeature(
  feature: string,
  action: 'discover' | 'enable' | 'disable' | 'use',
  properties?: AnalyticsProperties
): void {
  const eventMap = {
    discover: 'feature_discover' as const,
    enable: 'feature_enable' as const,
    disable: 'feature_disable' as const,
    use: 'tool_use' as const,
  };

  trackEvent(eventMap[action], {
    feature,
    ...properties,
  });
}

/**
 * Track conversion event
 * 
 * @param funnel - Funnel name
 * @param step - Step in funnel
 * @param properties - Additional properties
 */
export function trackConversion(
  funnel: string,
  step: string,
  properties?: AnalyticsProperties
): void {
  trackEvent('tool_use', {
    funnel,
    step,
    ...properties,
  });
}

/**
 * Track error occurrence
 * 
 * @param error - Error message or type
 * @param fatal - Whether error is fatal
 * @param properties - Additional properties
 */
export function trackError(
  error: string,
  fatal: boolean = false,
  properties?: AnalyticsProperties
): void {
  trackEvent('error_occur', {
    error,
    fatal,
    ...properties,
  });
}

/**
 * Store event locally for analytics dashboard
 * 
 * @param event - Event name
 * @param properties - Event properties
 */
function storeEventLocally(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get existing events
    const storageKey = 'vibe_analytics_events';
    const existing = localStorage.getItem(storageKey);
    const events = existing ? JSON.parse(existing) : [];

    // Add new event with timestamp
    events.push({
      event,
      properties,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 events
    const recentEvents = events.slice(-100);

    // Store back
    localStorage.setItem(storageKey, JSON.stringify(recentEvents));
  } catch (error) {
    // Ignore storage errors (quota, privacy mode, etc.)
    if (config.debug) {
      console.warn('[Analytics] Failed to store event locally', error);
    }
  }
}

/**
 * Get stored analytics events
 * 
 * @returns Array of stored events
 */
export function getStoredEvents(): Array<{
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
  timestamp: string;
}> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'vibe_analytics_events';
    const existing = localStorage.getItem(storageKey);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Clear stored analytics events
 */
export function clearStoredEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storageKey = 'vibe_analytics_events';
    localStorage.removeItem(storageKey);
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get analytics summary
 * 
 * @returns Summary of stored events
 */
export function getAnalyticsSummary(): {
  totalEvents: number;
  eventCounts: Record<string, number>;
  recentEvents: Array<any>;
} {
  const events = getStoredEvents();

  // Count events by type
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  });

  return {
    totalEvents: events.length,
    eventCounts,
    recentEvents: events.slice(-10),
  };
}

/**
 * Track time spent on page
 * Call this when user leaves the page
 * 
 * @param path - Page path
 * @param startTime - When user arrived (timestamp)
 */
export function trackTimeOnPage(path: string, startTime: number): void {
  const duration = Date.now() - startTime;
  
  trackEvent('page_exit', {
    path,
    duration_ms: duration,
    duration_seconds: Math.round(duration / 1000),
  });
}

/**
 * Higher-order function to track component usage
 * 
 * @param componentName - Name of component
 * @returns Tracking functions
 * 
 * @example
 * ```typescript
 * const { trackMount, trackAction } = useComponentTracking('ExportDialog');
 * 
 * useEffect(() => {
 *   trackMount();
 * }, []);
 * 
 * const handleExport = () => {
 *   trackAction('export', { format: 'pdf' });
 *   // ... export logic
 * };
 * ```
 */
export function useComponentTracking(componentName: string) {
  return {
    trackMount: (properties?: AnalyticsProperties) => {
      trackEvent('page_view', {
        component: componentName,
        ...properties,
      });
    },
    trackAction: (action: string, properties?: AnalyticsProperties) => {
      trackUserAction(action, {
        component: componentName,
        ...properties,
      });
    },
    trackError: (error: string, properties?: AnalyticsProperties) => {
      trackError(error, false, {
        component: componentName,
        ...properties,
      });
    },
  };
}

// Types are already exported above
