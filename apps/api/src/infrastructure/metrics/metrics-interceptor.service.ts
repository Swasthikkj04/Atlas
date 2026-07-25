import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (!req) {
      return next.handle();
    }

    const t0 = Date.now();
    const method = req.method;
    const route = req.route?.path || req.originalUrl || req.url;

    this.metricsService.incActiveRequests();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationSec = (Date.now() - t0) / 1000;
          const statusCode = res.statusCode || 200;
          this.metricsService.recordHttpRequest(
            method,
            route,
            statusCode,
            durationSec,
          );
          this.metricsService.decActiveRequests();
        },
        error: (err) => {
          const durationSec = (Date.now() - t0) / 1000;
          const statusCode = err.status || res.statusCode || 500;
          this.metricsService.recordHttpRequest(
            method,
            route,
            statusCode,
            durationSec,
          );
          this.metricsService.decActiveRequests();
        },
      }),
    );
  }
}
