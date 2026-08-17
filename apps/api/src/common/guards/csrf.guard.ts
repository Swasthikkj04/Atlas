import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../../modules/auth/utils/csrf.util';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/resend-verification',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/google',
    '/api/v1/auth/github',
    '/api/v1/auth/csrf',
    '/api/v1/guest',
  ];

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // GET, HEAD, OPTIONS requests do not mutate state
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const path = req.path || req.url;

    // Exempt initial unauthenticated authentication requests
    if (this.exemptPaths.some((exempt) => path.startsWith(exempt))) {
      return true;
    }

    const cookieToken =
      req.cookies?.[CSRF_COOKIE_NAME] ||
      req.cookies?.nebula_csrf_token ||
      req.cookies?.csrf_token;
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException(
        'CSRF token validation failed. Invalid or missing X-CSRF-Token header.',
      );
    }

    return true;
  }
}
