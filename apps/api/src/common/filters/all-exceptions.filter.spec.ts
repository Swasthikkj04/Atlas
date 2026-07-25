import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({ method: 'GET', url: '/api/v1/test' }),
      }),
    };
  });

  describe('Canonical Atlas Error Response Verification', () => {
    it('should format NestJS BadRequestException into canonical error payload with string message', () => {
      const exception = new BadRequestException('Invalid UUID parameter');

      filter.catch(exception, mockHost);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          error: 'Bad Request',
          code: 'BAD_REQUEST',
          message: 'Invalid UUID parameter',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should format ValidationPipe array errors with joined message and details array', () => {
      const validationErrors = [
        'email must be an email',
        'password must be longer than or equal to 8 characters',
      ];
      const exception = new BadRequestException({
        statusCode: 400,
        message: validationErrors,
        error: 'Bad Request',
      });

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          error: 'Bad Request',
          code: 'BAD_REQUEST',
          message:
            'email must be an email; password must be longer than or equal to 8 characters',
          details: validationErrors,
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should format UnauthorizedException (401)', () => {
      const exception = new UnauthorizedException('Invalid email or password.');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password.',
        }),
      );
    });

    it('should format ForbiddenException (403)', () => {
      const exception = new ForbiddenException('Cross-tenant access denied.');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          error: 'Forbidden',
          code: 'FORBIDDEN',
          message: 'Cross-tenant access denied.',
        }),
      );
    });

    it('should format NotFoundException (404)', () => {
      const exception = new NotFoundException('Domain not found.');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          error: 'Not Found',
          code: 'NOT_FOUND',
          message: 'Domain not found.',
        }),
      );
    });

    it('should format ConflictException (409)', () => {
      const exception = new ConflictException('Email is already registered.');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          error: 'Conflict',
          code: 'CONFLICT',
          message: 'Email is already registered.',
        }),
      );
    });

    it('should format Prisma P2025 not found error safely without exposing SQL internals', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Not found',
        {
          code: 'P2025',
          clientVersion: '6.19.0',
        },
      );

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          error: 'Not Found',
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        }),
      );
    });

    it('should format Prisma P2002 conflict error safely', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '6.19.0',
        },
      );

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          error: 'Conflict',
          code: 'RESOURCE_EXISTS_CONFLICT',
          message: 'Resource with specified attributes already exists.',
        }),
      );
    });

    it('should format unexpected unhandled exceptions as 500 Internal Server Error', () => {
      const unhandledError = new Error('Database connection failed unexpectedly');

      filter.catch(unhandledError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          error: 'Internal Server Error',
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred.',
        }),
      );
    });
  });
});
