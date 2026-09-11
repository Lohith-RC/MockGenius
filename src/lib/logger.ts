/**
 * InterviewAI - Enterprise Structured JSON Logger
 * Ponytail coding: Zero external dependencies, pure stdlib.
 * Outputs machine-readable JSON in production and human-friendly colored text in development.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const IS_PROD = process.env.NODE_ENV === 'production';
const currentLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'] ?? LOG_LEVELS.info;

export interface LogContext {
  requestId?: string;
  userId?: string;
  status?: number;
  duration?: string;
  ip?: string;
  [key: string]: any;
}

function serializeError(err: any) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: IS_PROD ? undefined : err.stack
    };
  }
  return err;
}

function formatLog(level: LogLevel, message: string, meta?: LogContext) {
  const timestamp = new Date().toISOString();

  if (IS_PROD) {
    const payload: Record<string, any> = {
      timestamp,
      level,
      message,
      ...meta
    };
    if (meta?.error) {
      payload.error = serializeError(meta.error);
    }
    return JSON.stringify(payload);
  }

  // Development colored output
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m'  // Red
  };
  const reset = '\x1b[0m';
  const color = colors[level] || reset;
  const reqStr = meta?.requestId ? ` [${meta.requestId.slice(0, 8)}]` : '';
  const metaStr = meta && Object.keys(meta).length > (meta.requestId ? 1 : 0)
    ? ` ${JSON.stringify(meta)}`
    : '';

  return `${color}[${timestamp}] [${level.toUpperCase()}]${reset}${reqStr} ${message}${metaStr}`;
}

export function createLogger(defaultContext?: LogContext) {
  return {
    debug(message: string, context?: LogContext) {
      if (currentLevel <= LOG_LEVELS.debug) {
        console.debug(formatLog('debug', message, { ...defaultContext, ...context }));
      }
    },

    info(message: string, context?: LogContext) {
      if (currentLevel <= LOG_LEVELS.info) {
        console.info(formatLog('info', message, { ...defaultContext, ...context }));
      }
    },

    warn(message: string, context?: LogContext) {
      if (currentLevel <= LOG_LEVELS.warn) {
        console.warn(formatLog('warn', message, { ...defaultContext, ...context }));
      }
    },

    error(message: string, errorOrContext?: any) {
      if (currentLevel <= LOG_LEVELS.error) {
        const meta = errorOrContext instanceof Error
          ? { error: errorOrContext, ...defaultContext }
          : { ...defaultContext, ...errorOrContext };
        console.error(formatLog('error', message, meta));
      }
    },

    child(context: LogContext) {
      return createLogger({ ...defaultContext, ...context });
    }
  };
}

export const logger = createLogger();