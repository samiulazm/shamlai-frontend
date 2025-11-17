/**
 * Sentry Error Tracking Configuration
 *
 * This module initializes Sentry for error tracking and monitoring.
 * Sentry captures exceptions, performance metrics, and user feedback.
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '../utils/logger';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Capture Replay for 10% of all sessions,
      // plus 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Environment
      environment: process.env.NODE_ENV,

      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

      // Integrations
      integrations: [
        Sentry.replayIntegration({
          // Mask all text content by default
          maskAllText: true,
          // Block all media content by default
          blockAllMedia: true,
        }),
      ],

      // Filter out certain errors
      beforeSend(event: any, hint: any) {
        const error = hint.originalException;

        // Don't send network errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = error.message as string;
          if (message.includes('Network Error') || message.includes('Failed to fetch')) {
            return null;
          }
        }

        return event;
      },

      // Set context
      initialScope: (scope: any) => {
        scope.setTag('app', 'shamlai-frontend');
        return scope;
      },
    });

    logger.info('Sentry initialized');
  } else {
    logger.info('Sentry DSN not configured - error tracking disabled');
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  logger.error('Exception captured', error, context);
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
  logger.info(message, { level });
}

/**
 * Set the current user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Clear the current user context
 */
export function clearUser() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Set custom context data
 */
export function setContext(name: string, context: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setContext(name, context);
  }
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
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

/**
 * Configure Sentry scope
 * Replaces deprecated Sentry.configureScope with getCurrentScope
 */
export function configureScope(callback: (scope: Sentry.Scope) => void) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const scope = Sentry.getCurrentScope();
    callback(scope);
  }
}
