/**
 * Validation middleware and utilities
 */

import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { ApiError, ValidationError } from '@/lib/errors/api-errors';

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw new ApiError('Invalid JSON body', 400);
  }
}

/**
 * Validate URL search params against a Zod schema
 */
export function validateSearchParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw new ApiError('Invalid query parameters', 400);
  }
}

/**
 * Validate data against a schema (for non-request validation)
 */
export function validate<T extends z.ZodType>(
  data: unknown,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}

/**
 * Safe validation - returns result object instead of throwing
 */
export function safeValidate<T extends z.ZodType>(
  data: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize SQL input (basic - database should handle this)
 */
export function sanitizeSqlInput(input: string): string {
  return input.replace(/[;\-\-\/\*]/g, '');
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract and validate pagination params
 */
export function getPaginationParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}): void {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [] } = options; // Default 5MB

  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type ${file.type} is not allowed`);
  }
}
