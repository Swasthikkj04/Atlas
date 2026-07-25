import { ConfigService } from '@nestjs/config';
import { SecurityHeadersMiddleware } from './security-headers.middleware';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('production'),
    } as any;

    middleware = new SecurityHeadersMiddleware(mockConfigService);

    mockRequest = {
      path: '/api/v1/domains',
      baseUrl: '/api/v1/domains',
      secure: true,
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should remove X-Powered-By header', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set Strict-Transport-Security (HSTS) on secure requests or production', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  });

  it('should set anti-clickjacking X-Frame-Options: DENY', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY',
    );
  });

  it('should set X-Content-Type-Options: nosniff', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
  });

  it('should set Referrer-Policy: strict-origin-when-cross-origin', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
  });

  it('should set Permissions-Policy restricting unused browser features', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('camera=()'),
    );
  });

  it('should call next() function', () => {
    middleware.use(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
