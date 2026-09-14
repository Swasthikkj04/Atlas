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
  S10_CERTIFICATION_STATEMENT,
  S10_SECONDARY_GATE,
  S10_FROZEN_PRINCIPLE,
  S10_PRINCIPLES,
  S10_INVARIANTS,
  S10_ATTACK_MATRIX,
  verifyS10Certification,
} from './s-10-dependency-supply-chain.contract.ts';

describe('S-10 — Dependency & Supply Chain Security Web Contract Spec', () => {
  describe('1. Web Security Contract & Invariants', () => {
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

    it('verifies frozen principle "Trust the artifact, not the package name."', () => {
      assert.equal(S10_FROZEN_PRINCIPLE, 'Trust the artifact, not the package name.');
      assert.ok(
        S10_PRINCIPLES.S10_P01_TRUST_THE_ARTIFACT.includes(
          'Trust the artifact, not the package name.',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P02_DETERMINISTIC_LOCKFILE_GRAPH.includes(
          'Deterministic Lockfile Graph',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P03_COMPLETE_TREE_VISIBILITY.includes(
          'Transitive Dependency Visibility',
        ),
      );
      assert.ok(
        S10_PRINCIPLES.S10_P04_FAIL_CLOSED_SUPPLY_CHAIN.includes('Fail Closed'),
      );
    });

    it('asserts all 15 P0 security invariants exist in Web contract', () => {
      const keys = Object.keys(S10_INVARIANTS);
      assert.equal(keys.length, 15);
      assert.equal(S10_INVARIANTS['S10-I01'].failClosedDecision, 'LOCKFILE_INTEGRITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I02'].failClosedDecision, 'FLOATING_VERSION_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I03'].failClosedDecision, 'TRANSITIVE_VISIBILITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I04'].failClosedDecision, 'VULNERABILITY_GATE_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I05'].failClosedDecision, 'DEPENDENCY_INTEGRITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I06'].failClosedDecision, 'REGISTRY_TRUST_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I07'].failClosedDecision, 'DEPENDENCY_CONFUSION_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I08'].failClosedDecision, 'TYPOSQUATTING_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I09'].failClosedDecision, 'INSTALL_SCRIPT_GOVERNED');
      assert.equal(S10_INVARIANTS['S10-I10'].failClosedDecision, 'TOOLCHAIN_INTEGRITY_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I11'].failClosedDecision, 'DEPENDENCY_SECRET_BLOCKED');
      assert.equal(S10_INVARIANTS['S10-I12'].failClosedDecision, 'DEPENDENCY_MINIMIZATION_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I13'].failClosedDecision, 'PROVENANCE_TRACKED');
      assert.equal(S10_INVARIANTS['S10-I14'].failClosedDecision, 'REPRODUCIBLE_BUILD_ENFORCED');
      assert.equal(S10_INVARIANTS['S10-I15'].failClosedDecision, 'FAIL_CLOSED_SUPPLY_CHAIN_ENFORCED');
    });
  });

  describe('2. 40-Vector Attack Matrix Consistency', () => {
    it('matches exact 40 attack vector entries', () => {
      assert.equal(S10_ATTACK_MATRIX.length, 40);
      for (let i = 1; i <= 40; i++) {
        const id = `S10-${i < 10 ? '0' + i : i}`;
        const found = S10_ATTACK_MATRIX.find((v) => v.id === id);
        assert.ok(found);
        assert.ok(found?.expectedDecision);
      }
    });
  });

  describe('3. Certification Verification', () => {
    it('validates canonical certification statement and secondary gate', () => {
      assert.equal(verifyS10Certification(S10_CERTIFICATION_STATEMENT), true);
      assert.equal(verifyS10Certification(S10_SECONDARY_GATE), true);
    });

    it('rejects tampered certification statements', () => {
      assert.equal(verifyS10Certification(''), false);
      assert.equal(verifyS10Certification('Unauthorized release claim'), false);
    });
  });
});
