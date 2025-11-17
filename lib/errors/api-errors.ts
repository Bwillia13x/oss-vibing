/**
 * Custom API Error Classes
 * 
 * Standardized error types for consistent error handling across API routes
 */

/**
 * Base API Error
 */
export class ApiError extends Error {
  statusCode: number
  
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404)
  }
}

/**
 * Validation Error (400)
 * Used when input validation fails
 */
export class ValidationError extends ApiError {
  details: Record<string, string[]>
  
  constructor(message: string, details: Record<string, string[]>) {
    super(message, 400)
    this.details = details
  }
}

/**
 * Conflict Error (409)
 * Used when a resource already exists or conflicts with current state
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409)
  }
}

/**
 * Authorization Error (403)
 * Used when user is authenticated but not authorized to perform an action
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message, 403)
  }
}

/**
 * Authentication Error (401)
 * Used when user is not authenticated
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

/**
 * Bad Request Error (400)
 * Used for general client errors
 */
export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400)
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429)
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 500)
  }
}

/**
 * Helper function to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Helper function to format error response
 */
export function formatErrorResponse(error: unknown): {
  error: string
  details?: Record<string, string[]>
  statusCode: number
} {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: error.statusCode,
    }
  }
  
  if (isApiError(error)) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    }
  }
  
  // Unknown error
  return {
    error: 'Internal server error',
    statusCode: 500,
  }
}
