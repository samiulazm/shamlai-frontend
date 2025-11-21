/**
 * Standardized API error classes and error handling
 * Similar to Shopify's error structure
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/utils/logger';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.name;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden - User authenticated but not authorized
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate entry)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details, false);
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details, false);
  }
}

/**
 * Business logic errors
 */
export class InsufficientStockError extends ApiError {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for ${productName}`,
      400,
      'INSUFFICIENT_STOCK',
      { productName, available, requested }
    );
  }
}

export class InvalidDiscountCodeError extends ApiError {
  constructor(code: string) {
    super(`Invalid or expired discount code: ${code}`, 400, 'INVALID_DISCOUNT_CODE', { code });
  }
}

export class PaymentFailedError extends ApiError {
  constructor(reason: string) {
    super(`Payment failed: ${reason}`, 402, 'PAYMENT_FAILED', { reason });
  }
}

/**
 * Convert various error types to ApiError
 */
export function normalizeError(error: unknown): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return new ValidationError('Validation failed', error.issues);
  }

  // Standard Error
  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  // Unknown error type
  return new InternalServerError('An unexpected error occurred');
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: ApiError, requestId?: string): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Handle error and return NextResponse
 */
export function handleError(error: unknown, requestId?: string): NextResponse {
  const apiError = normalizeError(error);

  // Log the error
  if (apiError.isOperational) {
    logger.warn('Operational error', {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      details: apiError.details,
      requestId,
    });
  } else {
    logger.error('System error', {
      code: apiError.code,
      message: apiError.message,
      statusCode: apiError.statusCode,
      stack: apiError.stack,
      requestId,
    });
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorResponse = createErrorResponse(
    isProduction && !apiError.isOperational
      ? new InternalServerError()
      : apiError,
    requestId
  );

  return NextResponse.json(errorResponse, {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId || '',
    },
  });
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Generate request ID if available
      const request = args.find((arg) => arg?.nextUrl);
      const requestId = request?.headers?.get('x-request-id') || crypto.randomUUID();
      return handleError(error, requestId);
    }
  };
}

/**
 * Assert condition or throw error
 */
export function assert(condition: boolean, error: ApiError): asserts condition {
  if (!condition) {
    throw error;
  }
}

/**
 * Assert value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  error: ApiError
): asserts value is T {
  if (value === null || value === undefined) {
    throw error;
  }
}
