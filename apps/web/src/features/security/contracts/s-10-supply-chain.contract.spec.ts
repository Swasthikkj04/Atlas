import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  S10_TICKET_ID,
  S10_PHASE,
  S10_PRIORITY,
  S10_TYPE,
  S10_STATUS,
  S10_DEPENDS_ON,
  S10_BLOCKS,
  S10_CANONICAL_GATE,
  S10_SECONDARY_GATE,
  S10_FROZEN_PRINCIPLE,
  S10_PRINCIPLES,
  S10_INVARIANTS,
  S10_50_ATTACK_MATRIX,
  verifyS10Certification,
} from './s-10-supply-chain.contract.ts';

describe('S-10 — Master Supply Chain Security Web Contract Spec', () => {
  describe('1. Web Security Contract & 20 Invariants', () => {
    it('verifies metadata, dependencies, and blocking status', () => {
      assert.equal(S10_TICKET_ID, 'S-10');
      assert.equal(S10_PHASE, 'Production Security Hardening');
      assert.equal(S10_PRIORITY, 'P0 — BLOCKING');
      assert.equal(S10_STATUS, 'CERTIFIED_DEPENDENCY_SUPPLY_CHAIN_SECURITY');
      assert.deepEqual(S10_DEPENDS_ON, [
        'S-01',
        'S-02',
        'S-03',
        'S-04',
        'S-05',
        'S-06',
        'S-07',
        'S-08',
        'S-09',
      ]);
      assert.ok(S10_BLOCKS.includes('Production Release'));
      assert.ok(S10_BLOCKS.includes('S-11'));
      assert.ok(S10_BLOCKS.includes('S-12'));
    });

    it('verifies frozen principle "The software we depend on is part of our security boundary."', () => {
      assert.equal(
        S10_FROZEN_PRINCIPLE,
        'The software we depend on is part of our security boundary.',
      );
      assert.ok(
        S10_PRINCIPLES.S10_P01_SECURITY_BOUNDARY_DEPENDENCY.includes(
          'The software we depend on is part of our security boundary.',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P02_NEVER_ASSUME_SAFETY.includes(
          'a popular package is automatically safe',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P03_DETERMINISTIC_LOCKFILE_GRAPH.includes(
          'Deterministic Lockfile Graph',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P04_TRANSITIVE_GOVERNANCE.includes(
          'Transitive Dependency Governance',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P05_FAIL_CLOSED_SUPPLY_CHAIN.includes('Fail Closed'),
      );
    });

    it('asserts all 20 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S10_INVARIANTS);
      assert.equal(keys.length, 20);
      assert.equal(S10_INVARIANTS['S10-I01'].failClosedDecision, 'LOCKFILE_INTEGRITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I02'].failClosedDecision, 'IMMUTABLE_RESOLUTION_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I03'].failClosedDecision, 'UNAUTHORIZED_INTRODUCTION_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I04'].failClosedDecision, 'TRANSITIVE_GOVERNANCE_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I05'].failClosedDecision, 'VULNERABILITY_BLOCKING_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I06'].failClosedDecision, 'DEPENDENCY_CONFUSION_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I07'].failClosedDecision, 'TYPOSQUATTING_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I08'].failClosedDecision, 'REGISTRY_TRUST_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I09'].failClosedDecision, 'PACKAGE_INTEGRITY_VERIFIED');
      assert.equal(S10_INVARIANTS['S10-I10'].failClosedDecision, 'POST_INSTALL_SCRIPT_GOVERNED');
      assert.equal(S10_INVARIANTS['S10-I11'].failClosedDecision, 'BUILD_TOOL_SECURITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I12'].failClosedDecision, 'PRODUCTION_MINIMIZATION_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I13'].failClosedDecision, 'LIFECYCLE_MANAGEMENT_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I14'].failClosedDecision, 'LICENSE_GOVERNANCE_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I15'].failClosedDecision, 'MALICIOUS_PACKAGE_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I16'].failClosedDecision, 'REPRODUCIBLE_BUILD_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I17'].failClosedDecision, 'CICD_GATE_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I18'].failClosedDecision, 'SECRET_EXPOSURE_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I19'].failClosedDecision, 'UPDATE_DISCIPLINE_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I20'].failClosedDecision, 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED');
    });
  });

  describe('2. 50-Vector Attack Matrix Consistency', () => {
    it('matches exact 50 attack vector entries', () => {
      assert.equal(S10_50_ATTACK_MATRIX.length, 50);
      for (let i = 1; i <= 50; i++) {
        const id = `S10-${i < 10 ? '0' + i : i}`;
        const found = S10_50_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.failClosedDecision);
      }
    });
  });

  describe('3. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS10Certification(S10_CANONICAL_GATE), true);
      assert.equal(verifyS10Certification(S10_SECONDARY_GATE), true);
    });

    it('rejects tampered certification statements', () => {
      assert.equal(verifyS10Certification(''), false);
      assert.equal(verifyS10Certification('Unauthorized release claim'), false);
    });
  });
});
