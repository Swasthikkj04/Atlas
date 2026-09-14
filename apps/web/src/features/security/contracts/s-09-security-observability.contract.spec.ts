import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S09_TICKET_ID,
  S09_PHASE,
  S09_PRIORITY,
  S09_TYPE,
  S09_STATUS,
  S09_DEPENDS_ON,
  S09_BLOCKS,
  S09_CERTIFICATION_STATEMENT,
  S09_SECONDARY_GATE,
  S09_FROZEN_PRINCIPLE,
  S09_PRINCIPLES,
  S09_INVARIANTS,
  S09_ATTACK_MATRIX,
  verifyS09Certification,
} from './s-09-security-observability.contract.ts';

describe('S-09 — Security Observability & Audit Web Contract Spec', () => {
  describe('1. Web Security Contract & Invariants', () => {
    it('verifies metadata, dependencies, and blocking status', () => {
      assert.equal(S09_TICKET_ID, 'S-09');
      assert.equal(S09_PHASE, 'Production Security Hardening');
      assert.equal(S09_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S09_STATUS, 'CERTIFIED_SECURITY_OBSERVABILITY_AUDIT');
      assert.deepEqual(S09_DEPENDS_ON, [
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
        'S-07',
        'S-08',
      ]);
      assert.ok(S09_BLOCKS.includes('Production Release'));
    });

    it('verifies frozen principle "If Nebula cannot reliably observe a security decision, Nebula cannot reliably defend or investigate it."', () => {
      assert.equal(
        S09_FROZEN_PRINCIPLE,
        'If Nebula cannot reliably observe a security decision, Nebula cannot reliably defend or investigate it.',
      );
      assert.ok(
        S09_PRINCIPLES.S09_P01_OBSERVATION_NOT_AUTHORIZATION.includes(
          'The observation layer must never become an authorization mechanism',
        ),
      );
    });

    it('asserts all 15 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S09_INVARIANTS);
      assert.equal(keys.length, 15);
      assert.equal(S09_INVARIANTS['S09-I01'].failClosedDecision, 'TENANT_ATTRIBUTION_ENFORCED');
      assert.equal(S09_INVARIANTS['S09-I03'].failClosedDecision, 'CROSS_TENANT_AUDIT_BLOCKED');
      assert.equal(S09_INVARIANTS['S09-I04'].failClosedDecision, 'GX_AUDIT_ACCESS_BLOCKED');
      assert.equal(S09_INVARIANTS['S09-I06'].failClosedDecision, 'CLIENT_AUDIT_FORGERY_BLOCKED');
      assert.equal(S09_INVARIANTS['S09-I08'].failClosedDecision, 'AUDIT_SECRET_REDACTED');
      assert.equal(S09_INVARIANTS['S09-I14'].failClosedDecision, 'CRITICAL_AUDIT_STORAGE_FAILURE');
      assert.equal(S09_INVARIANTS['S09-I15'].failClosedDecision, 'DIRECT_API_AUDIT_BYPASS_BLOCKED');
    });
  });

  describe('2. 50-Vector Attack Matrix Consistency', () => {
    it('matches exact 50 attack vector entries', () => {
      assert.equal(S09_ATTACK_MATRIX.length, 50);
      for (let i = 1; i <= 50; i++) {
        const id = `S09-${i < 10 ? '0' + i : i}`;
        const found = S09_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.expectedDecision);
      }
    });
  });

  describe('3. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS09Certification(S09_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS09Certification(S09_SECONDARY_GATE), true);
    });
  });
});
