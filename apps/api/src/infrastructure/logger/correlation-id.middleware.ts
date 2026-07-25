import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext, RequestContextStore } from './request-context.store';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const inboundCorrelationId =
      req.headers['x-correlation-id'] || req.headers['correlation-id'];

    const correlationId =
      typeof inboundCorrelationId === 'string' && inboundCorrelationId.trim()
        ? inboundCorrelationId.trim()
        : `corr_${randomUUID().replace(/-/g, '')}`;

    const inboundRequestId =
      req.headers['x-request-id'] || req.headers['request-id'];

    const requestId =
      typeof inboundRequestId === 'string' && inboundRequestId.trim()
        ? inboundRequestId.trim()
        : `req_${randomUUID().replace(/-/g, '')}`;

    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);

    const context: RequestContext = {
      correlationId,
      requestId,
      startTime: Date.now(),
    };

    RequestContextStore.run(context, () => {
      next();
    });
  }
}
