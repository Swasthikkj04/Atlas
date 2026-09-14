import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  OAuthAuthenticationException,
  OAuthErrorCode,
} from '../exceptions/oauth.exception';

@Catch()
export class OAuthCallbackExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthCallbackExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const query = (request.query || {}) as Record<string, string | undefined>;
    const path = request.path || request.url || '';
    const isGithub = path.includes('github');
    const isGoogle = path.includes('google');
    const provider = isGithub ? 'GITHUB' : isGoogle ? 'GOOGLE' : 'OAUTH';

    let errorCode: OAuthErrorCode = 'oauth_authentication_failed';

    // 1. Direct typed OAuthAuthenticationException
    if (exception instanceof OAuthAuthenticationException) {
      errorCode = exception.errorCode;
    }
    // 2. Query param OAuth errors from external provider (e.g. user cancelled or denied scope)
    else if (
      query.error === 'access_denied' ||
      query.error === 'user_cancelled_authorize' ||
      query.error === 'consent_required' ||
      (typeof query.error_description === 'string' &&
        query.error_description.toLowerCase().includes('denied'))
    ) {
      errorCode = 'oauth_denied';
    } else if (
      query.error === 'invalid_request' ||
      query.error === 'unauthorized_client' ||
      query.error === 'invalid_scope'
    ) {
      errorCode = 'oauth_invalid_request';
    } else if (query.error) {
      errorCode = 'oauth_provider_error';
    }
    // 3. Inspect HttpExceptions or strategy rejection messages
    else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const msg =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && res !== null && (res as any).message
            ? String((res as any).message)
            : exception.message;

      const lower = msg.toLowerCase();
      if (lower.includes('deactivated')) {
        errorCode = 'account_deactivated';
      } else if (
        lower.includes('verified email') ||
        lower.includes('email_unverified') ||
        lower.includes('unverified email')
      ) {
        errorCode = 'github_email_unverified';
      } else if (
        lower.includes('denied') ||
        lower.includes('cancelled') ||
        lower.includes('canceled')
      ) {
        errorCode = 'oauth_denied';
      } else if (lower.includes('invalid') || lower.includes('missing')) {
        errorCode = 'oauth_invalid_request';
      } else if (lower.includes('session')) {
        errorCode = 'oauth_session_failed';
      } else {
        errorCode = 'oauth_provider_error';
      }
    }
    // 4. Inspect standard Error messages
    else if (exception instanceof Error) {
      const lower = exception.message.toLowerCase();
      if (lower.includes('deactivated')) {
        errorCode = 'account_deactivated';
      } else if (
        lower.includes('verified email') ||
        lower.includes('unverified')
      ) {
        errorCode = 'github_email_unverified';
      } else if (lower.includes('denied') || lower.includes('cancelled')) {
        errorCode = 'oauth_denied';
      } else {
        errorCode = 'oauth_provider_error';
      }
    }

    this.logger.warn(
      `[OAuthFailure] Provider=${provider} ErrorCode=${errorCode} Path=${path}`,
    );

    const userEmail =
      (request.user as any)?.email ||
      (request.user as any)?._json?.email ||
      (request.user as any)?.emails?.[0]?.value ||
      query.email;
    const emailParam =
      errorCode === 'account_deactivated' && userEmail
        ? `&email=${encodeURIComponent(userEmail)}`
        : '';

    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      (isProduction ? 'https://nebula.argonion.com' : 'http://localhost:5173');
    return response.redirect(
      `${frontendUrl}/auth/callback?error=${errorCode}${emailParam}`,
    );
  }
}
