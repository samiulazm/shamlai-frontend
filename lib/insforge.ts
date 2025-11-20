import { createClient } from '@insforge/sdk';
import { logger } from './utils/logger';

// InsForge Backend Configuration
// Note: Validation happens at runtime, not during build time
const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';

// Validate environment variable at runtime (not during build)
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_PUBLIC_INSFORGE_URL
) {
  console.warn('NEXT_PUBLIC_INSFORGE_URL environment variable is not set in production');
}

// Create and export the InsForge client with latest configuration
export const insforgeClient = createClient({
  baseUrl: INSFORGE_URL,
});

// Create a server-side client with service role for operations that bypass RLS
// This should ONLY be used in server-side code (API routes, server components)
// NEVER expose this client to the browser
let _insforgeServerClient: ReturnType<typeof createClient> | null = null;

export const getInsforgeServerClient = () => {
  if (!_insforgeServerClient) {
    if (!process.env.INSFORGE_SERVICE_ROLE_KEY) {
      // Fall back to regular client if service role key is not available
      // This allows the app to work in environments where RLS is not strictly required
      logger.warn(
        'INSFORGE_SERVICE_ROLE_KEY not found. Using regular client instead. ' +
          'Some operations may be restricted by RLS policies.'
      );
      return insforgeClient;
    }

    _insforgeServerClient = createClient({
      baseUrl: INSFORGE_URL,
      headers: {
        Authorization: `Bearer ${process.env.INSFORGE_SERVICE_ROLE_KEY}`,
      },
    });
  }

  return _insforgeServerClient;
};

// Export types for TypeScript usage
export type InsforgeClient = typeof insforgeClient;

// Helper function to handle errors consistently
export const handleInsforgeError = (error: any) => {
  logger.error('InsForge Error', error instanceof Error ? error : new Error(String(error)), {
    code: error?.code,
    details: error?.details,
  });
  return {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code || 'UNKNOWN_ERROR',
    details: error?.details || null,
  };
};

