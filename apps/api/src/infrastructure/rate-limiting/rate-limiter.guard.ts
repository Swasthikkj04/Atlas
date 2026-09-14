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

    const path = req.originalUrl || req.url || '';
    const isAuthRoute = path.includes('/auth/');

    try {
      // Exempt internal health probes from rate limits
      if (path.includes('/health/live') || path.includes('/health/ready')) {
        return true;
      }

      // Check adaptive backpressure for heavy understand workloads
      const backpressureService =
        this.rateLimiterService.getBackpressureService();
      if (backpressureService && path.includes('understand')) {
        const tier = req.user?.tier || (req.user?.isGuest ? 'GUEST' : 'FREE');
        const category = path.includes('guest')
          ? 'GUEST_UNDERSTAND'
          : 'USER_UNDERSTAND';
        const bp = backpressureService.evaluateBackpressure(tier, category);
        if (bp.shouldThrottle) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              error: 'Too Many Requests',
              code: 'BACKPRESSURE_SATURATED',
              message: `Discovery processing capacity saturated. ${bp.reason || 'Please retry later.'}`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      const rateLimitOptions =
        this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);

      const rawForwarded = req.headers['x-forwarded-for'];
      const rawForwardedStr = Array.isArray(rawForwarded)
        ? rawForwarded[0]
        : (rawForwarded as string);
      const clientIp =
        (rawForwardedStr ? rawForwardedStr.split(',')[0].trim() : '') ||
        req.ip ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      const user = req.user;
      const tier = user?.tier || (user?.isGuest ? 'GUEST' : 'FREE');
      const userId =
        user?.id || (user?.isGuest ? `guest:${clientIp}` : `ip:${clientIp}`);
      const routeKey = rateLimitOptions?.name || req.route?.path || path;
      const rateLimitKey = `rate:${tier}:${userId}:${routeKey}`;

      let effectiveLimit = rateLimitOptions?.limit;
      let effectiveWindow = rateLimitOptions?.windowSeconds;

      if (!effectiveLimit) {
        if (tier === 'GUEST' && path.includes('guest/understand')) {
          effectiveLimit = 3;
          effectiveWindow = 3600;
        } else if (tier === 'FREE') {
          effectiveLimit = 100;
          effectiveWindow = 60;
        } else if (tier === 'PRO') {
          effectiveLimit = 1000;
          effectiveWindow = 60;
        }
      }

      const check = this.rateLimiterService.checkLimit(
        rateLimitKey,
        effectiveLimit,
        effectiveWindow,
      );

      // Classic Headers
      res.setHeader('X-Workspace-Tier', tier);
      res.setHeader('X-RateLimit-Limit', String(check.limit));
      res.setHeader('X-RateLimit-Remaining', String(check.remaining));
      res.setHeader('X-RateLimit-Reset', String(check.resetTimeSeconds));

      // IETF Headers
      res.setHeader('RateLimit-Limit', String(check.limit));
      res.setHeader('RateLimit-Remaining', String(check.remaining));
      res.setHeader('RateLimit-Reset', String(check.resetTimeSeconds));
      res.setHeader(
        'RateLimit-Policy',
        `${check.limit};w=${effectiveWindow || 60}`,
      );

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
      if (isAuthRoute) {
        // Fail-closed security for critical authentication endpoints
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            code: 'RATE_LIMIT_EXCEEDED',
            message:
              'Authentication rate limiter fail-closed security engaged due to storage unavailability.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      // Fail-open safety for standard endpoints
      this.logger.error(
        'RateLimiterGuard encountered internal error, failing open.',
        err,
      );
      return true;
    }
  }
}
