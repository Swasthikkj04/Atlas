/**
 * H6 — Investigation Continuity & Evidence Navigation Contracts.
 *
 * Defines the canonical data structures and validation schemas for preserving
 * complete operator context across multi-hop investigations:
 * Narrative -> Evidence -> Finding -> Historical Diff -> Raw Telemetry -> Return.
 */

export type InvestigationSourceSurface =
  'overview' | 'findings' | 'changes' | 'infrastructure' | 'memory';

export type InvestigationEntityType =
  'technology' | 'finding' | 'change' | 'observation' | 'snapshot' | 'control';

export interface InvestigationContextDto {
  readonly domainId: string;
  readonly domainName: string;
  readonly sourceSurface: InvestigationSourceSurface;
  readonly sourceSection?: string;
  readonly entityType: InvestigationEntityType;
  readonly entityId: string;
  readonly entityName?: string;
  readonly snapshotId: string;
  readonly findingId?: string;
  readonly evidenceId?: string;
  readonly disclosureLevel?: 1 | 2 | 3;
  readonly filterState?: Record<string, string | number | boolean>;
  readonly scrollAnchor?: string;
  readonly timestamp?: string;
}

export interface InvestigationContextValidationResult {
  readonly isValid: boolean;
  readonly isAuthorized: boolean;
  readonly isExpired: boolean;
  readonly sanitizedContext: InvestigationContextDto | null;
  readonly fallbackDestination: {
    readonly surface: InvestigationSourceSurface;
    readonly section?: string;
    readonly reason: string;
  };
  readonly returnLabel: string;
}

export interface EvidenceDrawerItem {
  readonly id: string;
  readonly claim: string;
  readonly layer: string;
  readonly source: string;
  readonly rawEvidence: string;
  readonly timestamp: string;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
  readonly technology?: string;
  readonly level1Summary: string;
  readonly level2Meaning: string;
  readonly level3RawTelemetry: {
    readonly sourceType: string;
    readonly key?: string;
    readonly value?: string;
    readonly payload?: Record<string, any>;
    readonly snapshotId: string;
    readonly timestamp: string;
  };
}
