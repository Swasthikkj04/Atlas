import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContextStore } from './request-context.store';
import { redactSensitiveData } from './sensitive-data.redactor';

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

@Injectable()
export class StructuredLoggerService implements LoggerService {
  formatLog(
    level: LogLevel,
    message: any,
    context?: string,
    extraFields?: Record<string, any>,
  ): string {
    const ctx = RequestContextStore.getContext();
    const timestamp = new Date().toISOString();

    const sanitizedMsg =
      typeof message === 'object'
        ? redactSensitiveData(message)
        : String(message);

    const logEntry: Record<string, any> = {
      timestamp,
      level,
      service: 'atlas-api',
      module: context || 'Application',
      message: sanitizedMsg,
      correlationId: ctx?.correlationId || extraFields?.correlationId || 'corr_system',
      requestId: ctx?.requestId || extraFields?.requestId || 'req_system',
    };

    if (ctx?.userId || extraFields?.userId) {
      logEntry.userId = ctx?.userId || extraFields?.userId;
    }
    if (ctx?.domainId || extraFields?.domainId) {
      logEntry.domainId = ctx?.domainId || extraFields?.domainId;
    }
    if (ctx?.jobId || extraFields?.jobId) {
      logEntry.jobId = ctx?.jobId || extraFields?.jobId;
    }
    if (extraFields?.durationMs !== undefined) {
      logEntry.durationMs = extraFields.durationMs;
    }

    return JSON.stringify(logEntry);
  }

  log(message: any, context?: string) {
    process.stdout.write(this.formatLog('INFO', message, context) + '\n');
  }

  error(message: any, trace?: string, context?: string) {
    const jsonStr = this.formatLog('ERROR', message, context);
    const entry = JSON.parse(jsonStr);
    if (trace) {
      entry.stackTrace = trace;
    }
    process.stderr.write(JSON.stringify(entry) + '\n');
  }

  warn(message: any, context?: string) {
    process.stdout.write(this.formatLog('WARN', message, context) + '\n');
  }

  debug(message: any, context?: string) {
    process.stdout.write(this.formatLog('DEBUG', message, context) + '\n');
  }

  verbose(message: any, context?: string) {
    process.stdout.write(this.formatLog('TRACE', message, context) + '\n');
  }
}
