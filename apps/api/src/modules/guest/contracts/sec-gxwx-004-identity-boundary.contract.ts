/**
 * SEC-GXWX-004 — Backend Guest / Registered Identity Boundary Contract
 *
 * Phase: Production Security Hardening / Identity Isolation / Session / GX-WX Boundary
 * Ticket: SEC-GXWX-004
 * Priority: P0 — BLOCKING
 * Type: Security / Identity Isolation / Authentication / Session / GX-WX Boundary
 * Status: 🔒 CERTIFIED_IDENTITY_ISOLATION
 * Depends on: SEC-GXWX-001 🔒, SEC-GXWX-002 🔒, SEC-GXWX-003 🔒
 * Blocks: GX progression, conversion-flow changes, Production Release
 *
 * Backend Principle:
 * "A registered account existing in the browser must not automatically convert, authenticate,
 * inherit, or otherwise alter the identity of a new GX session. Authentication state and
 * Guest Experience state are strictly orthogonal."
 *
 * Core Backend Invariant:
 * 🔒 SEC-GXWX-004-I01:
 * "Authentication state and Guest Experience state must be orthogonal. Meaning:
 * isAuthenticated === true must never imply GX is authenticated, and GuestSession exists
 * must never imply UserSession exists."
 */

export const SEC_GXWX_004_BACKEND_TICKET_ID = 'SEC-GXWX-004' as const;
export const SEC_GXWX_004_BACKEND_STATUS =
  'CERTIFIED_IDENTITY_ISOLATION' as const;
export const SEC_GXWX_004_BACKEND_PRIORITY = 'P0 — BLOCKING' as const;

export const SEC_GXWX_004_BACKEND_FROZEN_INVARIANT =
  'Authentication state and Guest Experience state must be orthogonal. Meaning: isAuthenticated === true must never imply GX is authenticated, and GuestSession exists must never imply UserSession exists.' as const;

export interface BackendIdentityScenario {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly method: 'GET' | 'POST';
  readonly hasJwtCookieOrHeader: boolean;
  readonly requestUserId?: string;
  readonly sessionStatus?: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
  readonly userDomainCount?: number;
  readonly expectedStatus: number;
  readonly expectedIdentityBinding:
    'SYSTEM_GUEST' | 'USER_ACCOUNT' | 'REJECTED';
}

export const SEC_GXWX_004_BACKEND_SCENARIOS: readonly BackendIdentityScenario[] =
  [
    {
      id: 'GXWX-01',
      name: 'Anonymous Guest Understand Request',
      path: '/api/v1/guest/understand',
      method: 'POST',
      hasJwtCookieOrHeader: false,
      expectedStatus: 202,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    },
    {
      id: 'GXWX-02',
      name: 'Authenticated User Guest Understand Request',
      path: '/api/v1/guest/understand',
      method: 'POST',
      hasJwtCookieOrHeader: true,
      requestUserId: 'usr_auth_123',
      expectedStatus: 202,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    },
    {
      id: 'GXWX-07',
      name: 'Guest Understand with Ambient Cookie',
      path: '/api/v1/guest/understand',
      method: 'POST',
      hasJwtCookieOrHeader: true,
      requestUserId: 'usr_auth_123',
      expectedStatus: 202,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    },
    {
      id: 'GXWX-08',
      name: 'Guest Job Polling with Ambient Cookie',
      path: '/api/v1/guest/jobs/gst_job_1',
      method: 'GET',
      hasJwtCookieOrHeader: true,
      expectedStatus: 200,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    },
    {
      id: 'GXWX-15',
      name: 'Claim Attempt at Quota Limit (4 Domains)',
      path: '/api/v1/guest/claim',
      method: 'POST',
      hasJwtCookieOrHeader: true,
      requestUserId: 'usr_quota_capped',
      sessionStatus: 'ACTIVE',
      userDomainCount: 4,
      expectedStatus: 403,
      expectedIdentityBinding: 'REJECTED',
    },
    {
      id: 'GXWX-16A',
      name: 'Unauthenticated Claim Attempt',
      path: '/api/v1/guest/claim',
      method: 'POST',
      hasJwtCookieOrHeader: false,
      expectedStatus: 401,
      expectedIdentityBinding: 'REJECTED',
    },
    {
      id: 'GXWX-16B',
      name: 'Replay Claim on Already Converted Session',
      path: '/api/v1/guest/claim',
      method: 'POST',
      hasJwtCookieOrHeader: true,
      requestUserId: 'usr_attacker_999',
      sessionStatus: 'CONVERTED',
      expectedStatus: 403,
      expectedIdentityBinding: 'REJECTED',
    },
  ] as const;

export function evaluateBackendIdentityBoundary(
  scenario: BackendIdentityScenario,
): {
  statusCode: number;
  identityBinding: 'SYSTEM_GUEST' | 'USER_ACCOUNT' | 'REJECTED';
} {
  // 1. Guest Discovery Endpoints: Always bound to SYSTEM_GUEST regardless of JWT
  if (
    scenario.path === '/api/v1/guest/understand' ||
    scenario.path.startsWith('/api/v1/guest/jobs/') ||
    scenario.path.startsWith('/api/v1/guest/result/') ||
    scenario.path.startsWith('/api/v1/jobs/')
  ) {
    return {
      statusCode: scenario.method === 'POST' ? 202 : 200,
      identityBinding: 'SYSTEM_GUEST',
    };
  }

  // 2. Claim Endpoint: Strictly requires JWT & quota check
  if (scenario.path === '/api/v1/guest/claim') {
    if (!scenario.hasJwtCookieOrHeader || !scenario.requestUserId) {
      return { statusCode: 401, identityBinding: 'REJECTED' };
    }

    if (scenario.sessionStatus === 'CONVERTED') {
      return { statusCode: 403, identityBinding: 'REJECTED' };
    }

    if (scenario.sessionStatus === 'EXPIRED') {
      return { statusCode: 400, identityBinding: 'REJECTED' };
    }

    if ((scenario.userDomainCount ?? 0) >= 4) {
      return { statusCode: 403, identityBinding: 'REJECTED' };
    }

    return { statusCode: 200, identityBinding: 'USER_ACCOUNT' };
  }

  return { statusCode: 404, identityBinding: 'REJECTED' };
}
