import type {
  InfrastructureFindingDto,
  FindingObservationDto,
  FindingEvidenceDto,
} from '../../../types/api';

/**
 * WX-1020: Observation Truth & Finding Accuracy Contract.
 *
 * Core Truth Principle:
 * A finding is only as trustworthy as the observation that produced it.
 * Canonical chain:
 * Infrastructure Understanding -> Raw Observation -> Normalized Observation -> Rule Evaluation -> Finding -> Verified Snapshot -> Workspace Surface -> Investigation / Evidence.
 */

export type ObservationValidationStatus =
  | 'VALID'
  | 'LOOKUP_FAILED'
  | 'STALE_SNAPSHOT'
  | 'DOMAIN_MISMATCH'
  | 'UNVERIFIED';

export interface ObservationAuditResult {
  readonly isValid: boolean;
  readonly status: ObservationValidationStatus;
  readonly reason: string;
  readonly findingId: string;
  readonly snapshotId: string;
  readonly domainId: string;
  readonly ruleId?: string;
  readonly observedValue?: string | null;
}

export interface DnsObservationAuditParams {
  readonly recordType: 'TXT' | 'DMARC' | 'AAAA' | 'MX' | 'NS';
  readonly records: readonly (string | string[])[];
  readonly lookupStatus?: 'SUCCESS' | 'NODATA' | 'NOT_FOUND' | 'TIMEOUT' | 'SERVFAIL' | 'FAILED';
}

/**
 * Evaluates whether a DNS observation represents a valid basis for security findings.
 * Enforces: Lookup failure != absence.
 */
export function auditDnsObservation(params: DnsObservationAuditParams): {
  readonly canEvaluateFinding: boolean;
  readonly hasSpf?: boolean;
  readonly hasDmarc?: boolean;
  readonly isLookupFailed: boolean;
  readonly explanation: string;
} {
  const { recordType, records, lookupStatus } = params;

  if (
    lookupStatus === 'TIMEOUT' ||
    lookupStatus === 'SERVFAIL' ||
    lookupStatus === 'FAILED'
  ) {
    return {
      canEvaluateFinding: false,
      isLookupFailed: true,
      explanation: `DNS ${recordType} resolution failed with status ${lookupStatus}. Absence finding cannot be created.`,
    };
  }

  const flattened = records.map((r) => (Array.isArray(r) ? r.join('') : String(r)));

  if (recordType === 'TXT') {
    const hasSpf = flattened.some((r) => r.toLowerCase().includes('v=spf1'));
    return {
      canEvaluateFinding: true,
      hasSpf,
      isLookupFailed: false,
      explanation: hasSpf
        ? 'SPF record detected in authoritative DNS TXT observations.'
        : 'Authoritative DNS TXT records verified; no SPF policy is published.',
    };
  }

  if (recordType === 'DMARC') {
    const hasDmarc = flattened.some((r) =>
      r.trim().toLowerCase().startsWith('v=dmarc1')
    );
    return {
      canEvaluateFinding: true,
      hasDmarc,
      isLookupFailed: false,
      explanation: hasDmarc
        ? 'DMARC policy record detected in authoritative DNS observations.'
        : 'Authoritative DNS observations verified; no DMARC policy is published.',
    };
  }

  return {
    canEvaluateFinding: true,
    isLookupFailed: false,
    explanation: `Authoritative DNS ${recordType} observations verified.`,
  };
}

/**
 * Validates finding-to-snapshot affinity and domain boundary (WX-1020).
 */
export function validateFindingSnapshotAffinity(params: {
  readonly finding: InfrastructureFindingDto;
  readonly expectedDomainId: string;
  readonly currentSnapshotId?: string;
  readonly allowHistorical?: boolean;
}): ObservationAuditResult {
  const { finding, expectedDomainId, currentSnapshotId, allowHistorical = false } = params;

  if (finding.domainId !== expectedDomainId) {
    return {
      isValid: false,
      status: 'DOMAIN_MISMATCH',
      reason: `Finding belongs to domain ${finding.domainId}, expected ${expectedDomainId}.`,
      findingId: finding.id,
      snapshotId: finding.snapshotId,
      domainId: finding.domainId,
    };
  }

  if (
    currentSnapshotId &&
    !allowHistorical &&
    finding.snapshotId !== currentSnapshotId
  ) {
    return {
      isValid: false,
      status: 'STALE_SNAPSHOT',
      reason: `Finding belongs to historical snapshot ${finding.snapshotId}, current is ${currentSnapshotId}.`,
      findingId: finding.id,
      snapshotId: finding.snapshotId,
      domainId: finding.domainId,
    };
  }

  return {
    isValid: true,
    status: 'VALID',
    reason: 'Finding belongs to current verified snapshot and matching domain.',
    findingId: finding.id,
    snapshotId: finding.snapshotId,
    domainId: finding.domainId,
    ruleId: finding.lineage?.ruleId || finding.rule?.ruleId,
    observedValue: finding.lineage?.observedValue,
  };
}

/**
 * Audits complete investigation evidence traceability.
 */
export function validateInvestigationEvidence(params: {
  readonly finding: InfrastructureFindingDto;
  readonly observations?: readonly FindingObservationDto[];
  readonly evidence?: readonly FindingEvidenceDto[];
}): {
  readonly isTraceable: boolean;
  readonly hasRawEvidence: boolean;
  readonly observationSummary: string;
} {
  const { finding, observations = [], evidence = [] } = params;

  const hasLineage = !!finding.lineage?.snapshotId && !!finding.lineage?.observationKey;
  const hasObservations = observations.length > 0 || hasLineage;
  const hasRawEvidence = evidence.length > 0;

  return {
    isTraceable: hasObservations,
    hasRawEvidence,
    observationSummary: `Finding ${finding.id} backed by snapshot ${finding.snapshotId} with ${observations.length} observation(s) and ${evidence.length} raw evidence artifact(s).`,
  };
}
