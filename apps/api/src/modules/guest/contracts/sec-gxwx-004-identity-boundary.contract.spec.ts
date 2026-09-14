import {
  SEC_GXWX_004_BACKEND_TICKET_ID,
  SEC_GXWX_004_BACKEND_STATUS,
  SEC_GXWX_004_BACKEND_PRIORITY,
  SEC_GXWX_004_BACKEND_FROZEN_INVARIANT,
  SEC_GXWX_004_BACKEND_SCENARIOS,
  evaluateBackendIdentityBoundary,
} from './sec-gxwx-004-identity-boundary.contract';

describe('SEC-GXWX-004 — Backend Guest / Registered Identity Boundary Contract', () => {
  it('enforces backend ticket metadata and frozen invariant', () => {
    expect(SEC_GXWX_004_BACKEND_TICKET_ID).toBe('SEC-GXWX-004');
    expect(SEC_GXWX_004_BACKEND_STATUS).toBe('CERTIFIED_IDENTITY_ISOLATION');
    expect(SEC_GXWX_004_BACKEND_PRIORITY).toBe('P0 — BLOCKING');
    expect(SEC_GXWX_004_BACKEND_FROZEN_INVARIANT).toContain(
      'Authentication state and Guest Experience state must be orthogonal',
    );
  });

  it('guarantees guest discovery requests are always bound to SYSTEM_GUEST regardless of ambient JWT', () => {
    const anonEval = evaluateBackendIdentityBoundary({
      id: 'GXWX-01',
      name: 'Anonymous Guest Understand Request',
      path: '/api/v1/guest/understand',
      method: 'POST',
      hasJwtCookieOrHeader: false,
      expectedStatus: 202,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    });
    expect(anonEval.statusCode).toBe(202);
    expect(anonEval.identityBinding).toBe('SYSTEM_GUEST');

    const authEval = evaluateBackendIdentityBoundary({
      id: 'GXWX-02',
      name: 'Authenticated User Guest Understand Request',
      path: '/api/v1/guest/understand',
      method: 'POST',
      hasJwtCookieOrHeader: true,
      requestUserId: 'usr_authenticated_user',
      expectedStatus: 202,
      expectedIdentityBinding: 'SYSTEM_GUEST',
    });
    expect(authEval.statusCode).toBe(202);
    expect(authEval.identityBinding).toBe('SYSTEM_GUEST');
  });

  it('evaluates all backend identity scenarios consistently', () => {
    expect(SEC_GXWX_004_BACKEND_SCENARIOS.length).toBeGreaterThanOrEqual(7);

    for (const scenario of SEC_GXWX_004_BACKEND_SCENARIOS) {
      const result = evaluateBackendIdentityBoundary(scenario);
      expect(result.statusCode).toBe(scenario.expectedStatus);
      expect(result.identityBinding).toBe(scenario.expectedIdentityBinding);
    }
  });
});