// Helper function for file uploads with progress
export const uploadFile = async (
  bucket: string,
  fileName: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
) => {
  try {
    const { data, error } = await insforgeClient.storage.from(bucket).upload(fileName, file);

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const { data, error } = await insforgeClient.auth.getCurrentUser();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// ============================================================================
// Enhanced Authentication Helpers
// ============================================================================

/**
 * Reset password for email (sends reset link)
 * @param email - User's email address
 * @param redirectTo - URL to redirect after password reset
 */
export const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
  try {
    // Check if resetPasswordForEmail is available
    const authClient = insforgeClient.auth as any;
    if (authClient.resetPasswordForEmail) {
      const { data, error } = await authClient.resetPasswordForEmail(email, {
        redirectTo:
          redirectTo ||
          `${typeof window !== 'undefined' ? window.location.origin : ''}/update-password`,
      });
      if (error) throw error;
      return { data, error: null };
    }

    // Fallback: log warning if not available
    logger.warn('resetPasswordForEmail is not available in this SDK version');
    return { data: null, error: new Error('Password reset is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Update user password
 * @param newPassword - New password to set
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const authClient = insforgeClient.auth as any;

    // Try updateUser method first
    if (authClient.updateUser) {
      const { data, error } = await authClient.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { data, error: null };
    }

    // Try updatePassword method
    if (authClient.updatePassword) {
      const { data, error } = await authClient.updatePassword(newPassword);
      if (error) throw error;
      return { data, error: null };
    }

    logger.warn('Password update is not available in this SDK version');
    return { data: null, error: new Error('Password update is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Update user profile information
 * @param updates - Profile updates (nickname, bio, avatar, etc.)
 */
export const updateUserProfile = async (updates: {
  nickname?: string;
  bio?: string;
  avatar?: string;
  [key: string]: any;
}) => {
  try {
    const authClient = insforgeClient.auth as any;

    // Try setProfile method (already used in codebase)
    if (authClient.setProfile) {
      const { data, error } = await authClient.setProfile(updates);
      if (error) throw error;
      return { data, error: null };
    }

    // Try updateUser method
    if (authClient.updateUser) {
      const { data, error } = await authClient.updateUser(updates);
      if (error) throw error;
      return { data, error: null };
    }

    logger.warn('Profile update is not available in this SDK version');
    return { data: null, error: new Error('Profile update is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Verify user email with token
 * @param token - Verification token from email
 */
export const verifyEmail = async (token: string) => {
  try {
    const authClient = insforgeClient.auth as any;
    if (authClient.verifyEmail) {
      const { data, error } = await authClient.verifyEmail(token);
      if (error) throw error;
      return { data, error: null };
    }

    logger.warn('Email verification is not available in this SDK version');
    return { data: null, error: new Error('Email verification is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Resend verification email
 * @param email - User's email address
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    const authClient = insforgeClient.auth as any;
    if (authClient.resendVerificationEmail) {
      const { data, error } = await authClient.resendVerificationEmail(email);
      if (error) throw error;
      return { data, error: null };
    }

    logger.warn('Resend verification email is not available in this SDK version');
    return { data: null, error: new Error('Resend verification email is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Refresh authentication session
 */
export const refreshSession = async () => {
  try {
    const authClient = insforgeClient.auth as any;
    if (authClient.refreshSession) {
      const { data, error } = await authClient.refreshSession();
      if (error) throw error;
      return { data, error: null };
    }

    // Fallback: get current user to refresh state
    return await getCurrentUser();
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Subscribe to authentication state changes
 * @param callback - Callback function called on auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (
  callback: (
    event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED',
    session: any
  ) => void
) => {
  try {
    const authClient = insforgeClient.auth as any;
    if (authClient.onAuthStateChange) {
      const { data } = authClient.onAuthStateChange(callback);
      return {
        unsubscribe: () => {
          if (data?.subscription) {
            data.subscription.unsubscribe();
          }
        },
      };
    }

    logger.warn('onAuthStateChange is not available in this SDK version');
    return {
      unsubscribe: () => {},
    };
  } catch (err) {
    logger.error(
      'Error setting up auth state change listener',
      err instanceof Error ? err : new Error(String(err))
    );
    return {
      unsubscribe: () => {},
    };
  }
};

// ============================================================================
// AI Integration Helpers
// ============================================================================

/**
 * Generate AI content using OpenAI or Google Gemini
 * Note: This is a placeholder for future AI integration
 * @param prompt - The prompt to send to the AI model
 * @param options - Configuration options for the AI request
 */
export const generateAIContent = async (
  prompt: string,
  options?: {
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro';
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
) => {
  try {
    // Check if AI integration is available
    if (!insforgeClient.ai) {
      logger.warn('AI integration is not available in this SDK version');
      return { data: null, error: new Error('AI integration is not available') };
    }

    // Use the AI client if available (actual API may vary)
    const aiClient = insforgeClient.ai as any;
    if (aiClient.generate) {
      const { data, error } = await aiClient.generate({
        prompt,
        model: options?.model || 'gpt-4',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000,
        systemPrompt: options?.systemPrompt,
      });

      if (error) throw error;
      return { data, error: null };
    }

    throw new Error('AI generate method not available');
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Chat completion for conversational AI
 * Note: This is a placeholder for future AI integration
 * @param messages - Array of message objects with role and content
 * @param options - Configuration options
 */
export const chatCompletion = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: {
    model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gemini-pro';
    temperature?: number;
    maxTokens?: number;
  }
) => {
  try {
    if (!insforgeClient.ai) {
      logger.warn('AI integration is not available in this SDK version');
      return { data: null, error: new Error('AI integration is not available') };
    }

    // Use the AI client if available (actual API may vary)
    const aiClient = insforgeClient.ai as any;
    if (aiClient.chat && typeof aiClient.chat === 'function') {
      const { data, error } = await aiClient.chat({
        messages,
        model: options?.model || 'gpt-4',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000,
      });

      if (error) throw error;
      return { data, error: null };
    }

    throw new Error('AI chat method not available');
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// ============================================================================
// Edge Functions Helpers
// ============================================================================

/**
 * Invoke an edge function
 * Note: This is a placeholder for future edge functions integration
 * @param functionName - The name/slug of the function to invoke
 * @param body - Request body to send to the function
 * @param options - Additional options (headers, method)
 */
export const invokeFunction = async <T = any>(
  functionName: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  }
) => {
  try {
    // Check if functions are available (may not be in current SDK version)
    const client = insforgeClient as any;
    if (!client.functions) {
      logger.warn('Edge functions are not available in this SDK version');
      return { data: null, error: new Error('Edge functions are not available') };
    }

    const { data, error } = await client.functions.invoke(functionName, {
      body,
      headers: options?.headers,
      method: options?.method || 'POST',
    });

    if (error) throw error;
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// ============================================================================
// Real-time Subscriptions Helpers
// ============================================================================

/**
 * Subscribe to database changes using real-time
 * Note: This is a placeholder for future real-time integration
 * @param table - Table name to subscribe to
 * @param filter - Optional filter (e.g., 'shop_id=eq.123')
 * @param callback - Callback function for changes
 * @returns Subscription object with unsubscribe method
 */
export const subscribeToTable = (
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) => {
  try {
    // Check if realtime is available (may not be in current SDK version)
    const client = insforgeClient as any;
    if (!client.realtime) {
      logger.warn('Real-time subscriptions are not available in this SDK version');
      return {
        unsubscribe: () => {},
      };
    }

    const channel = client.realtime.channel(`table:${table}`);

    if (filter) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback || (() => {})
      );
    } else {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        callback || (() => {})
      );
    }

    channel.subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      },
    };
  } catch (err) {
    logger.error(
      'Error setting up real-time subscription',
      err instanceof Error ? err : new Error(String(err))
    );
    return {
      unsubscribe: () => {},
    };
  }
};

// ============================================================================
// Enhanced Storage Helpers
// ============================================================================

/**
 * Upload file with retry logic and progress tracking
 * @param bucket - Storage bucket name
 * @param fileName - File name/path in storage
 * @param file - File or Blob to upload
 * @param onProgress - Progress callback (0-100)
 * @param retries - Number of retry attempts (default: 3)
 */
export const uploadFileWithRetry = async (
  bucket: string,
  fileName: string,
  file: File | Blob,
  onProgress?: (progress: number) => void,
  retries: number = 3
) => {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await insforgeClient.storage.from(bucket).upload(fileName, file);

      if (error) throw error;

      if (onProgress) {
        onProgress(100);
      }

      return { data, error: null };
    } catch (err) {
      lastError = err;
      logger.warn(
        `Upload attempt ${attempt}/${retries} failed`,
        err instanceof Error ? err : new Error(String(err))
      );

      if (attempt < retries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { data: null, error: handleInsforgeError(lastError) };
};

/**
 * Get public URL for a file in storage
 * @param bucket - Storage bucket name
 * @param fileName - File name/path
 * @returns Public URL string
 */
export const getPublicUrl = (bucket: string, fileName: string): string => {
  const result = insforgeClient.storage.from(bucket).getPublicUrl(fileName);
  // getPublicUrl may return a string directly or an object with data property
  if (typeof result === 'string') {
    return result;
  }
  return (result as any).publicUrl || (result as any).data?.publicUrl || '';
};

/**
 * Delete file from storage
 * @param bucket - Storage bucket name
 * @param fileName - File name/path to delete (can be string or array)
 */
export const deleteFile = async (bucket: string, fileName: string | string[]) => {
  try {
    const filesToDelete = Array.isArray(fileName) ? fileName : [fileName];
    // The remove method may accept array or single string - handle both cases
    const storageClient = insforgeClient.storage.from(bucket);
    const { data, error } = await (storageClient as any).remove(filesToDelete);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * List files in a storage bucket
 * @param bucket - Storage bucket name
 * @param path - Optional path prefix to filter files
 * @param options - List options (limit, offset, sortBy)
 */
export const listFiles = async (
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order?: 'asc' | 'desc' };
  }
) => {
  try {
    const storageClient = insforgeClient.storage.from(bucket);
    const client = storageClient as any;

    // Try different list method signatures
    let result;
    if (client.list) {
      if (path && options) {
        result = await client.list(path, options);
      } else if (path) {
        result = await client.list(path);
      } else {
        result = await client.list();
      }
    } else {
      throw new Error('list method not available');
    }

    const { data, error } = result;
    if (error) throw error;

    // Handle different response formats
    const files = (data as any)?.objects || (data as any) || [];
    return { data: Array.isArray(files) ? files : [], error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Download file from storage
 * @param bucket - Storage bucket name
 * @param fileName - File name/path to download
 */
export const downloadFile = async (bucket: string, fileName: string) => {
  try {
    const { data, error } = await insforgeClient.storage.from(bucket).download(fileName);

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Move or rename file in storage
 * @param bucket - Storage bucket name
 * @param fromPath - Source file path
 * @param toPath - Destination file path
 */
export const moveFile = async (bucket: string, fromPath: string, toPath: string) => {
  try {
    const storageClient = insforgeClient.storage.from(bucket);
    const client = storageClient as any;

    if (client.move) {
      const { data, error } = await client.move(fromPath, toPath);
      if (error) throw error;
      return { data, error: null };
    }

    // Fallback: download, upload, then delete
    const downloadResult = await downloadFile(bucket, fromPath);
    if (downloadResult.error || !downloadResult.data) {
      throw downloadResult.error || new Error('Failed to download file');
    }

    const uploadResult = await uploadFileWithRetry(bucket, toPath, downloadResult.data);
    if (uploadResult.error) {
      throw uploadResult.error;
    }

    await deleteFile(bucket, fromPath);
    return { data: uploadResult.data, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Copy file in storage
 * @param bucket - Storage bucket name
 * @param fromPath - Source file path
 * @param toPath - Destination file path
 */
export const copyFile = async (bucket: string, fromPath: string, toPath: string) => {
  try {
    const storageClient = insforgeClient.storage.from(bucket);
    const client = storageClient as any;

    if (client.copy) {
      const { data, error } = await client.copy(fromPath, toPath);
      if (error) throw error;
      return { data, error: null };
    }

    // Fallback: download and upload
    const downloadResult = await downloadFile(bucket, fromPath);
    if (downloadResult.error || !downloadResult.data) {
      throw downloadResult.error || new Error('Failed to download file');
    }

    const uploadResult = await uploadFileWithRetry(bucket, toPath, downloadResult.data);
    return uploadResult;
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Check if file exists in storage
 * @param bucket - Storage bucket name
 * @param fileName - File name/path to check
 */
export const fileExists = async (bucket: string, fileName: string): Promise<boolean> => {
  try {
    const path = fileName.split('/').slice(0, -1).join('/') || '';
    const searchName = fileName.split('/').pop() || fileName;

    const result = await listFiles(bucket, path, { limit: 100 });
    if (result.error || !result.data) {
      return false;
    }

    const files = Array.isArray(result.data) ? result.data : (result.data as any)?.objects || [];
    return files.some((file: any) => file.name === searchName || file.key === fileName);
  } catch {
    return false;
  }
};

// ============================================================================
// Enhanced Database Helpers
// ============================================================================

/**
 * Execute a database query with automatic retry on failure
 * @param queryFn - Function that returns a database query
 * @param retries - Number of retry attempts (default: 3)
 */
export const executeWithRetry = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries: number = 3
): Promise<{ data: T | null; error: any }> => {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await queryFn();
      if (result.error && attempt < retries) {
        // Retry on error (except for client errors like 400, 404)
        if (result.error.status && result.error.status >= 500) {
          lastError = result.error;
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { data: null, error: handleInsforgeError(lastError) };
};

// ============================================================================
// Database Advanced Operations
// ============================================================================

/**
 * Call a database RPC (Remote Procedure Call) function
 * @param functionName - Name of the RPC function
 * @param params - Parameters to pass to the function
 */
export const callRPC = async <T = any>(functionName: string, params?: Record<string, any>) => {
  try {
    const dbClient = insforgeClient.database as any;

    // Try rpc method if available
    if (dbClient.rpc) {
      const { data, error } = await dbClient.rpc(functionName, params || {});
      if (error) throw error;
      return { data: data as T, error: null };
    }

    // Fallback: use a custom query if RPC is not available
    logger.warn('RPC method is not available in this SDK version');
    return { data: null, error: new Error('RPC is not available') };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Execute multiple database operations in a batch
 * @param operations - Array of query functions to execute
 * @param stopOnError - Whether to stop on first error (default: true)
 */
export const executeBatch = async <T = any>(
  operations: Array<() => Promise<{ data: T | null; error: any }>>,
  stopOnError: boolean = true
): Promise<{ data: T[]; errors: any[] }> => {
  const results: T[] = [];
  const errors: any[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      if (result.error) {
        errors.push(result.error);
        if (stopOnError) {
          return { data: results, errors };
        }
      } else {
        results.push(result.data as T);
      }
    } catch (err) {
      errors.push(err);
      if (stopOnError) {
        return { data: results, errors };
      }
    }
  }

  return { data: results, errors };
};

/**
 * Upsert (insert or update) a record
 * @param table - Table name
 * @param data - Data to upsert
 * @param conflictColumn - Column to check for conflicts (default: 'id')
 */
export const upsert = async <T = any>(table: string, data: any, conflictColumn: string = 'id') => {
  try {
    const { data: result, error } = await insforgeClient.database
      .from(table)
      .upsert(data, { onConflict: conflictColumn })
      .select()
      .single();

    if (error) throw error;
    return { data: result as T, error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Bulk insert records
 * @param table - Table name
 * @param records - Array of records to insert
 */
export const bulkInsert = async <T = any>(table: string, records: any[]) => {
  try {
    const { data, error } = await insforgeClient.database.from(table).insert(records).select();

    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

/**
 * Bulk update records
 * @param table - Table name
 * @param updates - Update data
 * @param filter - Filter condition (e.g., { column: 'id', operator: 'in', value: [1, 2, 3] })
 */
export const bulkUpdate = async <T = any>(
  table: string,
  updates: Partial<T>,
  filter: { column: string; operator: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte'; value: any }
) => {
  try {
    let query = insforgeClient.database.from(table).update(updates);

    // Apply filter
    if (filter.operator === 'eq') {
      query = query.eq(filter.column, filter.value);
    } else if (filter.operator === 'in') {
      query = query.in(filter.column, filter.value);
    } else if (filter.operator === 'gt') {
      query = query.gt(filter.column, filter.value);
    } else if (filter.operator === 'lt') {
      query = query.lt(filter.column, filter.value);
    } else if (filter.operator === 'gte') {
      query = query.gte(filter.column, filter.value);
    } else if (filter.operator === 'lte') {
      query = query.lte(filter.column, filter.value);
    }

    const { data, error } = await query.select();
    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (err) {
    return { data: null, error: handleInsforgeError(err) };
  }
};

// Storage bucket names (constants for consistency)
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  CATEGORY_IMAGES: 'category-images',
  SHOP_ASSETS: 'shop-assets',
  BLOG_IMAGES: 'blog-images',
  REVIEW_IMAGES: 'review-images',
  CHATBOT_ATTACHMENTS: 'chatbot-attachments',
} as const;

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Fulfillment status constants
export const FULFILLMENT_STATUS = {
  UNFULFILLED: 'unfulfilled',
  PARTIAL: 'partial',
  FULFILLED: 'fulfilled',
} as const;

// Discount type constants
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
} as const;

export default insforgeClient;

// NOTE: Services are NOT auto-exported to prevent importing server-only code (Redis, ioredis) in client components
// Import services directly when needed:
// import * as ProductService from '@/lib/services/products';
// import * as OrderService from '@/lib/services/orders';
// import * as CartService from '@/lib/services/cart';
// import * as MarketingService from '@/lib/services/marketing';
// import * as ShopService from '@/lib/services/shop';

// Export all types (safe for client)
export * from './types/database';

// Export validation utilities (safe for client)
export * as Validation from './utils/validation';

// Export seed data utilities (safe for client)
export * as SeedData from './utils/seed-data';

// Export React hooks (safe for client)
export * from './hooks/useProducts';
export * from './hooks/useOrders';
export * from './hooks/useCart';
export * from './hooks/useShop';
