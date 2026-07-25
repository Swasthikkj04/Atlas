import { BadRequestException, HttpStatus } from '@nestjs/common';
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

  describe('1. Standardized Error Payload Structure', () => {
    it('should format NestJS BadRequestException into standardized error payload', () => {
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
          error: 'BAD_REQUEST',
          code: 'BAD_REQUEST',
          message: 'Invalid UUID parameter',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });

    it('should format Prisma P2025 not found error safely without exposing SQL internals', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '6.19.0',
      });

      filter.catch(prismaError, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          error: 'NOT_FOUND',
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        }),
      );
    });
  });
});
