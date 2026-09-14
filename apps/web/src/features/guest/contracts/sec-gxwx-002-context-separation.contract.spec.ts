import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEC_GXWX_002_TICKET_ID,
  SEC_GXWX_002_PHASE,
  SEC_GXWX_002_STATUS,
  SEC_GXWX_002_PRIORITY,
  SEC_GXWX_002_DEMONSTRATED_TRUTH,
  SEC_GXWX_002_FROZEN_PRINCIPLE,
  SEC_GXWX_002_CORE_PRINCIPLES,
  SEC_GXWX_002_INVARIANTS,
  SEC_GXWX_002_REGRESSION_MATRIX,
  resolveProductPlane,
  evaluateContextTransition,
  evaluateStateMounting,
} from './sec-gxwx-002-context-separation.contract.ts';

describe('SEC-GXWX-002 — Guest / Workspace Context Separation Contract', () => {
  it('enforces ticket metadata, frozen principle, and core principles', () => {
    assert.equal(SEC_GXWX_002_TICKET_ID, 'SEC-GXWX-002');
    assert.equal(SEC_GXWX_002_PHASE, 'Production Security Hardening / GX-WX Boundary');
    assert.equal(SEC_GXWX_002_PRIORITY, 'P0 — BLOCKING');
    assert.equal(SEC_GXWX_002_STATUS, 'CERTIFIED_CONTEXT_SEPARATION');
    assert.ok(SEC_GXWX_002_DEMONSTRATED_TRUTH.includes('never changes the security or product plane'));
    assert.ok(SEC_GXWX_002_FROZEN_PRINCIPLE.includes('Authentication may permit Workspace access'));
    assert.ok(SEC_GXWX_002_FROZEN_PRINCIPLE.includes('Authentication must never redefine Guest Experience'));

    assert.ok(
      SEC_GXWX_002_CORE_PRINCIPLES.includes(
        'Workspace is an exit from GX, never a destination inside GX.'
      )
    );
    assert.ok(
      SEC_GXWX_002_CORE_PRINCIPLES.includes(
        'Security first. Context second. Conversion last.'
      )
    );
    assert.ok(
      SEC_GXWX_002_CORE_PRINCIPLES.includes(
        'Workspace continuity is earned and contextual, appearing only after intelligence has been demonstrated.'
      )
    );
  });

  it('certifies all 10 canonical security invariants (SEC-GXWX-002-I01 .. I10)', () => {
    assert.equal(SEC_GXWX_002_INVARIANTS.length, 10);

    const invariantIds = SEC_GXWX_002_INVARIANTS.map((inv) => inv.id);
    for (let i = 1; i <= 10; i++) {
      const expectedId = `SEC-GXWX-002-I${String(i).padStart(2, '0')}`;
      assert.ok(invariantIds.includes(expectedId), `Missing invariant: ${expectedId}`);
    }

    const planePersistence = SEC_GXWX_002_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-002-I01');
    assert.ok(planePersistence);
    assert.equal(planePersistence.name, 'Plane Persistence');

    const noPromotion = SEC_GXWX_002_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-002-I02');
    assert.ok(noPromotion);
    assert.equal(noPromotion.name, 'No Authentication Promotion');

    const noPersistentNav = SEC_GXWX_002_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-002-I03');
    assert.ok(noPersistentNav);
    assert.equal(noPersistentNav.name, 'No Persistent Workspace Navigation in GX');

    const noPrivateState = SEC_GXWX_002_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-002-I05');
    assert.ok(noPrivateState);
    assert.equal(noPrivateState.name, 'No Private State Mount');
  });

  it('guarantees SEC-GXWX-002-I01 & I03: /guest always renders Canonical GX header with no persistent WX navigation', () => {
    // Unauthenticated visitor
    const anonRes = resolveProductPlane({ pathname: '/guest', hasAuthSession: false });
    assert.equal(anonRes.resolvedPlane, 'GX');
    assert.equal(anonRes.isEphemeral, true);
    assert.equal(anonRes.requiresAuth, false);
    assert.equal(anonRes.allowsPrivateWorkspaceState, false);
    assert.equal(anonRes.headerMode, 'CANONICAL_GX');

    // Authenticated visitor in active browser session
    const authRes = resolveProductPlane({ pathname: '/guest', hasAuthSession: true });
    assert.equal(authRes.resolvedPlane, 'GX');
    assert.equal(authRes.isEphemeral, true);
    assert.equal(authRes.requiresAuth, false);
    assert.equal(authRes.allowsPrivateWorkspaceState, false);
    assert.equal(authRes.headerMode, 'CANONICAL_GX');

    // Sub-path in GX
    const subPathRes = resolveProductPlane({ pathname: '/guest/overview', hasAuthSession: true });
    assert.equal(subPathRes.resolvedPlane, 'GX');
    assert.equal(subPathRes.headerMode, 'CANONICAL_GX');
  });

  it('guarantees SEC-GXWX-002-I04: /workspace strictly resolves to WX for authenticated or AUTH_REDIRECT for unauthenticated', () => {
    // Unauthenticated user attempting WX entry
    const unauthWX = resolveProductPlane({ pathname: '/workspace', hasAuthSession: false });
    assert.equal(unauthWX.resolvedPlane, 'AUTH_REDIRECT');
    assert.equal(unauthWX.requiresAuth, true);
    assert.equal(unauthWX.allowsPrivateWorkspaceState, false);

    // Authenticated user entering WX
    const authWX = resolveProductPlane({ pathname: '/workspace', hasAuthSession: true });
    assert.equal(authWX.resolvedPlane, 'WX');
    assert.equal(authWX.requiresAuth, true);
    assert.equal(authWX.allowsPrivateWorkspaceState, true);
    assert.equal(authWX.headerMode, 'AUTHENTICATED_WX');
  });

  it('guarantees SEC-GXWX-002-I03: explicit transition required to leave GX and enter WX', () => {
    // Implicit transition attempt (e.g. background promotion) -> PROHIBITED
    const implicitTransition = evaluateContextTransition('GX', '/workspace', true, false);
    assert.equal(implicitTransition, 'PROHIBITED_IMPLICIT_PROMOTION');

    // Explicit user action by authenticated user -> PERMITTED
    const explicitAuthTransition = evaluateContextTransition('GX', '/workspace', true, true);
    assert.equal(explicitAuthTransition, 'PERMITTED_WX_ENTRY');

    // Explicit user action by unauthenticated user -> LOGIN_REQUIRED
    const explicitAnonTransition = evaluateContextTransition('GX', '/workspace', false, true);
    assert.equal(explicitAnonTransition, 'LOGIN_REQUIRED');

    // Normal internal GX navigation -> REMAINS_IN_GX
    const internalGX = evaluateContextTransition('GX', '/guest', false, false);
    assert.equal(internalGX, 'REMAINS_IN_GX');
  });

  it('guarantees SEC-GXWX-002-I05: private Workspace hooks & queries are prohibited from mounting in GX', () => {
    const prohibitedHooks = [
      'useDomains',
      'useDomain',
      'useCreateDomain',
      'useDeleteDomain',
      'useDomainOverview',
      'useWorkspaceOverview',
      'useDomainFindings',
      'useSnapshots',
      'useTimeline',
      'useWorkspaceUnderstandingConvergence',
    ];

    for (const hook of prohibitedHooks) {
      assert.equal(
        evaluateStateMounting('GX', hook),
        'PROHIBITED_PRIVATE_STATE_LEAK',
        `Hook ${hook} must not mount in GX plane`
      );
      assert.equal(
        evaluateStateMounting('WX', hook),
        'ALLOWED_IN_CONTEXT',
        `Hook ${hook} is permitted in WX plane`
      );
    }
  });

  it('verifies all 20 attack/regression vectors in the SEC-GXWX-002 matrix', () => {
    assert.equal(SEC_GXWX_002_REGRESSION_MATRIX.length, 20);

    for (const vector of SEC_GXWX_002_REGRESSION_MATRIX) {
      assert.ok(vector.id.startsWith('SEC-GXWX-002-'), `Invalid vector ID: ${vector.id}`);
      assert.ok(vector.scenario.length > 0, `Scenario description missing on ${vector.id}`);
      assert.ok(vector.expectedDecision.length > 0, `Expected decision missing on ${vector.id}`);

      // Evaluate route resolution
      const resolution = resolveProductPlane({
        pathname: vector.initialRoute.split('?')[0],
        hasAuthSession: vector.hasAuthSession,
      });

      if (vector.navigationAction === 'CLICK_EARNED_CONTINUITY_WORKSPACE') {
        const transition = evaluateContextTransition(resolution.resolvedPlane, '/workspace', vector.hasAuthSession, true);
        assert.equal(transition, 'PERMITTED_WX_ENTRY');
      } else {
        assert.equal(
          resolution.resolvedPlane,
          vector.expectedPlane,
          `Vector ${vector.id} (${vector.scenario}) failed plane resolution: got ${resolution.resolvedPlane}, expected ${vector.expectedPlane}`
        );
      }
    }
  });
});
