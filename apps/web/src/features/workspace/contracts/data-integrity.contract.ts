import type { InfrastructureSnapshotDto } from '../../../types/api/snapshot.dto.ts';
import type { JobStatus } from '../../../types/api/understanding.dto.ts';

/**
 * Authoritative Data Integrity & Historical Truth Contract (WX-804).
 *
 * Enforces historical immutability, referential lineage, and trusted-state
 * preservation across all discovery, snapshot, finding, and memory lifecycles.
 */

export interface LineageValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * Validates that an existing snapshot cannot have its immutable historical facts mutated.
 */
export function validateSnapshotImmutability(
  persistedSnapshot: InfrastructureSnapshotDto,
  candidateSnapshot: InfrastructureSnapshotDto
): LineageValidationResult {
  if (persistedSnapshot.id !== candidateSnapshot.id) {
    return {
      isValid: false,
      reason: 'SNAPSHOT_ID_MISMATCH',
    };
  }

  if (persistedSnapshot.domainId !== candidateSnapshot.domainId) {
    return {
      isValid: false,
      reason: 'IMMUTABLE_DOMAIN_ID_MUTATION_PROHIBITED',
    };
  }

  if (
    persistedSnapshot.createdAt &&
    candidateSnapshot.createdAt &&
    persistedSnapshot.createdAt !== candidateSnapshot.createdAt
  ) {
    return {
      isValid: false,
      reason: 'IMMUTABLE_TIMESTAMP_MUTATION_PROHIBITED',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates that Change History comparison lineage cannot cross domain boundaries.
 */
export function validateChangeLineageBoundary(params: {
  readonly previousSnapshotDomainId: string;
  readonly currentSnapshotDomainId: string;
}): LineageValidationResult {
  const { previousSnapshotDomainId, currentSnapshotDomainId } = params;

  if (!previousSnapshotDomainId || !currentSnapshotDomainId) {
    return {
      isValid: false,
      reason: 'MISSING_SNAPSHOT_DOMAIN_REFERENCE',
    };
  }

  if (previousSnapshotDomainId !== currentSnapshotDomainId) {
    return {
      isValid: false,
      reason: 'CROSS_DOMAIN_CHANGE_LINEAGE_PROHIBITED',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Preserves trusted snapshot state when an in-flight understanding job fails or is cancelled.
 *
 * Hard invariant: A failed job MUST NEVER overwrite or nullify the last trusted snapshot.
 */
export function resolveTrustedSnapshotOnJobCompletion(params: {
  readonly lastTrustedSnapshot: InfrastructureSnapshotDto | null;
  readonly jobStatus: JobStatus | 'CANCELLED';
  readonly completedSnapshot?: InfrastructureSnapshotDto | null;
}): {
  readonly activeTrustedSnapshot: InfrastructureSnapshotDto | null;
  readonly statusExplanation: string;
} {
  const { lastTrustedSnapshot, jobStatus, completedSnapshot } = params;

  if (jobStatus === 'COMPLETED' && completedSnapshot) {
    return {
      activeTrustedSnapshot: completedSnapshot,
      statusExplanation: 'New infrastructure snapshot successfully established as active baseline.',
    };
  }

  if (jobStatus === 'FAILED' || jobStatus === 'CANCELLED') {
    return {
      activeTrustedSnapshot: lastTrustedSnapshot,
      statusExplanation: 'Understanding job failed or cancelled. Prior trusted snapshot baseline preserved.',
    };
  }

  // PENDING or RUNNING
  return {
    activeTrustedSnapshot: lastTrustedSnapshot,
    statusExplanation: 'Understanding in progress. Displaying current trusted snapshot baseline.',
  };
}

/**
 * Ten Certified P0 Data Integrity Invariants (WX-804).
 */
export const DATA_INTEGRITY_HARD_INVARIANTS = [
  'NO_HISTORICAL_SNAPSHOT_MUTATION',
  'NO_SNAPSHOT_LINEAGE_CORRUPTION',
  'NO_FINDING_SNAPSHOT_DRIFT',
  'NO_EVIDENCE_LINEAGE_BREAK',
  'NO_CROSS_DOMAIN_LINEAGE',
  'NO_ORPHAN_HISTORICAL_RECORDS',
  'NO_FAILED_JOB_STATE_CORRUPTION',
  'NO_TRUSTED_STATE_REPLACEMENT_ON_FAILURE',
  'NO_INVALID_REFERENTIAL_RELATIONSHIPS',
  'NO_HISTORICAL_REINTERPRETATION',
] as const;
