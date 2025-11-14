/**
 * Sentry Error Tracking Configuration
 *
 * This module initializes Sentry for error tracking and monitoring.
 * Sentry captures exceptions, performance metrics, and user feedback.
 *
 * TODO: Install @sentry/nextjs package to enable error tracking
 * Run: npm install @sentry/nextjs
 */

// import * as Sentry from '@sentry/nextjs';
import { logger } from '../utils/logger';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    logger.warn('Sentry DSN configured but @sentry/nextjs not installed. Install it to enable error tracking.');
  } else {
    logger.info('Sentry DSN not configured - error tracking disabled');
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     contexts: context ? { custom: context } : undefined,
  //   });
  // }
  logger.error('Exception captured', error, context);
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureMessage(message, level);
  // }
  logger.info(message, { level });
}

/**
 * Set the current user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.setUser(user);
  // }
}

/**
 * Clear the current user context
 */
export function clearUser() {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.setUser(null);
  // }
}

/**
 * Set custom context data
 */
export function setContext(name: string, context: Record<string, any>) {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.setContext(name, context);
  // }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}) {
  // TODO: Uncomment when @sentry/nextjs is installed
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.addBreadcrumb(breadcrumb);
  // }
}
