import type { CookieOptions, Request, Response } from 'express';
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
    path: '/',
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
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth/refresh' });
  clearCsrfCookie(res);
}

export function extractAccessToken(req: Request): string | undefined {
  if (req?.cookies) {
    const token =
      req.cookies[ACCESS_COOKIE_NAME] ||
      req.cookies['__Secure-nebula_access_token'] ||
      req.cookies.nebula_access_token ||
      req.cookies.access_token;
    if (token) return token;
  }
  if (req?.headers?.cookie) {
    const match =
      req.headers.cookie.match(
        /(?:^|;\s*)(?:__Secure-)?nebula_access_token=([^;]+)/,
      ) || req.headers.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

export function extractRefreshToken(req: Request): string | undefined {
  if (req?.cookies) {
    const token =
      req.cookies[REFRESH_COOKIE_NAME] ||
      req.cookies['__Host-nebula_refresh_token'] ||
      req.cookies.nebula_refresh_token ||
      req.cookies.refresh_token;
    if (token) return token;
  }
  if (req?.headers?.cookie) {
    const match =
      req.headers.cookie.match(
        /(?:^|;\s*)(?:__Host-)?nebula_refresh_token=([^;]+)/,
      ) || req.headers.cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}
