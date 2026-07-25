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
import { ApiErrorResponseDto } from '../dto/api-error-response.dto';

const HTTP_STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

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
    const requestId = RequestContextStore.getRequestId();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected server error occurred.';
    let errorDetails: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;

        if (body.code && typeof body.code === 'string') {
          errorCode = body.code;
        } else if (body.error && typeof body.error === 'string') {
          errorCode = body.error.toUpperCase().replace(/\s+/g, '_');
        } else {
          const statusName = HTTP_STATUS_NAMES[status] || 'HTTP_ERROR';
          errorCode = statusName.toUpperCase().replace(/\s+/g, '_');
        }

        if (Array.isArray(body.message)) {
          errorMessage = body.message.join('; ');
          errorDetails = body.message;
        } else if (body.message) {
          errorMessage = String(body.message);
        } else {
          errorMessage = exception.message;
        }

        if (body.details) {
          errorDetails = body.details;
        }
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

    const errorPhrase =
      HTTP_STATUS_NAMES[status] ||
      (exception instanceof HttpException ? exception.name : 'Error');

    const errorPayload: ApiErrorResponseDto = {
      statusCode: status,
      error: errorPhrase,
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    response.setHeader('X-Correlation-ID', correlationId);
    response.setHeader('X-Request-ID', requestId);
    response.status(status).json(errorPayload);
  }
}
