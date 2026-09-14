import {
  SEC_GXWX_002_BACKEND_TICKET_ID,
  SEC_GXWX_002_BACKEND_STATUS,
  SEC_GXWX_002_BACKEND_FROZEN_PRINCIPLE,
  SEC_GXWX_002_BACKEND_DEMONSTRATED_TRUTH,
  ENDPOINT_SECURITY_BOUNDARIES,
  evaluateBackendAccess,
} from './sec-gxwx-002-context-separation.contract';

describe('SEC-GXWX-002 — Backend Guest / Workspace Context Separation Contract', () => {
  it('enforces backend ticket metadata and demonstrated truth', () => {
    expect(SEC_GXWX_002_BACKEND_TICKET_ID).toBe('SEC-GXWX-002');
    expect(SEC_GXWX_002_BACKEND_STATUS).toBe('CERTIFIED_CONTEXT_SEPARATION');
    expect(SEC_GXWX_002_BACKEND_FROZEN_PRINCIPLE).toContain(
      'Authentication may permit Workspace access',
    );
    expect(SEC_GXWX_002_BACKEND_FROZEN_PRINCIPLE).toContain(
      'Authentication must never redefine Guest Experience',
    );
    expect(SEC_GXWX_002_BACKEND_DEMONSTRATED_TRUTH).toContain(
      'never changes the security or product plane',
    );
  });

  it('guarantees guest public endpoints operate ephemerally without requiring JWT', () => {
    const guestUnderstand = ENDPOINT_SECURITY_BOUNDARIES.find(
      (b) => b.path === '/api/v1/guest/understand',
    );
    expect(guestUnderstand).toBeDefined();
    expect(guestUnderstand?.requiresJwtAuth).toBe(false);
    expect(guestUnderstand?.category).toBe('GUEST_PUBLIC');
    expect(guestUnderstand?.requiresRateLimit).toBe(true);

    const guestJob = ENDPOINT_SECURITY_BOUNDARIES.find(
      (b) => b.path === '/api/v1/guest/jobs/:jobId',
    );
    expect(guestJob).toBeDefined();
    expect(guestJob?.requiresJwtAuth).toBe(false);

    const guestResult = ENDPOINT_SECURITY_BOUNDARIES.find(
      (b) => b.path === '/api/v1/guest/result/:jobId',
    );
    expect(guestResult).toBeDefined();
    expect(guestResult?.requiresJwtAuth).toBe(false);
  });

  it('guarantees workspace endpoints strictly require JwtAuthGuard and enforce tenant isolation', () => {
    const protectedPaths = [
      '/api/v1/domains',
      '/api/v1/workspace/overview',
      '/api/v1/findings',
      '/api/v1/timeline',
    ];

    for (const path of protectedPaths) {
      const boundary = ENDPOINT_SECURITY_BOUNDARIES.find(
        (b) => b.path === path,
      );
      expect(boundary).toBeDefined();
      expect(boundary?.requiresJwtAuth).toBe(true);
      expect(boundary?.category).toBe('WORKSPACE_PROTECTED');
      expect(boundary?.enforcesTenantIsolation).toBe(true);
    }
  });

  it('guarantees guest claim endpoint requires valid JWT authentication and atomic user ownership', () => {
    const claimBoundary = ENDPOINT_SECURITY_BOUNDARIES.find(
      (b) => b.path === '/api/v1/guest/claim',
    );
    expect(claimBoundary).toBeDefined();
    expect(claimBoundary?.requiresJwtAuth).toBe(true);
    expect(claimBoundary?.category).toBe('CLAIM_PROTECTED');
    expect(claimBoundary?.enforcesTenantIsolation).toBe(true);
  });

  it('evaluates access decisions across anonymous and authenticated scenarios', () => {
    // 1. Anonymous calling guest endpoint -> ALLOWED
    expect(
      evaluateBackendAccess('/api/v1/guest/understand', 'POST', false),
    ).toBe('ALLOWED');

    // 2. Anonymous calling workspace domains -> DENIED_401
    expect(evaluateBackendAccess('/api/v1/domains', 'GET', false)).toBe(
      'DENIED_401',
    );

    // 3. Authenticated user calling workspace domains -> ALLOWED
    expect(
      evaluateBackendAccess('/api/v1/domains', 'GET', true, 'usr-1', 'usr-1'),
    ).toBe('ALLOWED');

    // 4. Cross-tenant domain access attempt -> DENIED_404 (multi-tenant invisible isolation)
    expect(
      evaluateBackendAccess(
        '/api/v1/domains',
        'GET',
        true,
        'usr-attacker',
        'usr-victim',
      ),
    ).toBe('DENIED_404');

    // 5. Unauthenticated claim attempt -> DENIED_401
    expect(evaluateBackendAccess('/api/v1/guest/claim', 'POST', false)).toBe(
      'DENIED_401',
    );

    // 6. Authenticated claim attempt -> ALLOWED
    expect(
      evaluateBackendAccess('/api/v1/guest/claim', 'POST', true, 'usr-1'),
    ).toBe('ALLOWED');
  });
});
