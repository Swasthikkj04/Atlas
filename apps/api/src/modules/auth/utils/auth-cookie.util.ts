import type { CookieOptions, Response } from 'express';
import { clearCsrfCookie, setCsrfCookie } from './csrf.util';

const isProduction = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE_NAME = isProduction
  ? '__Secure-nebula_access_token'
  : 'nebula_access_token';

export const REFRESH_COOKIE_NAME = isProduction
  ? '__Host-nebula_refresh_token'
  : 'nebula_refresh_token';

export function getAccessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  };
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  setCsrfCookie(res);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth/refresh' });
  clearCsrfCookie(res);
}
