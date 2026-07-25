import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import { RequestContextStore } from '../../infrastructure/logger/request-context.store';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response || typeof response.status !== 'function') {
      return;
    }

    const correlationId = RequestContextStore.getCorrelationId();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected server error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        if (Array.isArray(body.message)) {
          errorMessage = body.message.join('; ');
        } else if (body.message) {
          errorMessage = String(body.message);
        } else {
          errorMessage = exception.message;
        }

        errorCode = body.error
          ? String(body.error).toUpperCase().replace(/\s+/g, '_')
          : String(HttpStatus[status] || 'HTTP_ERROR').toUpperCase().replace(/\s+/g, '_');
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        errorCode = 'RESOURCE_NOT_FOUND';
        errorMessage = 'The requested resource was not found.';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        errorCode = 'RESOURCE_EXISTS_CONFLICT';
        errorMessage = 'Resource with specified attributes already exists.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'DATABASE_VALIDATION_ERROR';
        errorMessage = 'Request violated database integrity rules.';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled Exception during request ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorPayload = {
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      code: errorCode,
      message: errorMessage,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    response.setHeader('X-Correlation-ID', correlationId);
    response.status(status).json(errorPayload);
  }
}
