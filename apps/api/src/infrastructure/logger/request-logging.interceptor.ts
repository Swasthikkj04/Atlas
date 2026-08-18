import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RequestContextStore } from './request-context.store';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) {
      return next.handle();
    }

    const startTime = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const moduleName = context.getClass().name || 'Controller';

    if (req.user && req.user.id) {
      RequestContextStore.setUserId(req.user.id);
    }

    const clientIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    this.logger.log(
      {
        event: 'request_received',
        method,
        url,
        clientIp,
        userAgent,
      },
      moduleName,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const statusCode = res.statusCode;

          this.logger.log(
            {
              event: 'response_sent',
              method,
              url,
              statusCode,
              durationMs,
            },
            moduleName,
          );
        },
        error: (err) => {
          const durationMs = Date.now() - startTime;
          const statusCode = err.status || res.statusCode || 500;

          this.logger.error(
            {
              event: 'request_error',
              method,
              url,
              statusCode,
              durationMs,
              errorMessage: err.message,
            },
            err.stack,
            moduleName,
          );
        },
      }),
    );
  }
}
