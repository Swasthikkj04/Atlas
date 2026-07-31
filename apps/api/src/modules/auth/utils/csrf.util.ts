import crypto from 'crypto';
import type { CookieOptions, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const CSRF_COOKIE_NAME = isProduction
  ? '__Secure-nebula_csrf_token'
  : 'nebula_csrf_token';

export const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token?: string): string {
  const csrfToken = token || generateCsrfToken();
  const options: CookieOptions = {
    httpOnly: false, // Accessible by frontend JS to attach in X-CSRF-Token header
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  res.cookie(CSRF_COOKIE_NAME, csrfToken, options);
  return csrfToken;
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}
