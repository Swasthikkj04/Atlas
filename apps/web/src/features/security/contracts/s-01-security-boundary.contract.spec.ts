import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S01_TICKET_ID,
  S01_PHASE,
  S01_PRIORITY,
  S01_STATUS,
  S01_PRINCIPLES,
  S01_INVARIANTS,
  SECURITY_BOUNDARY_MATRIX,
  JWT_PLANE_DEFINITIONS,
  evaluateResourceOwnership,
  evaluatePlaneAccess,
  verifyS01Certification,
  S01_CERTIFICATION_STATEMENT,
  type CanonicalSecurityContext,
} from './s-01-security-boundary.contract.ts';

describe('S-01 — Global Security Boundary Foundation Contract & Test Suite', () => {
  describe('1. Principles & Hard Invariants', () => {
    it('enforces frozen ticket metadata and P0 priority', () => {
      assert.equal(S01_TICKET_ID, 'S-01');
      assert.equal(S01_PHASE, 'Production Security Hardening');
      assert.equal(S01_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S01_STATUS, 'CERTIFIED_GLOBAL_SECURITY_BOUNDARY');
    });

    it('enforces 4 frozen security principles', () => {
      assert.ok(S01_PRINCIPLES.S01_P01_AUTHN_NEQ_AUTHZ.includes('Authentication != Authorization'));
      assert.ok(S01_PRINCIPLES.S01_P02_FRONTEND_NOT_BOUNDARY.includes('Frontend Is Never the Security Boundary'));
      assert.ok(S01_PRINCIPLES.S01_P03_SECURITY_PLANE_ISOLATION.includes('Security Plane Isolation'));
      assert.ok(S01_PRINCIPLES.S01_P04_FAIL_CLOSED.includes('Fail Closed'));
    });

    it('enforces all 8 hard security invariants (S01-I01 through S01-I08)', () => {
      assert.equal(S01_INVARIANTS.S01_I01, 'A valid credential does not imply universal authorization.');
      assert.equal(S01_INVARIANTS.S01_I02, 'Frontend navigation cannot grant authorization.');
      assert.equal(S01_INVARIANTS.S01_I03, 'GX cannot implicitly enter WX.');
      assert.equal(S01_INVARIANTS.S01_I04, 'WX cannot implicitly enter ADMIN.');
      assert.equal(S01_INVARIANTS.S01_I05, 'Resource identifiers never establish ownership.');
      assert.equal(S01_INVARIANTS.S01_I06, 'Every protected resource has an authorization decision.');
      assert.equal(S01_INVARIANTS.S01_I07, 'Authorization failure always fails closed.');
      assert.equal(S01_INVARIANTS.S01_I08, 'Security-plane crossover requires an explicit authorized contract.');
    });
  });

  describe('2. Security Boundary Policy Matrix', () => {
    it('defines explicit boundaries for all 4 caller types', () => {
      assert.equal(SECURITY_BOUNDARY_MATRIX.length, 4);

      const anon = SECURITY_BOUNDARY_MATRIX.find((p) => p.caller === 'ANONYMOUS');
      assert.ok(anon);
      assert.equal(anon.publicPlane, 'ALLOWED');
      assert.equal(anon.gxPlane, 'ALLOWED');
      assert.equal(anon.wxPlane, 'DENIED');
      assert.equal(anon.adminPlane, 'DENIED');

      const guest = SECURITY_BOUNDARY_MATRIX.find((p) => p.caller === 'GUEST');
      assert.ok(guest);
      assert.equal(guest.gxPlane, 'ALLOWED');
      assert.equal(guest.wxPlane, 'EXPLICIT_CLAIM_ONLY');
      assert.equal(guest.adminPlane, 'DENIED');

      const user = SECURITY_BOUNDARY_MATRIX.find((p) => p.caller === 'USER');
      assert.ok(user);
      assert.equal(user.gxPlane, 'ALLOWED_REMAINS_GUEST');
      assert.equal(user.wxPlane, 'OWN_RESOURCES_ONLY');
      assert.equal(user.adminPlane, 'DENIED');

      const admin = SECURITY_BOUNDARY_MATRIX.find((p) => p.caller === 'ADMIN');
      assert.ok(admin);
      assert.equal(admin.adminPlane, 'ALLOWED_PRIVILEGED');
    });
  });

  describe('3. JWT Plane Separation', () => {
    it('strictly separates user access tokens from admin tokens', () => {
      const userDef = JWT_PLANE_DEFINITIONS.WX;
      assert.equal(userDef.plane, 'WX');
      assert.equal(userDef.issuer, 'nebula-auth');
      assert.equal(userDef.tokenType, 'user-access');
      assert.equal(userDef.requiresPasskey, false);

      const adminDef = JWT_PLANE_DEFINITIONS.ADMIN;
      assert.equal(adminDef.plane, 'ADMIN');
      assert.equal(adminDef.issuer, 'nebula-admin-auth');
      assert.equal(adminDef.tokenType, 'admin-access');
      assert.equal(adminDef.minimumAal, 'AAL3');
      assert.equal(adminDef.requiresPasskey, true);
    });
  });

  describe('4. Resource Ownership Verification', () => {
    it('allows access when caller is the verified resource owner', () => {
      const result = evaluateResourceOwnership('user-123', {
        resourceType: 'DOMAIN',
        resourceId: 'dom-456',
        ownerUserId: 'user-123',
      });
      assert.equal(result.authorized, true);
      assert.equal(result.httpStatus, 200);
    });

    it('denies access (404 fail-closed) when caller is a different user (Cross-Tenant)', () => {
      const result = evaluateResourceOwnership('user-123', {
        resourceType: 'DOMAIN',
        resourceId: 'dom-456',
        ownerUserId: 'user-999',
      });
      assert.equal(result.authorized, false);
      assert.equal(result.httpStatus, 404);
      assert.ok(result.reason.includes('not found in caller tenant scope'));
    });

    it('denies access (401) when caller is unauthenticated', () => {
      const result = evaluateResourceOwnership(undefined, {
        resourceType: 'SNAPSHOT',
        resourceId: 'snp-456',
        ownerUserId: 'user-123',
      });
      assert.equal(result.authorized, false);
      assert.equal(result.httpStatus, 401);
    });
  });

  describe('5. Cross-Plane & Boundary Access Evaluation', () => {
    it('Vector: Anonymous -> Public Plane (ALLOWED)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ANONYMOUS', authenticated: false },
        plane: 'PUBLIC',
        session: { state: 'ACTIVE', revoked: false },
        authorization: { resource: '/docs', action: 'READ', requiredPlane: 'PUBLIC' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'ALLOW');
      assert.equal(res.httpStatus, 200);
    });

    it('Vector: Anonymous -> GX Plane (ALLOWED ephemeral)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ANONYMOUS', authenticated: false },
        plane: 'GX',
        session: { state: 'ACTIVE', revoked: false },
        authorization: { resource: 'example.com', action: 'DISCOVER', requiredPlane: 'GX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'ALLOW');
      assert.equal(res.httpStatus, 200);
    });

    it('Vector: Anonymous -> WX Plane (AUTH_REDIRECT / 401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ANONYMOUS', authenticated: false },
        plane: 'WX',
        session: { state: 'ACTIVE', revoked: false },
        authorization: { resource: '/workspace', action: 'READ', requiredPlane: 'WX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'AUTH_REDIRECT');
      assert.equal(res.httpStatus, 401);
    });

    it('Vector: Anonymous -> Admin Plane (DENIED / 403)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ANONYMOUS', authenticated: false },
        plane: 'ADMIN',
        session: { state: 'ACTIVE', revoked: false },
        authorization: { resource: '/api/v1/admin/audit', action: 'READ', requiredPlane: 'ADMIN' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 403);
    });

    it('Vector: GuestSession -> WX Resource (DENIED / 401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'GUEST', id: 'guest-session-1', authenticated: false },
        plane: 'WX',
        session: { state: 'ACTIVE', revoked: false, tokenType: 'guest-token' },
        authorization: { resource: 'dom-123', action: 'READ', requiredPlane: 'WX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 401);
    });

    it('Vector: User JWT -> Admin Plane (DENIED / 403)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-1', email: 'user@corp.com', authenticated: true },
        plane: 'ADMIN',
        session: { state: 'ACTIVE', revoked: false, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: { resource: '/api/v1/admin/dashboard', action: 'READ', requiredPlane: 'ADMIN' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 403);
    });

    it('Vector: Admin Identity with AAL3 -> Admin Plane (ALLOWED / 200)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ADMIN', id: 'adm-1', adminRole: 'SUPER_ADMIN', authenticated: true },
        plane: 'ADMIN',
        session: {
          state: 'ACTIVE',
          revoked: false,
          issuer: 'nebula-admin-auth',
          tokenType: 'admin-access',
          aal: 'AAL3',
        },
        authorization: { resource: '/api/v1/admin/dashboard', action: 'READ', requiredPlane: 'ADMIN' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'ALLOW');
      assert.equal(res.httpStatus, 200);
    });

    it('Vector: Admin Identity without AAL3 (AAL1) -> Admin Plane (DENIED / 403)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ADMIN', id: 'adm-1', adminRole: 'SUPER_ADMIN', authenticated: true },
        plane: 'ADMIN',
        session: {
          state: 'ACTIVE',
          revoked: false,
          issuer: 'nebula-admin-auth',
          tokenType: 'admin-access',
          aal: 'AAL1',
        },
        authorization: { resource: '/api/v1/admin/dashboard', action: 'READ', requiredPlane: 'ADMIN' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 403);
    });

    it('Vector: User A accessing User B resource in WX (DENIED 404 Fail-Closed)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-A', authenticated: true },
        plane: 'WX',
        session: { state: 'ACTIVE', revoked: false, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: {
          resource: 'dom-B',
          action: 'READ',
          requiredPlane: 'WX',
          resourceOwnerId: 'usr-B',
        },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 404);
    });

    it('Vector: User A accessing own resource in WX (ALLOWED 200)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-A', authenticated: true },
        plane: 'WX',
        session: { state: 'ACTIVE', revoked: false, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: {
          resource: 'dom-A',
          action: 'READ',
          requiredPlane: 'WX',
          resourceOwnerId: 'usr-A',
        },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'ALLOW');
      assert.equal(res.httpStatus, 200);
    });

    it('Vector: Expired Session accessing WX (DENIED 401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-A', authenticated: true },
        plane: 'WX',
        session: { state: 'EXPIRED', revoked: false, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: { resource: 'dom-A', action: 'READ', requiredPlane: 'WX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 401);
    });

    it('Vector: Revoked Session accessing WX (DENIED 401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-A', authenticated: true },
        plane: 'WX',
        session: { state: 'REVOKED', revoked: true, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: { resource: 'dom-A', action: 'READ', requiredPlane: 'WX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 401);
    });

    it('Vector: Authenticated User explicitly claiming a GuestSession (ALLOWED 200)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'USER', id: 'usr-A', authenticated: true },
        plane: 'GX',
        session: { state: 'ACTIVE', revoked: false, issuer: 'nebula-auth', tokenType: 'user-access' },
        authorization: { resource: 'guest-session-123', action: 'CLAIM', requiredPlane: 'GX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'ALLOW');
      assert.equal(res.httpStatus, 200);
    });

    it('Vector: Unauthenticated client claiming a GuestSession (DENIED 401)', () => {
      const ctx: CanonicalSecurityContext = {
        identity: { type: 'ANONYMOUS', authenticated: false },
        plane: 'GX',
        session: { state: 'ACTIVE', revoked: false },
        authorization: { resource: 'guest-session-123', action: 'CLAIM', requiredPlane: 'GX' },
      };
      const res = evaluatePlaneAccess(ctx);
      assert.equal(res.decision, 'DENY');
      assert.equal(res.httpStatus, 401);
    });
  });

  describe('6. Certification Gate', () => {
    it('verifies the S-01 Certification Gate statement passes with 100% fidelity', () => {
      const verification = verifyS01Certification(
        'Every protected Nebula resource has an explicit, independently enforced security boundary, and no security plane can be entered through implicit authentication inheritance or frontend behavior.'
      );

      assert.equal(verification.passed, true);
      assert.ok(verification.similarityRatio >= 0.99);
      assert.equal(verification.canonicalStatement, S01_CERTIFICATION_STATEMENT);
    });
  });
});
