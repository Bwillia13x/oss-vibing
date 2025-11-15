/**
 * Monitoring Library
 * 
 * Provides unified interface for error tracking, performance monitoring,
 * and analytics across the application.
 * 
 * Features:
 * - Error tracking and reporting
 * - Performance metrics collection
 * - Custom event tracking
 * - User context management
 * - API error monitoring
 * 
 * @module lib/monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * Error category for classification
 */
export type ErrorCategory =
  | 'API_ERROR'
  | 'DB_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'USER_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NETWORK_ERROR'
  | 'CITATION_ERROR'
  | 'EXPORT_ERROR'
  | 'STATISTICS_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error context for additional information
 */
export interface ErrorContext {
  category: ErrorCategory;
  endpoint?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

/**
 * Performance metric types
 */
export type MetricType =
  | 'tool.execution'
  | 'api.request'
  | 'api.citation'
  | 'export.pdf'
  | 'export.docx'
  | 'export.pptx'
  | 'export.xlsx'
  | 'statistics.calculation'
  | 'page.load'
  | 'component.render';

/**
 * Metric data structure
 */
export interface MetricData {
  duration?: number;
  success?: boolean;
  size?: number;
  cached?: boolean;
  provider?: string;
  [key: string]: any;
}

/**
 * User context for error tracking
 */
export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}

/**
 * Log an error to Sentry with context
 * 
 * @param error - Error object or message
 * @param context - Additional context about the error
 * @param severity - Error severity level
 * 
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   logError(error, {
 *     category: 'API_ERROR',
 *     endpoint: '/api/data',
 *     userId: user.id,
 *   }, 'error');
 * }
 * ```
 */
export function logError(
  error: Error | string,
  context: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  // Only log in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Prepare error for Sentry
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  // Set error context
  Sentry.withScope((scope) => {
    scope.setLevel(severity);
    scope.setTag('category', context.category);
    
    if (context.endpoint) {
      scope.setTag('endpoint', context.endpoint);
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.action) {
      scope.setTag('action', context.action);
    }
    
    if (context.metadata) {
      scope.setContext('metadata', context.metadata);
    }

    // Capture the error
    Sentry.captureException(errorObj);
  });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context.category}]`, errorObj, context);
  }
}

/**
 * Track a performance metric
 * 
 * @param metricType - Type of metric being tracked
 * @param data - Metric data (duration, success, etc.)
 * 
 * @example
 * ```typescript
 * const startTime = Date.now();
 * try {
 *   const result = await exportToPDF(content, filename);
 *   trackMetric('export.pdf', {
 *     duration: Date.now() - startTime,
 *     success: true,
 *     size: result.size,
 *   });
 * } catch (error) {
 *   trackMetric('export.pdf', {
 *     duration: Date.now() - startTime,
 *     success: false,
 *   });
 * }
 * ```
 */
export function trackMetric(metricType: MetricType, data: MetricData): void {
  // Only track in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Use newer Sentry API for metrics
  Sentry.withScope((scope) => {
    // Add metric data as tags
    if (data.duration !== undefined) {
      scope.setTag('duration_ms', data.duration);
    }
    
    if (data.success !== undefined) {
      scope.setTag('success', String(data.success));
    }
    
    if (data.provider) {
      scope.setTag('provider', data.provider);
    }
    
    if (data.cached !== undefined) {
      scope.setTag('cached', String(data.cached));
    }

    // Add all data as context
    scope.setContext('metric_data', data);

    // Capture as breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'metric',
      message: metricType,
      data,
      level: 'info',
    });
  });

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[METRIC] ${metricType}`, data);
  }
}

/**
 * Track API request performance
 * 
 * @param endpoint - API endpoint being called
 * @param method - HTTP method
 * @param duration - Request duration in ms
 * @param status - HTTP status code
 * @param cached - Whether response was cached
 */
export function trackAPIRequest(
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  cached: boolean = false
): void {
  trackMetric('api.request', {
    endpoint,
    method,
    duration,
    status,
    cached,
    success: status >= 200 && status < 300,
  });
}

/**
 * Track tool execution performance
 * 
 * @param toolName - Name of the tool executed
 * @param duration - Execution duration in ms
 * @param success - Whether execution succeeded
 * @param metadata - Additional tool-specific data
 */
export function trackToolExecution(
  toolName: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  trackMetric('tool.execution', {
    toolName,
    duration,
    success,
    ...metadata,
  });
}

/**
 * Set user context for error tracking
 * 
 * @param user - User information
 * 
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   username: user.name,
 *   role: 'student',
 * });
 * ```
 */
export function setUserContext(user: UserContext | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    
    if (user.role) {
      Sentry.setTag('user_role', user.role);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param level - Severity level
 * @param data - Additional data
 * 
 * @example
 * ```typescript
 * addBreadcrumb('User clicked export button', 'user', 'info', {
 *   format: 'pdf',
 *   documentId: doc.id,
 * });
 * ```
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: ErrorSeverity = 'info',
  data?: Record<string, any>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture a message (non-error event)
 * 
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 * 
 * @example
 * ```typescript
 * captureMessage('User completed onboarding', 'info', {
 *   userId: user.id,
 *   steps: 5,
 * });
 * ```
 */
export function captureMessage(
  message: string,
  level: ErrorSeverity = 'info',
  context?: Record<string, any>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    if (context) {
      scope.setContext('message_context', context);
    }

    Sentry.captureMessage(message);
  });
}

/**
 * Start a performance span for detailed timing
 * 
 * @param name - Span name
 * @param op - Operation type
 * @returns Span object to finish later
 * 
 * @example
 * ```typescript
 * const span = startSpan('database-query', 'db');
 * try {
 *   await db.query(...);
 *   span.finish();
 * } catch (error) {
 *   span.finish();
 *   throw error;
 * }
 * ```
 */
export function startSpan(name: string, op: string) {
  if (typeof window === 'undefined') {
    return {
      finish: () => {},
      setTag: () => {},
      setData: () => {},
    };
  }

  // Use breadcrumbs for span tracking in newer Sentry API
  const startTime = Date.now();
  
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      Sentry.addBreadcrumb({
        category: op,
        message: name,
        data: { duration_ms: duration },
        level: 'info',
      });
    },
    setTag: (_key: string, _value: string) => {
      // Tags are not supported on breadcrumbs
    },
    setData: (_key: string, _value: any) => {
      // Data is not supported on breadcrumbs
    },
  };
}

/**
 * Monitor async function execution
 * 
 * @param name - Function name for tracking
 * @param fn - Async function to monitor
 * @returns Monitored function result
 * 
 * @example
 * ```typescript
 * const result = await monitorAsync('fetchUserData', async () => {
 *   return await api.getUser(userId);
 * });
 * ```
 */
export async function monitorAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const span = startSpan(name, 'function');
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    span.finish();
    
    // Log success metric
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name} completed`,
      data: { duration_ms: duration, success: true },
      level: 'info',
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    span.finish();
    
    // Log failure metric
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name} failed`,
      data: { duration_ms: duration, success: false },
      level: 'error',
    });
    
    throw error;
  }
}

/**
 * Initialize monitoring system
 * Should be called once at app startup
 */
export function initMonitoring(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Set app version
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
  Sentry.setTag('app_version', version);

  // Set deployment environment
  const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
  Sentry.setTag('environment', environment);

  console.log('[Monitoring] Initialized', { version, environment });
}

// Export Sentry for direct access if needed
export { Sentry };
