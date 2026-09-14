/**
 * H8 — Final Intelligence Integrity & Production Hardening Contracts
 *
 * Enforces the Golden H8 Invariant:
 * Observed Evidence -> Technology / Behavior -> Topology -> Change Forensics -> Posture & Impact -> Unified Narrative -> Investigation / Evidence -> Every UI Surface -> ONE CURRENT TRUTH.
 * Never: Missing evidence -> inference -> assertion -> finding.
 */

export const H8_CERTIFIED_INVARIANTS = {
  H8_PIPELINE_INTEGRITY_STRICT: true,
  H8_EVIDENCE_LINEAGE_COMPLETENESS: true,
  H8_CONFIDENCE_MONOTONIC_ORDERING: true,
  H8_CURRENT_HISTORICAL_TRUTH_SEPARATION: true,
  H8_CROSS_SURFACE_CONTRADICTION_SWEEP: true,
  H8_ADVERSARIAL_TRUTH_RESILIENCE: true,
  H8_SECURITY_AUTHORIZATION_HARDENING: true,
  H8_DETERMINISM_AND_IDEMPOTENCY: true,
  H8_CACHE_CONVERGENCE_INTEGRITY: true,
  H8_PRODUCTION_FAILURE_RESILIENCE: true,
  H8_MASTER_INTELLIGENCE_CERTIFICATION: true,
  H8_FINAL_PRODUCTION_GATE_SEALED: true,
} as const;

export type IntelligenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';

export interface EvidenceLineageProof {
  readonly claim: string;
  readonly layer: string;
  readonly technology?: string;
  readonly observationSource: string;
  readonly rawEvidenceSnippet: string;
  readonly snapshotId: string;
  readonly verifiedAt: string;
  readonly isCryptographicallyBacked: boolean;
}

export interface PipelineIntegrityAuditResult {
  readonly isValid: boolean;
  readonly ungroundedClaims: string[];
  readonly ungroundedTechnologies: string[];
  readonly ungroundedRelationships: string[];
  readonly ungroundedFindings: string[];
  readonly details: string[];
}

export interface ConfidenceIntegrityAuditResult {
  readonly isMonotonic: boolean;
  readonly evidenceConfidence: IntelligenceConfidence;
  readonly interpretationConfidence: IntelligenceConfidence;
  readonly narrativeConfidence: IntelligenceConfidence;
  readonly violations: string[];
}

export interface CurrentVsHistoricalSeparationAuditResult {
  readonly isSeparated: boolean;
  readonly leakedHistoricalFindings: string[];
  readonly leakedPreviousTechnologies: string[];
  readonly ghostBadgesDetected: string[];
  readonly violations: string[];
}

export interface AdversarialScenarioResult {
  readonly scenarioId: string;
  readonly title: string;
  readonly passed: boolean;
  readonly expectedBehavior: string;
  readonly observedBehavior: string;
  readonly notes?: string;
}

export interface DeterminismAuditResult {
  readonly isDeterministic: boolean;
  readonly iterationsRun: number;
  readonly duplicateEntitiesFound: number;
  readonly orderingStable: boolean;
  readonly divergenceDetails: string[];
}

export interface SecurityAuthorizationAuditResult {
  readonly isSecure: boolean;
  readonly tenantIsolated: boolean;
  readonly directUrlTamperResistant: boolean;
  readonly credentialsSanitized: boolean;
  readonly auditNotes: string[];
}

export interface MasterIntelligenceIntegrityReport {
  readonly snapshotId: string;
  readonly domainName: string;
  readonly timestamp: string;
  readonly pipelineIntegrity: PipelineIntegrityAuditResult;
  readonly evidenceLineageCount: number;
  readonly confidenceIntegrity: ConfidenceIntegrityAuditResult;
  readonly currentHistoricalSeparation: CurrentVsHistoricalSeparationAuditResult;
  readonly adversarialResults: AdversarialScenarioResult[];
  readonly determinismAudit: DeterminismAuditResult;
  readonly securityAudit: SecurityAuthorizationAuditResult;
  readonly isFullyCertified: boolean;
}
