import { logger } from '../logger';
import { AppError } from './index';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface ErrorMetadata {
  userId?: string | number;
  operation?: string;
  resource?: string;
  context?: Record<string, any>;
  stackTrace?: string;
  timestamp?: Date;
  errorName?: string;
}

export interface MonitoringAdapter {
  captureError(error: Error, metadata: ErrorMetadata): void;
  captureMessage(message: string, level: LogLevel, metadata?: ErrorMetadata): void;
  setUser(userId: string | number): void;
}

/**
 * Adapter por defecto (solo logging). Se puede reemplazar con
 * setMonitoringAdapter() para integrar Sentry/Datadog en el futuro.
 */
class DefaultMonitoringAdapter implements MonitoringAdapter {
  captureError(error: Error, metadata: ErrorMetadata): void {
    logger.error(
      {
        err: error,
        ...metadata,
        errorType: error.name,
        statusCode: error instanceof AppError ? error.statusCode : 500,
      },
      `Error: ${error.message}`
    );
  }

  captureMessage(message: string, level: LogLevel, metadata?: ErrorMetadata): void {
    logger[level](
      {
        ...metadata,
      },
      message
    );
  }

  setUser(userId: string | number): void {
    logger.debug({ userId }, 'User context set for monitoring');
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private monitoringAdapter: MonitoringAdapter;

  private constructor() {
    this.monitoringAdapter = new DefaultMonitoringAdapter();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setMonitoringAdapter(adapter: MonitoringAdapter): void {
    this.monitoringAdapter = adapter;
  }

  handleError(error: Error, metadata: ErrorMetadata = {}): void {
    const enrichedMetadata = this.enrichMetadata(error, metadata);
    const logLevel = this.getLogLevel(error);

    if (logLevel === LogLevel.ERROR) {
      this.monitoringAdapter.captureError(error, enrichedMetadata);
    } else {
      this.monitoringAdapter.captureMessage(error.message, logLevel, enrichedMetadata);
    }
  }

  logInfo(message: string, metadata: ErrorMetadata = {}): void {
    this.monitoringAdapter.captureMessage(message, LogLevel.INFO, {
      ...metadata,
      timestamp: new Date(),
    });
  }

  logWarning(message: string, metadata: ErrorMetadata = {}): void {
    this.monitoringAdapter.captureMessage(message, LogLevel.WARN, {
      ...metadata,
      timestamp: new Date(),
    });
  }

  logDebug(message: string, metadata: ErrorMetadata = {}): void {
    this.monitoringAdapter.captureMessage(message, LogLevel.DEBUG, {
      ...metadata,
      timestamp: new Date(),
    });
  }

  setUserContext(userId: string | number): void {
    this.monitoringAdapter.setUser(userId);
  }

  private enrichMetadata(error: Error, metadata: ErrorMetadata): ErrorMetadata {
    return {
      ...metadata,
      timestamp: new Date(),
      stackTrace: error.stack,
      errorName: error.name,
    };
  }

  private getLogLevel(error: Error): LogLevel {
    if (!(error instanceof AppError)) {
      return LogLevel.ERROR;
    }

    const statusCode = error.statusCode;

    if (statusCode >= 500) {
      return LogLevel.ERROR;
    } else if (statusCode >= 400 && statusCode < 500) {
      return LogLevel.WARN;
    } else {
      return LogLevel.INFO;
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();
