import { HttpException, HttpStatus } from '@nestjs/common';

export type OAuthErrorCode =
  | 'github_email_unverified'
  | 'account_deactivated'
  | 'oauth_denied'
  | 'oauth_invalid_request'
  | 'oauth_provider_error'
  | 'oauth_authentication_failed'
  | 'oauth_session_failed';

export class OAuthAuthenticationException extends HttpException {
  constructor(
    public readonly errorCode: OAuthErrorCode,
    message?: string,
  ) {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: errorCode.toUpperCase(),
        error: 'OAuth Authentication Failed',
        message: message || `OAuth authentication failed: ${errorCode}`,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
