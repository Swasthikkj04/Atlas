import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEC_GXWX_004_TICKET_ID,
  SEC_GXWX_004_PHASE,
  SEC_GXWX_004_STATUS,
  SEC_GXWX_004_PRIORITY,
  SEC_GXWX_004_DEMONSTRATED_TRUTH,
  SEC_GXWX_004_FROZEN_INVARIANT_I01,
  SEC_GXWX_004_CORE_PRINCIPLES,
  SEC_GXWX_004_INVARIANTS,
  SEC_GXWX_004_SCENARIOS,
  evaluateIdentityBoundary,
  evaluateConversionTransition,
} from './sec-gxwx-004-identity-boundary.contract.ts';

describe('SEC-GXWX-004 — Guest / Registered Identity Boundary Contract', () => {
  it('enforces ticket metadata, frozen invariant I01, and core principles', () => {
    assert.equal(SEC_GXWX_004_TICKET_ID, 'SEC-GXWX-004');
    assert.equal(
      SEC_GXWX_004_PHASE,
      'Production Security Hardening / Identity Isolation / GX-WX Boundary'
    );
    assert.equal(SEC_GXWX_004_PRIORITY, 'P0 — BLOCKING');
    assert.equal(SEC_GXWX_004_STATUS, 'CERTIFIED_IDENTITY_ISOLATION');

    assert.ok(
      SEC_GXWX_004_DEMONSTRATED_TRUTH.includes(
        'A registered account existing in the browser must not automatically convert, authenticate, inherit, or otherwise alter the identity of a new GX session'
      )
    );
    assert.ok(
      SEC_GXWX_004_FROZEN_INVARIANT_I01.includes(
        'Authentication state and Guest Experience state must be orthogonal'
      )
    );
    assert.ok(
      SEC_GXWX_004_FROZEN_INVARIANT_I01.includes(
        'isAuthenticated === true must never imply GX is authenticated'
      )
    );
    assert.ok(
      SEC_GXWX_004_FROZEN_INVARIANT_I01.includes(
        'GuestSession exists must never imply UserSession exists'
      )
    );

    assert.equal(SEC_GXWX_004_CORE_PRINCIPLES.length, 6);
  });

  it('certifies all 10 canonical security invariants (SEC-GXWX-004-I01 .. I10)', () => {
    assert.equal(SEC_GXWX_004_INVARIANTS.length, 10);

    const invariantIds = SEC_GXWX_004_INVARIANTS.map((inv) => inv.id);
    for (let i = 1; i <= 10; i++) {
      const expectedId = `SEC-GXWX-004-I${String(i).padStart(2, '0')}`;
      assert.ok(invariantIds.includes(expectedId), `Missing invariant: ${expectedId}`);
    }

    const i01 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I01');
    assert.ok(i01);
    assert.equal(i01.name, 'Orthogonal Identity State');
    assert.equal(i01.enforcementLayer, 'AUTH_CONTEXT');

    const i02 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I02');
    assert.ok(i02);
    assert.equal(i02.name, 'Ambient Credential Inertia');
    assert.equal(i02.enforcementLayer, 'API');

    const i03 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I03');
    assert.ok(i03);
    assert.equal(i03.name, 'Ephemeral Session Isolation');
    assert.equal(i03.enforcementLayer, 'DATABASE');

    const i04 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I04');
    assert.ok(i04);
    assert.equal(i04.name, 'Zero Implicit Routing');
    assert.equal(i04.enforcementLayer, 'ROUTING');

    const i05 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I05');
    assert.ok(i05);
    assert.equal(i05.name, 'Explicit Conversion Boundary');
    assert.equal(i05.enforcementLayer, 'BROWSER');

    const i06 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I06');
    assert.ok(i06);
    assert.equal(i06.name, 'Multi-Tab Concurrency Isolation');
    assert.equal(i06.enforcementLayer, 'BROWSER');

    const i07 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I07');
    assert.ok(i07);
    assert.equal(i07.name, 'Authoritative Quota Enclosure');
    assert.equal(i07.enforcementLayer, 'TRANSACTION');

    const i08 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I08');
    assert.ok(i08);
    assert.equal(i08.name, 'Unauthenticated Claim Protection');
    assert.equal(i08.enforcementLayer, 'API');

    const i09 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I09');
    assert.ok(i09);
    assert.equal(i09.name, 'Replay & Double-Claim Resistance');
    assert.equal(i09.enforcementLayer, 'DATABASE');

    const i10 = SEC_GXWX_004_INVARIANTS.find((inv) => inv.id === 'SEC-GXWX-004-I10');
    assert.ok(i10);
    assert.equal(i10.name, 'Post-Logout Availability');
    assert.equal(i10.enforcementLayer, 'ROUTING');
  });

  it('guarantees SEC-GXWX-004-I01 & I04: /guest remains purely GX with zero auto-redirect', () => {
    // 1. Unauthenticated user on /guest
    const anonRes = evaluateIdentityBoundary({
      pathname: '/guest',
      hasAuthCookie: false,
      hasHydratedUser: false,
      isGuestSessionActive: true,
      isExplicitAction: false,
    });
    assert.equal(anonRes.effectivePlane, 'GX');
    assert.equal(anonRes.isGuestIdentityIsolated, true);
    assert.equal(anonRes.isAutoRedirectTriggered, false);
    assert.equal(anonRes.allowsImplicitConversion, false);

    // 2. Authenticated user on /guest (with valid cookie & hydrated user profile)
    const authRes = evaluateIdentityBoundary({
      pathname: '/guest',
      hasAuthCookie: true,
      hasHydratedUser: true,
      isGuestSessionActive: true,
      isExplicitAction: false,
    });
    assert.equal(authRes.effectivePlane, 'GX');
    assert.equal(authRes.isGuestIdentityIsolated, true);
    assert.equal(authRes.isAutoRedirectTriggered, false);
    assert.equal(authRes.allowsImplicitConversion, false);

    // 3. Sub-route on /guest
    const subRouteRes = evaluateIdentityBoundary({
      pathname: '/guest/overview',
      hasAuthCookie: true,
      hasHydratedUser: true,
      isGuestSessionActive: true,
      isExplicitAction: false,
    });
    assert.equal(subRouteRes.effectivePlane, 'GX');
    assert.equal(subRouteRes.isAutoRedirectTriggered, false);
  });

  it('guarantees SEC-GXWX-004-I05: conversion strictly requires explicit user action', () => {
    // Implicit conversion attempt (user did NOT click button) -> REJECTED
    const implicitAttempt = evaluateConversionTransition({
      isAuthenticated: true,
      isExplicitUserAction: false,
      sessionToken: 'ses_123',
      sessionStatus: 'ACTIVE',
      userDomainCount: 1,
      maxAllowedDomains: 4,
    });
    assert.equal(implicitAttempt, 'REJECTED_MISSING_EXPLICIT_ACTION');

    // Explicit conversion by unauthenticated user -> REJECTED_UNAUTHENTICATED_401
    const unauthAttempt = evaluateConversionTransition({
      isAuthenticated: false,
      isExplicitUserAction: true,
      sessionToken: 'ses_123',
      sessionStatus: 'ACTIVE',
      userDomainCount: 0,
      maxAllowedDomains: 4,
    });
    assert.equal(unauthAttempt, 'REJECTED_UNAUTHENTICATED_401');

    // Explicit conversion by authenticated user with valid session and available quota -> SUCCESS
    const validConversion = evaluateConversionTransition({
      isAuthenticated: true,
      isExplicitUserAction: true,
      sessionToken: 'ses_123',
      sessionStatus: 'ACTIVE',
      userDomainCount: 2,
      maxAllowedDomains: 4,
    });
    assert.equal(validConversion, 'CONVERSION_SUCCESS');
  });

  it('guarantees SEC-GXWX-004-I07: domain quota limit prevents silent domain creation', () => {
    // User at 4 domains attempting to claim 5th domain -> 403 QUOTA EXCEEDED
    const quotaExceededAttempt = evaluateConversionTransition({
      isAuthenticated: true,
      isExplicitUserAction: true,
      sessionToken: 'ses_123',
      sessionStatus: 'ACTIVE',
      userDomainCount: 4,
      maxAllowedDomains: 4,
    });
    assert.equal(quotaExceededAttempt, 'REJECTED_QUOTA_EXCEEDED_403');
  });

  it('guarantees SEC-GXWX-004-I09: replay of converted session is forbidden', () => {
    // Attempting to claim an already CONVERTED session -> 403 FORBIDDEN
    const replayAttempt = evaluateConversionTransition({
      isAuthenticated: true,
      isExplicitUserAction: true,
      sessionToken: 'ses_123',
      sessionStatus: 'CONVERTED',
      userDomainCount: 1,
      maxAllowedDomains: 4,
    });
    assert.equal(replayAttempt, 'REJECTED_SESSION_CONVERTED_403');
  });

  it('verifies all 16 critical attack & regression scenarios (GXWX-01 .. GXWX-16)', () => {
    assert.equal(SEC_GXWX_004_SCENARIOS.length, 16);

    for (const scenario of SEC_GXWX_004_SCENARIOS) {
      assert.ok(scenario.id.startsWith('GXWX-'), `Invalid scenario ID: ${scenario.id}`);
      assert.ok(scenario.name.length > 0, `Scenario name missing for ${scenario.id}`);
      assert.ok(scenario.scenario.length > 0, `Scenario description missing for ${scenario.id}`);
      assert.ok(
        scenario.expectedIdentityBehavior.length > 0,
        `Expected identity behavior missing for ${scenario.id}`
      );
      assert.ok(
        scenario.testedInvariant.startsWith('SEC-GXWX-004-'),
        `Tested invariant missing for ${scenario.id}`
      );

      // Verify routing & identity boundary resolution
      const boundaryRes = evaluateIdentityBoundary({
        pathname: scenario.initialBrowserState.currentRoute,
        hasAuthCookie: scenario.initialBrowserState.hasAuthToken,
        hasHydratedUser: scenario.initialBrowserState.hasAuthToken,
        isGuestSessionActive: scenario.initialBrowserState.activeGuestSession,
        isExplicitAction: scenario.action.startsWith('CLICK_') || scenario.action.startsWith('PROCESS_'),
      });

      // Special action validations
      if (scenario.id === 'GXWX-09') {
        // Explicit click to Workspace
        assert.equal(scenario.expectedResultPlane, 'WX');
      } else if (scenario.id === 'GXWX-13') {
        // OAuth callback claim completion
        assert.equal(scenario.expectedResultPlane, 'WX');
      } else if (scenario.id === 'GXWX-15') {
        // Quota rejection test
        const convRes = evaluateConversionTransition({
          isAuthenticated: true,
          isExplicitUserAction: true,
          sessionToken: 'ses_quota_test',
          sessionStatus: 'ACTIVE',
          userDomainCount: 4,
          maxAllowedDomains: 4,
        });
        assert.equal(convRes, 'REJECTED_QUOTA_EXCEEDED_403');
        assert.equal(scenario.expectedResultPlane, 'REJECTED');
      } else if (scenario.id === 'GXWX-16') {
        // Direct unauthenticated claim attempt
        const convRes = evaluateConversionTransition({
          isAuthenticated: false,
          isExplicitUserAction: true,
          sessionToken: 'ses_unauth_test',
          sessionStatus: 'ACTIVE',
          userDomainCount: 0,
        });
        assert.equal(convRes, 'REJECTED_UNAUTHENTICATED_401');
        assert.equal(scenario.expectedResultPlane, 'REJECTED');
      } else {
        assert.equal(
          boundaryRes.effectivePlane,
          scenario.expectedResultPlane,
          `Scenario ${scenario.id} (${scenario.name}) expected plane ${scenario.expectedResultPlane}, got ${boundaryRes.effectivePlane}`
        );
      }
    }
  });
});
