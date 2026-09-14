import {
  S01_TICKET_ID,
  S01_PHASE,
  S01_PRIORITY,
  S01_STATUS,
  S01_PRINCIPLES,
  S01_INVARIANTS,
  evaluateResourceOwnership,
  evaluatePlaneAccess,
  verifyS01Certification,
  S01_CERTIFICATION_STATEMENT,
  CanonicalSecurityContext,
} from './s-01-security-boundary.contract';

describe('S-01 — Global Security Boundary Foundation API Contract', () => {
  describe('1. Principles & Hard Invariants', () => {
    it('enforces frozen ticket metadata and P0 priority', () => {
      expect(S01_TICKET_ID).toBe('S-01');
      expect(S01_PHASE).toBe('Production Security Hardening');
      expect(S01_PRIORITY).toBe('P0 — BLOCKING');
      expect(S01_STATUS).toBe('CERTIFIED_GLOBAL_SECURITY_BOUNDARY');
    });

    it('enforces all 4 frozen security principles', () => {
      expect(S01_PRINCIPLES.S01_P01_AUTHN_NEQ_AUTHZ).toContain(
        'Authentication != Authorization',
      );
      expect(S01_PRINCIPLES.S01_P02_FRONTEND_NOT_BOUNDARY).toContain(
        'Frontend Is Never the Security Boundary',
      );
      expect(S01_PRINCIPLES.S01_P03_SECURITY_PLANE_ISOLATION).toContain(
        'Security Plane Isolation',
      );
      expect(S01_PRINCIPLES.S01_P04_FAIL_CLOSED).toContain('Fail Closed');
    });

    it('enforces all 8 hard security invariants (S01-I01 through S01-I08)', () => {
      expect(S01_INVARIANTS.S01_I01).toBe(
        'A valid credential does not imply universal authorization.',
      );
      expect(S01_INVARIANTS.S01_I02).toBe(
        'Frontend navigation cannot grant authorization.',
      );
      expect(S01_INVARIANTS.S01_I03).toBe('GX cannot implicitly enter WX.');
      expect(S01_INVARIANTS.S01_I04).toBe('WX cannot implicitly enter ADMIN.');
      expect(S01_INVARIANTS.S01_I05).toBe(
        'Resource identifiers never establish ownership.',
      );
      expect(S01_INVARIANTS.S01_I06).toBe(
        'Every protected resource has an authorization decision.',
      );
      expect(S01_INVARIANTS.S01_I07).toBe(
        'Authorization failure always fails closed.',
      );
      expect(S01_INVARIANTS.S01_I08).toBe(
        'Security-plane crossover requires an explicit authorized contract.',
      );
    });
  });

  describe('2. Resource Ownership Validation Chain', () => {
    it('allows access when caller is verified owner', () => {
      const res = evaluateResourceOwnership('usr-1', {
        resourceType: 'FINDING',
        resourceId: 'fnd-100',
        ownerUserId: 'usr-1',
      });
      expect(res.authorized).toBe(true);
      expect(res.httpStatus).toBe(200);
    });

    it('denies access with 404 (Fail-Closed, zero leakage) when cross-tenant mismatch', () => {
      const res = evaluateResourceOwnership('usr-1', {
        resourceType: 'FINDING',
        resourceId: 'fnd-100',
        ownerUserId: 'usr-2',
      });
      expect(res.authorized).toBe(false);
      expect(res.httpStatus).toBe(404);
    });

    it('denies access with 401 when caller is unauthenticated', () => {
      const res = evaluateResourceOwnership(undefined, {
        resourceType: 'FINDING',
        resourceId: 'fnd-100',
        ownerUserId: 'usr-1',
      });
      expect(res.authorized).toBe(false);
      expect(res.httpStatus).toBe(401);
    });
  });

  describe('3. Cross-Plane & Boundary Access Evaluation', () => {
    it('denies Guest Session from accessing WX (401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'GUEST', id: 'gst-1', authenticated: false },
        plane: 'WX',
        session: { state: 'ACTIVE', revoked: false, tokenType: 'guest-token' },
        authorization: {
          resource: 'dom-1',
          action: 'READ',
          requiredPlane: 'WX',
        },
      };
      const res = evaluatePlaneAccess(ctx);
      expect(res.decision).toBe('DENY');
      expect(res.httpStatus).toBe(401);
    });

    it('denies User JWT from accessing Admin Plane (403)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-1', authenticated: true },
        plane: 'ADMIN',
        session: {
          state: 'ACTIVE',
          revoked: false,
          issuer: 'nebula-auth',
          tokenType: 'user-access',
        },
        authorization: {
          resource: '/api/v1/admin/audit',
          action: 'READ',
          requiredPlane: 'ADMIN',
        },
      };
      const res = evaluatePlaneAccess(ctx);
      expect(res.decision).toBe('DENY');
      expect(res.httpStatus).toBe(403);
    });

    it('allows Admin Identity with AAL3 to access Admin Plane (200)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: {
          type: 'ADMIN',
          id: 'adm-1',
          adminRole: 'PLATFORM_ADMIN',
          authenticated: true,
        },
        plane: 'ADMIN',
        session: {
          state: 'ACTIVE',
          revoked: false,
          issuer: 'nebula-admin-auth',
          tokenType: 'admin-access',
          aal: 'AAL3',
        },
        authorization: {
          resource: '/api/v1/admin/audit',
          action: 'READ',
          requiredPlane: 'ADMIN',
        },
      };
      const res = evaluatePlaneAccess(ctx);
      expect(res.decision).toBe('ALLOW');
      expect(res.httpStatus).toBe(200);
    });
  });

  describe('4. Certification Gate', () => {
    it('verifies the exact S-01 Certification Statement', () => {
      const gate = verifyS01Certification(
        'Every protected Nebula resource has an explicit, independently enforced security boundary, and no security plane can be entered through implicit authentication inheritance or frontend behavior.',
      );
      expect(gate.passed).toBe(true);
      expect(gate.canonicalStatement).toBe(S01_CERTIFICATION_STATEMENT);
    });
  });
});
