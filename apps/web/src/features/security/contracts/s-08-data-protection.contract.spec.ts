import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S08_TICKET_ID,
  S08_PHASE,
  S08_PRIORITY,
  S08_TYPE,
  S08_STATUS,
  S08_DEPENDS_ON,
  S08_BLOCKS,
  S08_CERTIFICATION_STATEMENT,
  S08_SECONDARY_GATE,
  S08_FROZEN_PRINCIPLE,
  S08_PRINCIPLES,
  S08_INVARIANTS,
  S08_ATTACK_MATRIX,
  verifyS08Certification,
} from './s-08-data-protection.contract.ts';

describe('S-08 — Data Protection & Privacy Web Contract Spec', () => {
  describe('1. Web Security Contract & Invariants', () => {
    it('verifies metadata, dependencies, and blocking status', () => {
      assert.equal(S08_TICKET_ID, 'S-08');
      assert.equal(S08_PHASE, 'Production Security Hardening');
      assert.equal(S08_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S08_STATUS, 'CERTIFIED_DATA_PROTECTION_PRIVACY');
      assert.deepEqual(S08_DEPENDS_ON, ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-07']);
      assert.ok(S08_BLOCKS.includes('Production Release'));
    });

    it('verifies frozen principle "Collect what is necessary. Expose what is justified. Retain only what is required."', () => {
      assert.equal(S08_FROZEN_PRINCIPLE, 'Collect what is necessary. Expose what is justified. Retain only what is required.');
      assert.ok(S08_PRINCIPLES.S08_P01_DATA_MINIMIZATION.includes('Nebula does not persist information merely because collectors can obtain it'));
      assert.ok(S08_PRINCIPLES.S08_P02_TENANT_DATA_ISOLATION.includes('All persistent intelligence remains strictly bound to the authenticated tenant'));
    });

    it('asserts all 15 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S08_INVARIANTS);
      assert.equal(keys.length, 15);
      assert.equal(S08_INVARIANTS['S08-I01'].failClosedDecision, 'UNCLASSIFIED_DATA_BLOCKED');
      assert.equal(S08_INVARIANTS['S08-I03'].failClosedDecision, 'TENANT_ISOLATION_ENFORCED');
      assert.equal(S08_INVARIANTS['S08-I06'].failClosedDecision, 'SENSITIVE_FIELD_STRIPPED');
      assert.equal(S08_INVARIANTS['S08-I07'].failClosedDecision, 'RAW_EVIDENCE_CONTAINED');
      assert.equal(S08_INVARIANTS['S08-I12'].failClosedDecision, 'ZERO_ORPHAN_DELETION_ENFORCED');
      assert.equal(S08_INVARIANTS['S08-I15'].failClosedDecision, 'FAIL_CLOSED_PRIVACY_ENFORCED');
    });
  });

  describe('2. 50-Vector Attack Matrix Consistency', () => {
    it('matches exact 50 attack vector entries', () => {
      assert.equal(S08_ATTACK_MATRIX.length, 50);
      for (let i = 1; i <= 50; i++) {
        const id = `S08-${i < 10 ? '0' + i : i}`;
        const found = S08_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.expectedDecision);
      }
    });
  });

  describe('3. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS08Certification(S08_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS08Certification(S08_SECONDARY_GATE), true);
    });
  });
});
