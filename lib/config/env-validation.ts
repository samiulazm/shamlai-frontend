/**
 * Environment Variable Validation
 * Ensures all required config is present at startup
 */

interface EnvConfig {
  // Required
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_INSFORGE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';

  // Optional but recommended for production
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  const required = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_INSFORGE_URL: process.env.NEXT_PUBLIC_INSFORGE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Check required vars
  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Production checks
  if (process.env.NODE_ENV === 'production') {
    // Warn about missing Redis (not required but highly recommended)
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_URL;

    if (!hasRedis) {
      console.warn(
        '⚠️  WARNING: Redis not configured. Caching and rate limiting will be disabled. ' +
        'For production scaling to 1k-10k users, Redis is HIGHLY RECOMMENDED.'
      );
    }

    // Warn about missing Sentry
    if (!process.env.SENTRY_DSN) {
      console.warn(
        '⚠️  WARNING: Sentry not configured. Error tracking will be limited.'
      );
    }

    // Warn if using development API URL in production
    if (process.env.NEXT_PUBLIC_INSFORGE_URL?.includes('localhost')) {
      errors.push('Production build using localhost API URL!');
    }
  }

  // Throw if any required vars missing
  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  return {
    NEXT_PUBLIC_APP_URL: required.NEXT_PUBLIC_APP_URL!,
    NEXT_PUBLIC_INSFORGE_URL: required.NEXT_PUBLIC_INSFORGE_URL!,
    NODE_ENV: required.NODE_ENV as 'development' | 'production' | 'test',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  };
}

/**
 * Get environment-specific config
 */
export function getEnvConfig() {
  const env = validateEnv();

  return {
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    appUrl: env.NEXT_PUBLIC_APP_URL,
    apiUrl: env.NEXT_PUBLIC_INSFORGE_URL,
    hasRedis: !!(env.UPSTASH_REDIS_REST_URL || env.REDIS_URL),
    hasSentry: !!env.SENTRY_DSN,
  };
}

/**
 * Print environment status at startup
 */
export function printEnvStatus(): void {
  console.log('\n=================================');
  console.log('🚀 Shamlai E-commerce Platform');
  console.log('=================================');

  const config = getEnvConfig();

  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`App URL: ${config.appUrl}`);
  console.log(`API URL: ${config.apiUrl}`);
  console.log('\nFeatures:');
  console.log(`  Redis Caching: ${config.hasRedis ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`  Error Tracking: ${config.hasSentry ? '✅ Enabled' : '❌ Disabled'}`);

  if (config.isProduction && !config.hasRedis) {
    console.log('\n⚠️  PRODUCTION MODE WITHOUT REDIS');
    console.log('   For scaling to 1k-10k users, please configure Redis:');
    console.log('   See: docs/SCALING.md\n');
  }

  console.log('=================================\n');
}

// Auto-validate on import in production
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}
