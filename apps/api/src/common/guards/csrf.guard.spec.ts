import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../../modules/auth/utils/csrf.util';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  const createMockContext = (
    method: string,
    path: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          path,
          url: path,
          cookies,
          headers,
        }),
      }),
    } as any;
  };

  it('should allow GET, HEAD, OPTIONS requests unconditionally', () => {
    const context = createMockContext('GET', '/api/v1/auth/sessions');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow exempt paths (like login/register)', () => {
    const context = createMockContext('POST', '/api/v1/auth/login');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow POST requests when CSRF header matches CSRF cookie', () => {
    const token = 'abcdef1234567890abcdef1234567890';
    const context = createMockContext(
      'POST',
      '/api/v1/auth/logout',
      { [CSRF_COOKIE_NAME]: token },
      { [CSRF_HEADER_NAME]: token },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject POST request when CSRF token is missing', () => {
    const context = createMockContext('POST', '/api/v1/auth/logout', {}, {});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should reject POST request when CSRF token mismatches', () => {
    const context = createMockContext(
      'POST',
      '/api/v1/auth/logout',
      { [CSRF_COOKIE_NAME]: 'token1' },
      { [CSRF_HEADER_NAME]: 'token2' },
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
