import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S07_TICKET_ID,
  S07_PHASE,
  S07_PRIORITY,
  S07_TYPE,
  S07_STATUS,
  S07_DEPENDS_ON,
  S07_BLOCKS,
  S07_CERTIFICATION_STATEMENT,
  S07_SECONDARY_GATE,
  S07_FROZEN_PRINCIPLE,
  S07_PRINCIPLES,
  S07_INVARIANTS,
  S07_ATTACK_MATRIX,
  verifyS07Certification,
} from './s-07-api-abuse.contract.ts';

describe('S-07 — API Abuse, Rate Limiting & DoS Resistance Web Contract Spec', () => {
  describe('1. Web Security Contract & Invariants', () => {
    it('verifies metadata, dependencies, and blocking status', () => {
      assert.equal(S07_TICKET_ID, 'S-07');
      assert.equal(S07_PHASE, 'Production Security Hardening');
      assert.equal(S07_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S07_STATUS, 'CERTIFIED_API_ABUSE_RATE_LIMIT_DOS_SECURITY');
      assert.deepEqual(S07_DEPENDS_ON, ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06']);
      assert.ok(S07_BLOCKS.includes('Production Release'));
    });

    it('verifies frozen principle "Availability is part of security"', () => {
      assert.equal(S07_FROZEN_PRINCIPLE, 'Availability is part of security.');
      assert.ok(S07_PRINCIPLES.S07_P01_AVAILABILITY_IS_SECURITY.includes('Authentication alone does not make an endpoint safe'));
      assert.ok(S07_PRINCIPLES.S07_P02_SERVER_ENFORCED_ADMISSION.includes('Frontend throttling is never considered a security boundary'));
    });

    it('asserts all 15 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S07_INVARIANTS);
      assert.equal(keys.length, 15);
      assert.equal(S07_INVARIANTS['S07-I01'].failClosedDecision, 'SERVER_ENFORCED_RATE_LIMIT');
      assert.equal(S07_INVARIANTS['S07-I04'].failClosedDecision, 'JOB_ADMISSION_ENFORCED');
      assert.equal(S07_INVARIANTS['S07-I08'].failClosedDecision, 'BRUTE_FORCE_BLOCKED');
      assert.equal(S07_INVARIANTS['S07-I14'].failClosedDecision, 'SAFE_429_RESPONSE_CONTRACT');
      assert.equal(S07_INVARIANTS['S07-I15'].failClosedDecision, 'FAIL_CLOSED_ABUSE_CONTROL');
    });
  });

  describe('2. 50-Vector Attack Matrix Consistency', () => {
    it('matches exact 50 attack vector entries', () => {
      assert.equal(S07_ATTACK_MATRIX.length, 50);
      for (let i = 1; i <= 50; i++) {
        const id = `S07-${i < 10 ? '0' + i : i}`;
        const found = S07_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.expectedDecision);
      }
    });
  });

  describe('3. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS07Certification(S07_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS07Certification(S07_SECONDARY_GATE), true);
    });
  });
});
