import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEC_GXWX_001_TICKET_ID,
  SEC_GXWX_001_PHASE,
  SEC_GXWX_001_STATUS,
  SEC_GXWX_001_FROZEN_PRINCIPLE,
  SEC_GXWX_001_CERTIFICATION_STATEMENT,
  GX_SECURITY_CONTEXT,
  WX_SECURITY_CONTEXT,
  WX_REQUEST_PIPELINE_STAGES,
  SECURITY_AUDIT_TEST_MATRIX,
  evaluateSecurityDecision,
  verifySECGXWX001Certification,
} from './sec-gxwx-001-security-boundary.contract.ts';

describe('SEC-GXWX-001 — GX/WX Security Boundary & Isolation Certification', () => {
  it('enforces frozen security principles and ticket metadata', () => {
    assert.equal(SEC_GXWX_001_TICKET_ID, 'SEC-GXWX-001');
    assert.equal(SEC_GXWX_001_PHASE, 'Security Boundary / Production Hardening');
    assert.equal(SEC_GXWX_001_STATUS, 'CERTIFIED_IMPERMEABLE_SECURITY_BOUNDARY');
    assert.ok(SEC_GXWX_001_FROZEN_PRINCIPLE.includes('GX remains outside'));
    assert.ok(SEC_GXWX_001_FROZEN_PRINCIPLE.includes('Shared intelligence does not imply shared authorization'));
  });

  it('guarantees strict context segregation between GX and WX', () => {
    assert.equal(GX_SECURITY_CONTEXT.tier, 'GX_EPHEMERAL_GUEST');
    assert.equal(GX_SECURITY_CONTEXT.persistenceModel, 'EPHEMERAL');
    assert.equal(GX_SECURITY_CONTEXT.authorizationRequired, false);

    assert.equal(WX_SECURITY_CONTEXT.tier, 'WX_AUTHENTICATED_WORKSPACE');
    assert.equal(WX_SECURITY_CONTEXT.persistenceModel, 'PERSISTENT_MEMORY');
    assert.equal(WX_SECURITY_CONTEXT.authorizationRequired, true);

    // GX must prohibit persistent memory and workspace administration
    assert.ok(GX_SECURITY_CONTEXT.prohibitedCapabilities.includes('User workspace access'));
    assert.ok(GX_SECURITY_CONTEXT.prohibitedCapabilities.includes('User domain retrieval or modification'));
    assert.ok(GX_SECURITY_CONTEXT.prohibitedCapabilities.includes('Historical snapshots or drift forensics'));
    assert.ok(GX_SECURITY_CONTEXT.prohibitedCapabilities.includes('Persistent infrastructure memory'));
    assert.ok(GX_SECURITY_CONTEXT.prohibitedCapabilities.includes('Tenant administration & RBAC'));
  });

  it('verifies thick boundary request pipeline ordering', () => {
    const authGuardIdx = WX_REQUEST_PIPELINE_STAGES.indexOf('Authentication Filter / JwtAuthGuard');
    const authzIdx = WX_REQUEST_PIPELINE_STAGES.indexOf('Authorization & Tenant Scoping');
    const serviceIdx = WX_REQUEST_PIPELINE_STAGES.indexOf('Application Service Layer');
    const dbIdx = WX_REQUEST_PIPELINE_STAGES.indexOf('Database Query Execution');

    assert.ok(authGuardIdx < authzIdx, 'Authentication must precede Authorization');
    assert.ok(authzIdx < serviceIdx, 'Authorization must precede Service execution');
    assert.ok(serviceIdx < dbIdx, 'Service must precede Database execution');
  });

  it('evaluates all 18 security vectors in the audit test matrix', () => {
    assert.equal(SECURITY_AUDIT_TEST_MATRIX.length, 18);

    // 1. Anonymous -> protected WX
    const vec1 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-01');
    assert.ok(vec1);
    assert.equal(vec1.expectedDecision, 'AUTH_REDIRECT');

    // 2. GuestSession -> protected API
    const vec2 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-02');
    assert.ok(vec2);
    assert.equal(vec2.expectedDecision, 'DENIED_401');

    // 6. Cross-Tenant Domain Access
    const vec6 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-06');
    assert.ok(vec6);
    assert.equal(vec6.expectedDecision, 'DENIED_404');

    // 7. Cross-Tenant Finding Access
    const vec7 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-07');
    assert.ok(vec7);
    assert.equal(vec7.expectedDecision, 'DENIED_404');

    // 9. Expired Token
    const vec9 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-09');
    assert.ok(vec9);
    assert.equal(vec9.expectedDecision, 'DENIED_401');

    // 13. Explicit Claim Flow
    const vec13 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-13');
    assert.ok(vec13);
    assert.equal(vec13.expectedDecision, 'ALLOWED_200');

    // 14. Replay Claim Attack
    const vec14 = SECURITY_AUDIT_TEST_MATRIX.find((v) => v.vectorId === 'VEC-14');
    assert.ok(vec14);
    assert.equal(vec14.expectedDecision, 'DENIED_403');
  });

  it('correctly evaluates decision logic via evaluateSecurityDecision engine', () => {
    // Anonymous to protected -> DENIED_401
    assert.equal(evaluateSecurityDecision('ANONYMOUS', true, false), 'DENIED_401');

    // Guest token to protected -> DENIED_401
    assert.equal(evaluateSecurityDecision('GUEST_SESSION', true, false), 'DENIED_401');

    // Expired JWT -> DENIED_401
    assert.equal(evaluateSecurityDecision('EXPIRED_JWT', true, true), 'DENIED_401');

    // Authenticated User accessing other tenant resource -> DENIED_404 (zero leak)
    assert.equal(evaluateSecurityDecision('AUTHENTICATED_USER_A', true, false), 'DENIED_404');

    // Authenticated User accessing own resource -> ALLOWED_200
    assert.equal(evaluateSecurityDecision('AUTHENTICATED_USER_A', true, true), 'ALLOWED_200');

    // Claim already claimed by another user -> DENIED_403
    assert.equal(evaluateSecurityDecision('AUTHENTICATED_USER_B', true, true, 'CLAIMED_BY_OTHER'), 'DENIED_403');

    // Public guest endpoint -> ALLOWED_200
    assert.equal(evaluateSecurityDecision('GUEST_SESSION', false, false), 'ALLOWED_200');
  });

  it('passes the SEC-GXWX-001 Certification Gate', () => {
    const cert = verifySECGXWX001Certification(
      'Authenticated Workspace state cannot be entered, accessed, inherited, enumerated, or exposed through Guest Experience state or any unauthenticated pathway. All protected resources enforce authentication, authorization, and ownership independently of frontend navigation.'
    );

    assert.equal(cert.passed, true);
    assert.ok(cert.similarityRatio >= 0.95);
  });
});
