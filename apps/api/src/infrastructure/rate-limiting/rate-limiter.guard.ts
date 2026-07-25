import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

import { RequestContextStore } from '../logger/request-context.store';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { MetricsService } from '../metrics/metrics.service';

import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
    private readonly structuredLogger: StructuredLoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse<Response>();

    if (!req || !res) {
      return true;
    }

    try {
      const path = req.originalUrl || req.url || '';
      // Exempt internal health probes from rate limits
      if (path.includes('/health/live') || path.includes('/health/ready')) {
        return true;
      }

      const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
        RATE_LIMIT_KEY,
        [context.getHandler(), context.getClass()],
      );

      const clientIp =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      const userId = req.user?.id || 'anon';
      const routeKey = rateLimitOptions?.name || req.route?.path || path;
      const rateLimitKey = `rate:${clientIp}:${userId}:${routeKey}`;

      const check = this.rateLimiterService.checkLimit(
        rateLimitKey,
        rateLimitOptions?.limit,
        rateLimitOptions?.windowSeconds,
      );

      res.setHeader('X-RateLimit-Limit', String(check.limit));
      res.setHeader('X-RateLimit-Remaining', String(check.remaining));
      res.setHeader('X-RateLimit-Reset', String(check.resetTimeSeconds));

      if (check.isBlocked) {
        res.setHeader('Retry-After', String(check.retryAfterSeconds));

        const correlationId = RequestContextStore.getCorrelationId();
        this.structuredLogger.warn(
          {
            event: 'rate_limit_exceeded',
            clientIp,
            userId,
            route: routeKey,
            limit: check.limit,
            retryAfterSeconds: check.retryAfterSeconds,
          },
          context.getClass().name,
        );

        this.metricsService.recordExplorerRequest('RATE_LIMIT_BLOCK', 0.001);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Request limit exceeded (${check.limit} req / window). Please retry after ${check.retryAfterSeconds} seconds.`,
            correlationId,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      // Fail-open safety
      this.logger.error('RateLimiterGuard encountered internal error, failing open.', err);
      return true;
    }
  }
}
