import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { OAuthCallbackExceptionFilter } from './oauth-callback-exception.filter';
import { OAuthAuthenticationException } from '../exceptions/oauth.exception';

describe('OAuthCallbackExceptionFilter (AX-113)', () => {
  let filter: OAuthCallbackExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new OAuthCallbackExceptionFilter();
    mockResponse = {
      redirect: jest.fn(),
    };
    mockRequest = {
      path: '/api/v1/auth/google/callback',
      url: '/api/v1/auth/google/callback',
      query: {},
      user: {
        email: 'alex@example.com',
      },
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('redirects to /auth/callback?error=account_deactivated with email when account is deactivated', () => {
    const exception = new OAuthAuthenticationException(
      'account_deactivated',
      'Your Nebula account is currently deactivated.',
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining(
        '/auth/callback?error=account_deactivated&email=alex%40example.com',
      ),
    );
  });

  it('extracts account_deactivated code from generic HttpException mentioning deactivated', () => {
    const exception = new HttpException(
      'Your account is deactivated',
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining(
        '/auth/callback?error=account_deactivated&email=alex%40example.com',
      ),
    );
  });

  it('redirects to /auth/callback?error=github_email_unverified when github email is unverified', () => {
    mockRequest.path = '/api/v1/auth/github/callback';
    const exception = new OAuthAuthenticationException(
      'github_email_unverified',
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/callback?error=github_email_unverified'),
    );
  });

  it('redirects to /auth/callback?error=oauth_denied when user cancels authentication', () => {
    mockRequest.query = { error: 'access_denied' };

    filter.catch(new Error('User denied access'), mockHost);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/callback?error=oauth_denied'),
    );
  });

  it('redirects to /auth/callback?error=oauth_provider_error for unknown exceptions without leaking error strings', () => {
    const exception = new Error(
      'Database connection failed on external cluster',
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/callback?error=oauth_provider_error'),
    );
  });
});
