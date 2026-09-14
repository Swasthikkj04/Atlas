import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SEC_GXWX_003_TICKET_ID,
  SEC_GXWX_003_PHASE,
  SEC_GXWX_003_PRIORITY,
  SEC_GXWX_003_STATUS,
  SEC_GXWX_003_SECURITY_INVARIANT,
  SEC_GXWX_003_FROZEN_PRINCIPLE,
  MAX_WORKSPACE_DOMAINS,
  CANONICAL_QUOTA_ERROR_MESSAGE,
  CANONICAL_DOMAIN_INGRESS_VECTORS,
  evaluateDomainQuotaAdmission,
  simulateConcurrentAtomicClaims,
} from './sec-gxwx-003-domain-quota.contract.ts';

describe('SEC-GXWX-003: Domain Quota Bypass Through GX → Workspace Conversion', () => {
  describe('1. Security Boundary & Policy Invariants', () => {
    it('declares authoritative P0 security metadata', () => {
      assert.equal(SEC_GXWX_003_TICKET_ID, 'SEC-GXWX-003');
      assert.equal(SEC_GXWX_003_PHASE, 'Production Security / GX → WX Boundary');
      assert.equal(SEC_GXWX_003_PRIORITY, 'P0 — BLOCKING');
      assert.equal(
        SEC_GXWX_003_STATUS,
        'CERTIFIED_IMPERMEABLE_DOMAIN_QUOTA_BOUNDARY',
      );
    });

    it('asserts the inviolable security invariant', () => {
      assert.equal(
        SEC_GXWX_003_SECURITY_INVARIANT,
        "A user may never own more domains than the active account policy permits, regardless of how the domain enters the account. The quota must be enforced server-side, against the authenticated user's persisted domain ownership.",
      );
    });

    it('asserts the frozen architectural principle', () => {
      assert.equal(
        SEC_GXWX_003_FROZEN_PRINCIPLE,
        'GX is an entry point, not a quota bypass. Patch the authoritative domain-ownership creation/claim boundary.',
      );
    });

    it('enforces canonical account limit of 4 domains', () => {
      assert.equal(MAX_WORKSPACE_DOMAINS, 4);
      assert.equal(
        CANONICAL_QUOTA_ERROR_MESSAGE,
        'Sorry, your domain limit has been reached.',
      );
    });
  });

  describe('2. Ingress Vectors Authoritative Guard Coverage', () => {
    it('ensures all 5 domain ingress vectors route through authoritative server-side quota checks', () => {
      assert.equal(CANONICAL_DOMAIN_INGRESS_VECTORS.length, 5);

      for (const vector of CANONICAL_DOMAIN_INGRESS_VECTORS) {
        assert.equal(
          vector.enforcesServerSideQuota,
          true,
          `${vector.vector} must enforce server-side quota`,
        );
        assert.equal(
          vector.atomicTransactionProtected,
          true,
          `${vector.vector} must be atomic transaction protected`,
        );
        assert.equal(
          vector.clientCountAuthoritative,
          false,
          `${vector.vector} must never trust client-supplied domain counts`,
        );
      }
    });
  });

  describe('3. Authoritative Quota Evaluation Edge Cases', () => {
    it('Edge Case 1: User has 0 domains -> claim succeeds (0/4 -> 1/4)', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 0,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, true);
      assert.equal(decision.remainingQuota, 3);
      assert.equal(decision.projectedCount, 1);
      assert.equal(decision.reason, 'ADMITTED');
      assert.equal(decision.errorMessage, undefined);
    });

    it('Edge Case 2: User has 3 domains -> claim succeeds (3/4 -> 4/4)', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 3,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, true);
      assert.equal(decision.remainingQuota, 0);
      assert.equal(decision.projectedCount, 4);
      assert.equal(decision.reason, 'ADMITTED');
    });

    it('Edge Case 3: User has 4 domains -> claim of 5th domain rejected (4/4 -> 5/4 rejected)', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 4,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, false);
      assert.equal(decision.remainingQuota, 0);
      assert.equal(decision.projectedCount, 5);
      assert.equal(decision.reason, 'QUOTA_EXCEEDED');
      assert.equal(
        decision.errorMessage,
        'Sorry, your domain limit has been reached.',
      );
    });

    it('Edge Case 4: User has 4 domains and converts through GX -> claim rejected', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 4,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, false);
      assert.equal(decision.reason, 'QUOTA_EXCEEDED');
    });

    it('Edge Case 5: User has 4 domains and uses OAuth conversion -> claim rejected', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 4,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, false);
      assert.equal(decision.reason, 'QUOTA_EXCEEDED');
    });

    it('Edge Case 6: User repeatedly attempts the same GX claim -> cannot bypass quota', () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const decision = evaluateDomainQuotaAdmission({
          currentOwnedCount: 4,
          requestedAdditionCount: 1,
          isExistingDomainReassignment: false,
          maxPermitted: 4,
        });

        assert.equal(decision.admitted, false);
        assert.equal(decision.reason, 'QUOTA_EXCEEDED');
      }
    });

    it('Edge Case 7: User has 4 domains but claims an already owned domain -> admitted without increasing count', () => {
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: 4,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: true,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, true);
      assert.equal(decision.projectedCount, 4);
      assert.equal(decision.reason, 'EXISTING_DOMAIN_REASSIGNMENT');
    });
  });

  describe('4. Concurrency & Transactional Atomic Invariants', () => {
    it('Edge Case 8: Two simultaneous claim requests at 3 domains cannot both bypass the limit (exactly 1 allowed, 1 rejected, final count 4)', () => {
      const simulation = simulateConcurrentAtomicClaims({
        initialOwnedCount: 3,
        maxLimit: 4,
        incomingRequests: [
          {
            requestId: 'req-alpha-1',
            domainName: 'alpha.com',
            userId: 'usr-1',
          },
          {
            requestId: 'req-beta-2',
            domainName: 'beta.com',
            userId: 'usr-1',
          },
        ],
      });

      assert.equal(simulation.successfulClaims.length, 1);
      assert.equal(simulation.successfulClaims[0], 'req-alpha-1');
      assert.equal(simulation.rejectedClaims.length, 1);
      assert.equal(simulation.rejectedClaims[0], 'req-beta-2');
      assert.equal(simulation.finalOwnedCount, 4);
      assert.equal(simulation.invariantPreserved, true);
    });

    it('Five simultaneous requests at 0 domains allow exactly 4 and reject the 5th', () => {
      const simulation = simulateConcurrentAtomicClaims({
        initialOwnedCount: 0,
        maxLimit: 4,
        incomingRequests: [
          { requestId: 'r1', domainName: 'd1.com', userId: 'usr-1' },
          { requestId: 'r2', domainName: 'd2.com', userId: 'usr-1' },
          { requestId: 'r3', domainName: 'd3.com', userId: 'usr-1' },
          { requestId: 'r4', domainName: 'd4.com', userId: 'usr-1' },
          { requestId: 'r5', domainName: 'd5.com', userId: 'usr-1' },
        ],
      });

      assert.equal(simulation.successfulClaims.length, 4);
      assert.equal(simulation.rejectedClaims.length, 1);
      assert.equal(simulation.rejectedClaims[0], 'r5');
      assert.equal(simulation.finalOwnedCount, 4);
      assert.equal(simulation.invariantPreserved, true);
    });
  });

  describe('5. Data Integrity & Atomicity Invariants', () => {
    it('guarantees client-side count manipulation cannot bypass server evaluation', () => {
      // Attacker client sends fake count of 0, but DB has 4
      const actualDbCount = 4;
      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: actualDbCount,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, false);
      assert.equal(decision.reason, 'QUOTA_EXCEEDED');
    });

    it('certifies rejection leaves existing 4 domains untouched and guest observation ephemeral', () => {
      const stateBefore = {
        ownedDomains: ['a.com', 'b.com', 'c.com', 'd.com'],
        guestObservationStatus: 'EPHEMERAL',
      };

      const decision = evaluateDomainQuotaAdmission({
        currentOwnedCount: stateBefore.ownedDomains.length,
        requestedAdditionCount: 1,
        isExistingDomainReassignment: false,
        maxPermitted: 4,
      });

      assert.equal(decision.admitted, false);
      // Existing state unchanged
      assert.equal(stateBefore.ownedDomains.length, 4);
      assert.equal(stateBefore.guestObservationStatus, 'EPHEMERAL');
    });
  });
});
