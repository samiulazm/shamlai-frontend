// Comprehensive logging utility for production
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  userId?: string;
  shopId?: string;
  requestId?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      stack: error?.stack,
    };

    // In production, you would send this to a logging service (e.g., Sentry, DataDog, CloudWatch)
    if (this.isDevelopment || this.isDebugEnabled) {
      const formattedMessage = this.formatMessage(entry);

      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage, error);
          break;
        case 'error':
        case 'fatal':
          console.error(formattedMessage, error);
          break;
      }
    }

    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, CloudWatch, etc.
    // Example for Sentry:
    // if (window.Sentry && (entry.level === 'error' || entry.level === 'fatal')) {
    //   window.Sentry.captureException(entry.error || new Error(entry.message), {
    //     level: entry.level,
    //     extra: entry.context,
    //   });
    // }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment || this.isDebugEnabled) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, error?: Error, context?: LogContext) {
    this.log('warn', message, context, error);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    this.log('fatal', message, context, error);
  }

  // Performance logging
  performance(operationName: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${operationName} took ${duration}ms`, {
      ...context,
      operation: operationName,
      duration,
    });
  }

  // API request logging
  apiRequest(method: string, url: string, status: number, duration: number, context?: LogContext) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url} - ${status}`, {
      ...context,
      method,
      url,
      status,
      duration,
    });
  }

  // User action logging
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      action,
    });
  }

  // Database query logging
  dbQuery(query: string, duration: number, context?: LogContext) {
    if (duration > 1000) {
      this.warn(`Slow database query: ${duration}ms`, {
        ...context,
        query: query.substring(0, 100), // Truncate long queries
        duration,
      });
    } else if (this.isDevelopment) {
      this.debug(`Database query: ${duration}ms`, {
        ...context,
        query: query.substring(0, 100),
        duration,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export utility functions
export function measurePerformance<T>(
  operationName: string,
  operation: () => T | Promise<T>,
  context?: LogContext
): T | Promise<T> {
  const startTime = performance.now();

  try {
    const result = operation();

    if (result instanceof Promise) {
      return result
        .then((res) => {
          const duration = performance.now() - startTime;
          logger.performance(operationName, duration, context);
          return res;
        })
        .catch((error) => {
          const duration = performance.now() - startTime;
          logger.error(`${operationName} failed after ${duration}ms`, error, context);
          throw error;
        });
    } else {
      const duration = performance.now() - startTime;
      logger.performance(operationName, duration, context);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${operationName} failed after ${duration}ms`, error as Error, context);
    throw error;
  }
}

export default logger;
