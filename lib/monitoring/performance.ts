/**
 * Performance Monitoring Utilities
 * Track key metrics for scaling to 1k-10k users
 */

import { incrementCounter, REDIS_KEYS } from '../redis';

/**
 * Track API response times
 */
export async function trackResponseTime(endpoint: string, duration: number): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `analytics:response_time:${endpoint}:${date}`;

    // Store in Redis for aggregation
    await incrementCounter(key, 24 * 60 * 60); // 24 hour TTL

    // Log slow requests
    if (duration > 500) {
      console.warn(`Slow API response: ${endpoint} took ${duration}ms`);
    }

    // Alert on very slow requests
    if (duration > 2000) {
      console.error(`CRITICAL: ${endpoint} took ${duration}ms`);
      // TODO: Send to Sentry or monitoring service
    }
  } catch (error) {
    console.error('Error tracking response time:', error);
  }
}

/**
 * Track cache performance
 */
export async function trackCacheHit(key: string, hit: boolean): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const metricKey = hit
      ? `analytics:cache_hit:${date}`
      : `analytics:cache_miss:${date}`;

    await incrementCounter(metricKey, 24 * 60 * 60);
  } catch (error) {
    console.error('Error tracking cache hit:', error);
  }
}

/**
 * Track database queries
 */
export async function trackDatabaseQuery(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  duration: number
): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const key = `analytics:db_query:${table}:${operation}:${date}`;

    await incrementCounter(key, 24 * 60 * 60);

    // Alert on slow queries
    if (duration > 1000) {
      console.warn(`Slow database query: ${table}.${operation} took ${duration}ms`);
    }
  } catch (error) {
    console.error('Error tracking database query:', error);
  }
}

/**
 * Track user actions for analytics
 */
export async function trackUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const key = `analytics:action:${action}:${date}`;

    await incrementCounter(key, 7 * 24 * 60 * 60); // 7 day TTL

    // Log important actions
    if (['checkout', 'payment', 'order_placed'].includes(action)) {
      console.log(`User action: ${action}`, { userId, metadata });
    }
  } catch (error) {
    console.error('Error tracking user action:', error);
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  /**
   * End timer and get duration
   */
  end(): number {
    const duration = Date.now() - this.startTime;
    console.log(`⏱️  ${this.label}: ${duration}ms`);
    return duration;
  }

  /**
   * End timer and track in monitoring system
   */
  async endAndTrack(endpoint?: string): Promise<number> {
    const duration = this.end();

    if (endpoint) {
      await trackResponseTime(endpoint, duration);
    }

    return duration;
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const timer = new PerformanceTimer(label);
  const result = await fn();
  const duration = timer.end();

  return { result, duration };
}

/**
 * Get system health metrics
 */
export function getSystemMetrics() {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Health check endpoint data
 */
export async function getHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: any;
}> {
  const checks = {
    database: true, // TODO: Add actual DB health check
    redis: true, // TODO: Add actual Redis health check
    memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
  };

  const allHealthy = Object.values(checks).every((check) => check);

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    metrics: getSystemMetrics(),
  };
}

/**
 * Rate limit violation tracking
 */
export async function trackRateLimitViolation(
  identifier: string,
  endpoint: string
): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const key = `analytics:rate_limit_violation:${date}`;

    await incrementCounter(key, 24 * 60 * 60);

    console.warn(`Rate limit violation: ${identifier} on ${endpoint}`);

    // TODO: Alert if violations spike
  } catch (error) {
    console.error('Error tracking rate limit violation:', error);
  }
}

/**
 * Error tracking helper
 */
export function trackError(
  error: Error,
  context: {
    endpoint?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): void {
  console.error('Application error:', {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // TODO: Send to Sentry
  // Sentry.captureException(error, { contexts: { custom: context } });
}
