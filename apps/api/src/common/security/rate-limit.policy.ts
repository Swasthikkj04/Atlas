/**
 * S-07 Rate Limiting Policy Architecture
 *
 * Implements S07-I01, S07-I02, S07-I03:
 * - Server-enforced rate limits
 * - Identity-aware principal classification (ANONYMOUS, GUEST, USER, ADMIN)
 * - Endpoint-specific policy tiers and quotas
 */

export type SecurityPrincipalType = 'ANONYMOUS' | 'GUEST' | 'USER' | 'ADMIN';

export type EndpointCategory =
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'AUTH_REFRESH'
  | 'AUTH_OAUTH'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_VERIFY_EMAIL'
  | 'GUEST_UNDERSTAND'
  | 'GUEST_READ'
  | 'USER_UNDERSTAND'
  | 'USER_DOMAIN_CRUD'
  | 'USER_READ_ONLY'
  | 'ADMIN_OPERATIONS'
  | 'PUBLIC_DEFAULT';

export interface RateLimitPolicyConfig {
  name: string;
  category: EndpointCategory;
  limit: number;
  windowSeconds: number;
  burstAllowance?: number;
  principalType: SecurityPrincipalType;
  requiresStrictFailClosed?: boolean;
}

export interface RateLimitPolicyDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeSeconds: number;
  retryAfterSeconds: number;
  category: EndpointCategory;
  principalType: SecurityPrincipalType;
  decision:
    | 'ALLOWED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'CONCURRENCY_EXCEEDED'
    | 'QUOTA_EXCEEDED'
    | 'FAIL_CLOSED_BLOCKED';
}

/**
 * Authoritative endpoint rate limit policies.
 */
export const CANONICAL_RATE_LIMIT_POLICIES: Record<
  EndpointCategory,
  RateLimitPolicyConfig
> = {
  AUTH_LOGIN: {
    name: 'auth-login-policy',
    category: 'AUTH_LOGIN',
    limit: 5, // 5 attempts per minute
    windowSeconds: 60,
    burstAllowance: 2,
    principalType: 'ANONYMOUS',
    requiresStrictFailClosed: true,
  },
  AUTH_REGISTER: {
    name: 'auth-register-policy',
    category: 'AUTH_REGISTER',
    limit: 3, // 3 registrations per minute per IP
    windowSeconds: 60,
    burstAllowance: 1,
    principalType: 'ANONYMOUS',
    requiresStrictFailClosed: true,
  },
  AUTH_REFRESH: {
    name: 'auth-refresh-policy',
    category: 'AUTH_REFRESH',
    limit: 30, // 30 refresh calls per minute per session
    windowSeconds: 60,
    principalType: 'USER',
    requiresStrictFailClosed: true,
  },
  AUTH_OAUTH: {
    name: 'auth-oauth-policy',
    category: 'AUTH_OAUTH',
    limit: 10, // 10 OAuth initiations per minute
    windowSeconds: 60,
    principalType: 'ANONYMOUS',
    requiresStrictFailClosed: true,
  },
  AUTH_PASSWORD_RESET: {
    name: 'auth-password-reset-policy',
    category: 'AUTH_PASSWORD_RESET',
    limit: 3, // 3 reset requests per 15 min
    windowSeconds: 900,
    principalType: 'ANONYMOUS',
    requiresStrictFailClosed: true,
  },
  AUTH_VERIFY_EMAIL: {
    name: 'auth-verify-email-policy',
    category: 'AUTH_VERIFY_EMAIL',
    limit: 5, // 5 verification attempts per 10 min
    windowSeconds: 600,
    principalType: 'ANONYMOUS',
    requiresStrictFailClosed: true,
  },
  GUEST_UNDERSTAND: {
    name: 'guest-understand-policy',
    category: 'GUEST_UNDERSTAND',
    limit: 3, // 3 understanding runs per hour
    windowSeconds: 3600,
    principalType: 'GUEST',
    requiresStrictFailClosed: true,
  },
  GUEST_READ: {
    name: 'guest-read-policy',
    category: 'GUEST_READ',
    limit: 60, // 60 requests per minute
    windowSeconds: 60,
    principalType: 'GUEST',
  },
  USER_UNDERSTAND: {
    name: 'user-understand-policy',
    category: 'USER_UNDERSTAND',
    limit: 30, // 30 runs per hour
    windowSeconds: 3600,
    principalType: 'USER',
    requiresStrictFailClosed: true,
  },
  USER_DOMAIN_CRUD: {
    name: 'user-domain-crud-policy',
    category: 'USER_DOMAIN_CRUD',
    limit: 60, // 60 CRUD requests per minute
    windowSeconds: 60,
    principalType: 'USER',
  },
  USER_READ_ONLY: {
    name: 'user-read-only-policy',
    category: 'USER_READ_ONLY',
    limit: 240, // 240 read requests per minute
    windowSeconds: 60,
    principalType: 'USER',
  },
  ADMIN_OPERATIONS: {
    name: 'admin-operations-policy',
    category: 'ADMIN_OPERATIONS',
    limit: 120, // 120 admin operations per minute
    windowSeconds: 60,
    principalType: 'ADMIN',
    requiresStrictFailClosed: true,
  },
  PUBLIC_DEFAULT: {
    name: 'public-default-policy',
    category: 'PUBLIC_DEFAULT',
    limit: 120, // 120 requests per minute
    windowSeconds: 60,
    principalType: 'ANONYMOUS',
  },
};

/**
 * Resolves the endpoint policy category based on HTTP method, path, and security plane.
 */
export function resolveEndpointCategory(
  method: string,
  path: string,
  principal: SecurityPrincipalType,
): EndpointCategory {
  const normPath = path.toLowerCase().split('?')[0];
  const normMethod = method.toUpperCase();

  if (normPath.startsWith('/api/v1/admin')) {
    return 'ADMIN_OPERATIONS';
  }

  if (normPath.includes('/auth/login')) return 'AUTH_LOGIN';
  if (normPath.includes('/auth/register')) return 'AUTH_REGISTER';
  if (normPath.includes('/auth/refresh')) return 'AUTH_REFRESH';
  if (normPath.includes('/auth/google') || normPath.includes('/auth/github'))
    return 'AUTH_OAUTH';
  if (
    normPath.includes('/auth/forgot-password') ||
    normPath.includes('/auth/reset-password')
  )
    return 'AUTH_PASSWORD_RESET';
  if (normPath.includes('/auth/verify-email')) return 'AUTH_VERIFY_EMAIL';

  if (normPath.includes('/guest/understand')) return 'GUEST_UNDERSTAND';
  if (normPath.startsWith('/api/v1/guest')) return 'GUEST_READ';

  if (normPath.includes('/understand') || normPath.includes('/jobs')) {
    return principal === 'GUEST' ? 'GUEST_UNDERSTAND' : 'USER_UNDERSTAND';
  }

  if (
    normPath.startsWith('/api/v1/domains') ||
    normPath.startsWith('/api/v1/workspace')
  ) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(normMethod)) {
      return 'USER_DOMAIN_CRUD';
    }
    return 'USER_READ_ONLY';
  }

  return 'PUBLIC_DEFAULT';
}
