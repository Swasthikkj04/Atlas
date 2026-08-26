/**
 * Authoritative Public Infrastructure Finding API DTO Contracts.
 *
 * Findings represent backend-analyzed insights, risks, and health determinations.
 * The frontend displays this intelligence and its lineage; it never infers findings locally.
 */

export type FindingSeverity =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFORMATIONAL'
  | 'SUCCESS';

export type FindingCategory =
  | 'DNS'
  | 'TLS'
  | 'HTTP'
  | 'INFRASTRUCTURE'
  | 'GOVERNANCE'
  | 'SECURITY';

export type FindingStatus = 'ACTIVE' | 'RESOLVED' | 'MUTED' | string;

export type ProcessingStatus =
  | 'COMPLETED'
  | 'PARTIAL'
  | 'INVALID'
  | 'FAILED'
  | string;

export type ProcessingEvidenceStatus =
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'INFO'
  | string;

export interface ProcessingEvidenceItemDto {
  readonly step: string;
  readonly status: ProcessingEvidenceStatus;
  readonly description?: string;
  readonly timestamp?: string | Date;
  readonly metadata?: Record<string, unknown>;
}

export interface FindingEvidenceLineageDto {
  readonly snapshotId: string;
  readonly observationKey: string;
  readonly observedValue?: string | null;
  readonly ruleId?: string;
  readonly evaluationTimestamp?: string;
}

export type FindingConfidence =
  | 'AUTHORITATIVE'
  | 'SUPPORTED'
  | 'CONTEXTUAL'
  | 'INCONCLUSIVE'
  | string;

export type RiskClassification =
  | 'CONFIRMED_SECURITY_CONDITION'
  | 'SECURITY_HARDENING_GAP'
  | 'OPERATIONAL_OBSERVATION'
  | 'INFORMATIONAL_OBSERVATION'
  | string;

export interface InfrastructureFindingDto {
  readonly id: string;
  readonly domainId: string;
  readonly snapshotId: string;
  readonly domainName?: string;
  readonly category: FindingCategory | string;
  readonly severity: FindingSeverity | string;
  readonly confidence?: FindingConfidence;
  readonly riskClassification?: RiskClassification;
  readonly severityRationale?: string;
  readonly whatThisDoesNotProve?: string;
  readonly status: FindingStatus;
  readonly state?: string;
  readonly title: string;
  readonly description?: string;
  readonly explanation: string;
  readonly remediation?: string | null;
  readonly processingStatus?: ProcessingStatus;
  readonly processingSummary?: string;
  readonly processingEvidence?: readonly ProcessingEvidenceItemDto[];
  readonly lineage?: FindingEvidenceLineageDto;
  readonly detectedAt: string;
  readonly createdAt?: string | Date;
  readonly resolvedAt?: string | null;
  readonly rule?: RuleExplainabilityDto;
  readonly observations?: readonly FindingObservationDto[];
  readonly evidence?: readonly FindingEvidenceDto[];
  readonly timeline?: {
    readonly firstDetectedAt?: string | Date;
    readonly lastVerifiedAt?: string | Date;
    readonly state?: string;
  };
  readonly recommendations?: readonly {
    readonly title: string;
    readonly description: string;
    readonly priority?: string;
  }[];
}

export interface FindingListResponseDto {
  readonly findings: readonly InfrastructureFindingDto[];
  readonly total: number;
}

export type ObservationState =
  | 'OBSERVED'
  | 'MISSING'
  | 'UNKNOWN'
  | 'FAILED'
  | 'NON_COMPLIANT'
  | string;

export interface FindingObservationDto {
  readonly key: string;
  readonly state: ObservationState;
  readonly observedAt: string;
  readonly evidenceRef: string;
  readonly value?: string | null;
}

export interface FindingEvidenceDto {
  readonly evidenceId: string;
  readonly collector: string;
  readonly collectionTime: string;
  readonly category: string;
  readonly integrityStatus: 'VERIFIED' | 'UNVERIFIED' | string;
  readonly rawUrl: string;
  readonly hashSha256?: string;
  readonly target?: string;
  readonly responseStatus?: number;
  readonly requestMethod?: string;
  readonly protocolVersion?: string;
  readonly payload?: string;
}

export interface RuleExplainabilityDto {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly name: string;
  readonly category: string;
  readonly evaluationLogic: string;
}

export interface FindingEvidenceResponseDto {
  readonly findingId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly snapshotId: string;
  readonly rule?: RuleExplainabilityDto;
  readonly observations: readonly FindingObservationDto[];
  readonly evidence: readonly FindingEvidenceDto[];
}
