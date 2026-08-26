import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSnapshotImmutability,
  validateChangeLineageBoundary,
  resolveTrustedSnapshotOnJobCompletion,
  DATA_INTEGRITY_HARD_INVARIANTS,
} from './contracts/data-integrity.contract.ts';
import type { InfrastructureSnapshotDto } from '../../types/api/snapshot.dto.ts';

describe('WX-804: Data Integrity & Historical Truth Architecture Specifications', () => {
  const mockSnapshot1: InfrastructureSnapshotDto = {
    id: 'snp-stripe-001',
    domainId: 'dom-stripe-prod',
    createdAt: '2026-08-01T10:00:00.000Z',
    technologies: ['NGINX'],
  };

  const mockSnapshot2: InfrastructureSnapshotDto = {
    id: 'snp-stripe-002',
    domainId: 'dom-stripe-prod',
    createdAt: '2026-08-02T10:00:00.000Z',
    technologies: ['NGINX'],
  };

  const mockForeignSnapshot: InfrastructureSnapshotDto = {
    id: 'snp-foreign-999',
    domainId: 'dom-competitor-prod',
    createdAt: '2026-08-02T10:00:00.000Z',
    technologies: ['Apache'],
  };

  describe('1. Immutable Snapshot Truth', () => {
    it('validates unmodified snapshot persistence', () => {
      const result = validateSnapshotImmutability(mockSnapshot1, { ...mockSnapshot1 });
      assert.equal(result.isValid, true);
    });

    it('strictly denies mutation of immutable domainId or timestamp', () => {
      const mutatedDomain = validateSnapshotImmutability(mockSnapshot1, {
        ...mockSnapshot1,
        domainId: 'dom-mutated',
      });
      assert.equal(mutatedDomain.isValid, false);
      assert.equal(mutatedDomain.reason, 'IMMUTABLE_DOMAIN_ID_MUTATION_PROHIBITED');

      const mutatedTime = validateSnapshotImmutability(mockSnapshot1, {
        ...mockSnapshot1,
        createdAt: '2026-08-15T00:00:00.000Z',
      });
      assert.equal(mutatedTime.isValid, false);
      assert.equal(mutatedTime.reason, 'IMMUTABLE_TIMESTAMP_MUTATION_PROHIBITED');
    });
  });

  describe('2. Change History Lineage Boundary', () => {
    it('allows change comparison when snapshots belong to the same domain', () => {
      const result = validateChangeLineageBoundary({
        previousSnapshotDomainId: mockSnapshot1.domainId,
        currentSnapshotDomainId: mockSnapshot2.domainId,
      });
      assert.equal(result.isValid, true);
    });

    it('strictly prohibits stitching change history across different domains (P0)', () => {
      const result = validateChangeLineageBoundary({
        previousSnapshotDomainId: mockSnapshot1.domainId,
        currentSnapshotDomainId: mockForeignSnapshot.domainId,
      });
      assert.equal(result.isValid, false);
      assert.equal(result.reason, 'CROSS_DOMAIN_CHANGE_LINEAGE_PROHIBITED');
    });
  });

  describe('3. Preservation of Trusted Baseline on Understanding Failure', () => {
    it('preserves prior trusted snapshot when a new understanding job fails or is cancelled', () => {
      const onFailedJob = resolveTrustedSnapshotOnJobCompletion({
        lastTrustedSnapshot: mockSnapshot1,
        jobStatus: 'FAILED',
      });

      assert.equal(onFailedJob.activeTrustedSnapshot?.id, 'snp-stripe-001');
      assert.ok(onFailedJob.statusExplanation.includes('Prior trusted snapshot baseline preserved'));

      const onCancelledJob = resolveTrustedSnapshotOnJobCompletion({
        lastTrustedSnapshot: mockSnapshot1,
        jobStatus: 'CANCELLED',
      });

      assert.equal(onCancelledJob.activeTrustedSnapshot?.id, 'snp-stripe-001');
    });

    it('updates trusted baseline when job completes successfully', () => {
      const onCompletedJob = resolveTrustedSnapshotOnJobCompletion({
        lastTrustedSnapshot: mockSnapshot1,
        jobStatus: 'COMPLETED',
        completedSnapshot: mockSnapshot2,
      });

      assert.equal(onCompletedJob.activeTrustedSnapshot?.id, 'snp-stripe-002');
      assert.ok(onCompletedJob.statusExplanation.includes('New infrastructure snapshot successfully established'));
    });
  });

  describe('4. P0 Data Integrity Invariants Certification', () => {
    it('certifies all 10 canonical data integrity hard invariants', () => {
      assert.equal(DATA_INTEGRITY_HARD_INVARIANTS.length, 10);
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_HISTORICAL_SNAPSHOT_MUTATION'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_SNAPSHOT_LINEAGE_CORRUPTION'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_FINDING_SNAPSHOT_DRIFT'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_EVIDENCE_LINEAGE_BREAK'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_CROSS_DOMAIN_LINEAGE'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_ORPHAN_HISTORICAL_RECORDS'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_FAILED_JOB_STATE_CORRUPTION'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_TRUSTED_STATE_REPLACEMENT_ON_FAILURE'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_INVALID_REFERENTIAL_RELATIONSHIPS'));
      assert.ok(DATA_INTEGRITY_HARD_INVARIANTS.includes('NO_HISTORICAL_REINTERPRETATION'));
    });
  });
});
