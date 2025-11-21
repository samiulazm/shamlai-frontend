/**
 * InsForge Client Manager
 * Optimized connection pooling and client management for InsForge BaaS
 */

import { createClient } from '@insforge/sdk';
import { logger } from '@/lib/utils/logger';

export interface InsForgeClientConfig {
  baseUrl: string;
  anonKey?: string;
  serviceKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  poolSize?: number;
}

interface ClientPool {
  clients: any[];
  available: boolean[];
  lastUsed: number[];
  stats: {
    totalRequests: number;
    activeConnections: number;
    errors: number;
    avgResponseTime: number;
  };
}

class InsForgeClientManager {
  private static instance: InsForgeClientManager;
  private config: InsForgeClientConfig;
  private pool: ClientPool;
  private defaultClient: any;
  private metricsInterval?: NodeJS.Timeout;

  private constructor(config: InsForgeClientConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      poolSize: 5,
      ...config,
    };

    // Initialize connection pool
    this.pool = {
      clients: [],
      available: [],
      lastUsed: [],
      stats: {
        totalRequests: 0,
        activeConnections: 0,
        errors: 0,
        avgResponseTime: 0,
      },
    };

    // Create default client
    this.defaultClient = this.createClient();

    // Initialize pool
    this.initializePool();

    // Start metrics collection
    this.startMetricsCollection();

    logger.info('InsForge Client Manager initialized', {
      poolSize: this.config.poolSize,
      baseUrl: this.config.baseUrl,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: InsForgeClientConfig): InsForgeClientManager {
    if (!InsForgeClientManager.instance) {
      if (!config) {
        throw new Error('InsForge config required for first initialization');
      }
      InsForgeClientManager.instance = new InsForgeClientManager(config);
    }
    return InsForgeClientManager.instance;
  }

  /**
   * Create a new InsForge client
   */
  private createClient() {
    return createClient({
      baseUrl: this.config.baseUrl,
      ...(this.config.anonKey && { anonKey: this.config.anonKey }),
      ...(this.config.serviceKey && { serviceKey: this.config.serviceKey }),
    });
  }

  /**
   * Initialize connection pool
   */
  private initializePool() {
    for (let i = 0; i < this.config.poolSize!; i++) {
      this.pool.clients.push(this.createClient());
      this.pool.available.push(true);
      this.pool.lastUsed.push(Date.now());
    }
  }

  /**
   * Get a client from the pool
   */
  public async getClient(): Promise<any> {
    // Try to get an available client from pool
    for (let i = 0; i < this.pool.clients.length; i++) {
      if (this.pool.available[i]) {
        this.pool.available[i] = false;
        this.pool.lastUsed[i] = Date.now();
        this.pool.stats.activeConnections++;
        return this.pool.clients[i];
      }
    }

    // If no client available, return default client
    logger.warn('No pooled client available, using default client');
    return this.defaultClient;
  }

  /**
   * Release a client back to the pool
   */
  public releaseClient(client: any) {
    const index = this.pool.clients.indexOf(client);
    if (index !== -1) {
      this.pool.available[index] = true;
      this.pool.stats.activeConnections--;
    }
  }

  /**
   * Execute a query with automatic client management
   */
  public async executeQuery<T>(
    operation: (client: any) => Promise<T>,
    options: { retry?: boolean; timeout?: number } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const client = await this.getClient();

    try {
      this.pool.stats.totalRequests++;

      let lastError: any;
      const maxRetries = options.retry !== false ? this.config.maxRetries! : 1;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await this.withTimeout(
            operation(client),
            options.timeout || this.config.timeout!
          );

          // Update metrics
          const duration = Date.now() - startTime;
          this.updateResponseTime(duration);

          return result;
        } catch (error: any) {
          lastError = error;

          // Don't retry on validation errors or 4xx errors
          if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
            throw error;
          }

          if (attempt < maxRetries - 1) {
            const delay = this.config.retryDelay! * Math.pow(2, attempt);
            logger.warn('Query failed, retrying...', {
              attempt: attempt + 1,
              maxRetries,
              delay,
              error: error?.message,
            });
            await this.sleep(delay);
          }
        }
      }

      this.pool.stats.errors++;
      throw lastError;
    } finally {
      this.releaseClient(client);
    }
  }

  /**
   * Execute query with timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update average response time
   */
  private updateResponseTime(duration: number) {
    const { totalRequests, avgResponseTime } = this.pool.stats;
    this.pool.stats.avgResponseTime =
      (avgResponseTime * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Get pool statistics
   */
  public getStats() {
    return {
      ...this.pool.stats,
      poolSize: this.config.poolSize,
      availableConnections: this.pool.available.filter((a) => a).length,
    };
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      const stats = this.getStats();

      if (stats.totalRequests > 0) {
        logger.debug('InsForge metrics', stats);
      }

      // Reset stats every hour
      if (stats.totalRequests > 10000) {
        this.pool.stats.totalRequests = 0;
        this.pool.stats.errors = 0;
        this.pool.stats.avgResponseTime = 0;
      }
    }, 60000); // Every minute
  }

  /**
   * Cleanup resources
   */
  public async cleanup() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    logger.info('InsForge Client Manager cleaned up', this.getStats());
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();

      // Try a simple query
      const { error } = await client.database.from('shop_settings').select('id').limit(1);

      this.releaseClient(client);

      return !error;
    } catch (error) {
      logger.error('InsForge health check failed', { error });
      return false;
    }
  }
}

/**
 * Initialize InsForge Client Manager
 */
export function initializeInsForgeManager(config: InsForgeClientConfig) {
  return InsForgeClientManager.getInstance(config);
}

/**
 * Get InsForge Client Manager instance
 */
export function getInsForgeManager(): InsForgeClientManager {
  const config: InsForgeClientConfig = {
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130',
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    serviceKey: process.env.INSFORGE_SERVICE_KEY,
  };

  return InsForgeClientManager.getInstance(config);
}

/**
 * Execute query with automatic retry and connection management
 */
export async function executeInsForgeQuery<T>(
  operation: (client: any) => Promise<T>,
  options?: { retry?: boolean; timeout?: number }
): Promise<T> {
  const manager = getInsForgeManager();
  return manager.executeQuery(operation, options);
}

/**
 * Get a simple InsForge client (without pooling)
 * For simple operations that don't need the full manager
 */
export function getInsforgeClient() {
  const config: InsForgeClientConfig = {
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130',
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    serviceKey: process.env.INSFORGE_SERVICE_KEY,
  };

  return createClient({
    baseUrl: config.baseUrl,
    ...(config.anonKey && { anonKey: config.anonKey }),
    ...(config.serviceKey && { serviceKey: config.serviceKey }),
  });
}
