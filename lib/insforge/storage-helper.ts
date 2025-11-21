/**
 * InsForge Storage Helper
 * Optimized file upload and management for InsForge storage buckets
 */

import { getInsForgeManager } from './client-manager';
import { logger } from '@/lib/utils/logger';

export interface StorageUploadOptions {
  bucket: string;
  path: string;
  file: File | Buffer | Blob;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: any;
  size?: number;
}

export interface StorageListOptions {
  bucket: string;
  path?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at';
}

/**
 * Upload file to InsForge storage
 */
export async function uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
  const { bucket, path, file, contentType, cacheControl, upsert, metadata } = options;

  const manager = getInsForgeManager();

  try {
    logger.info('Uploading file', { bucket, path });

    const { data, error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).upload(path, file, {
        contentType,
        cacheControl: cacheControl || '3600',
        upsert: upsert || false,
        metadata,
      })
    );

    if (error) {
      throw error;
    }

    // Get public URL
    const client = await manager.getClient();
    const { data: urlData } = client.storage.from(bucket).getPublicUrl(path);
    manager.releaseClient(client);

    const size =
      file instanceof File ? file.size : file instanceof Buffer ? file.length : undefined;

    logger.info('File uploaded successfully', {
      bucket,
      path,
      size,
      url: urlData?.publicUrl,
    });

    return {
      success: true,
      url: urlData?.publicUrl,
      path: data?.path,
      size,
    };
  } catch (error) {
    logger.error('File upload failed', { bucket, path, error });
    return {
      success: false,
      error,
    };
  }
}

/**
 * Upload multiple files in batch
 */
export async function uploadMultipleFiles(
  files: Array<Omit<StorageUploadOptions, 'bucket'> & { bucket?: string }>,
  defaultBucket: string = 'products'
): Promise<StorageUploadResult[]> {
  const results = await Promise.all(
    files.map((file) =>
      uploadFile({
        bucket: file.bucket || defaultBucket,
        ...file,
      })
    )
  );

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  logger.info('Batch upload completed', {
    total: files.length,
    success: successCount,
    failed: failCount,
  });

  return results;
}

/**
 * Download file from storage
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ data: Blob | null; error: any }> {
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).download(path)
    );

    return { data, error };
  } catch (error) {
    logger.error('File download failed', { bucket, path, error });
    return { data: null, error };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: string,
  paths: string | string[]
): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();
  const pathArray = Array.isArray(paths) ? paths : [paths];

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).remove(pathArray)
    );

    if (error) {
      throw error;
    }

    logger.info('Files deleted', { bucket, count: pathArray.length });

    return { success: true };
  } catch (error) {
    logger.error('File deletion failed', { bucket, paths, error });
    return { success: false, error };
  }
}

/**
 * List files in bucket
 */
export async function listFiles(options: StorageListOptions): Promise<{
  files: Array<{
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    size: number;
    metadata?: any;
  }>;
  error?: any;
}> {
  const { bucket, path, limit, offset, sortBy } = options;
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).list(path, {
        limit: limit || 100,
        offset: offset || 0,
        sortBy: sortBy ? { column: sortBy, order: 'asc' } : undefined,
      })
    );

    if (error) {
      throw error;
    }

    return { files: data || [] };
  } catch (error) {
    logger.error('List files failed', { bucket, path, error });
    return { files: [], error };
  }
}

/**
 * Get file public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const manager = getInsForgeManager();
  const client = manager['defaultClient']; // Access default client

  const { data } = client.storage.from(bucket).getPublicUrl(path);

  return data?.publicUrl || '';
}

/**
 * Get signed URL for private files
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).createSignedUrl(path, expiresIn)
    );

    if (error) {
      throw error;
    }

    return { url: data?.signedUrl || null };
  } catch (error) {
    logger.error('Get signed URL failed', { bucket, path, error });
    return { url: null, error };
  }
}

/**
 * Move/rename file
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).move(fromPath, toPath)
    );

    if (error) {
      throw error;
    }

    logger.info('File moved', { bucket, from: fromPath, to: toPath });

    return { success: true };
  } catch (error) {
    logger.error('File move failed', { bucket, fromPath, toPath, error });
    return { success: false, error };
  }
}

/**
 * Copy file
 */
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.from(bucket).copy(fromPath, toPath)
    );

    if (error) {
      throw error;
    }

    logger.info('File copied', { bucket, from: fromPath, to: toPath });

    return { success: true };
  } catch (error) {
    logger.error('File copy failed', { bucket, fromPath, toPath, error });
    return { success: false, error };
  }
}

/**
 * Get storage bucket info
 */
export async function getBucketInfo(bucket: string): Promise<{
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
} | null> {
  const manager = getInsForgeManager();

  try {
    const { data, error } = await manager.executeQuery(async (client) =>
      client.storage.getBucket(bucket)
    );

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get bucket info failed', { bucket, error });
    return null;
  }
}

/**
 * Create storage bucket
 */
export async function createBucket(
  name: string,
  options: { public?: boolean } = {}
): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.createBucket(name, {
        public: options.public || false,
      })
    );

    if (error) {
      throw error;
    }

    logger.info('Bucket created', { name, public: options.public });

    return { success: true };
  } catch (error) {
    logger.error('Bucket creation failed', { name, error });
    return { success: false, error };
  }
}

/**
 * Delete storage bucket
 */
export async function deleteBucket(name: string): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.deleteBucket(name)
    );

    if (error) {
      throw error;
    }

    logger.info('Bucket deleted', { name });

    return { success: true };
  } catch (error) {
    logger.error('Bucket deletion failed', { name, error });
    return { success: false, error };
  }
}

/**
 * Empty storage bucket
 */
export async function emptyBucket(name: string): Promise<{ success: boolean; error?: any }> {
  const manager = getInsForgeManager();

  try {
    const { error } = await manager.executeQuery(async (client) =>
      client.storage.emptyBucket(name)
    );

    if (error) {
      throw error;
    }

    logger.info('Bucket emptied', { name });

    return { success: true };
  } catch (error) {
    logger.error('Bucket empty failed', { name, error });
    return { success: false, error };
  }
}
