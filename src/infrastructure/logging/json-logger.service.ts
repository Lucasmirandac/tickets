import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

type JsonLogLevel = Exclude<LogLevel, 'verbose'>;

type JsonLogPayload = {
  readonly level: JsonLogLevel;
  readonly message: string;
  readonly context?: string;
  readonly timestamp: string;
  readonly trace?: string;
};

@Injectable()
export class JsonLoggerService implements LoggerService {
  private readonly levels: readonly JsonLogLevel[] = ['log', 'debug', 'warn', 'error'];

  log(message: string, context?: string): void {
    this.writeLog('log', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.writeLog('error', message, context, trace);
  }

  warn(message: string, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug(message: string, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.writeLog('debug', message, context);
    }
  }

  setLogLevels(levels: LogLevel[]): void {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    const allowed = new Set<JsonLogLevel>(levels as JsonLogLevel[]);
    (this.levels as JsonLogLevel[]).forEach((level) => {
      if (!allowed.has(level)) {
        return;
      }
    });
  }

  private writeLog(level: JsonLogLevel, message: string, context?: string, trace?: string): void {
    const payload: JsonLogPayload = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      trace,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
  }
}

