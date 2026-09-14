import { Severity } from '../enums/severity.enum';
import {
  FindingConfidence,
  RiskClassification,
} from './finding-result.interface';

/**
 * Certified S2 Invariants for Data Leakage & Debug Exposure Intelligence.
 */
export const S2_CERTIFIED_INVARIANTS = {
  S2_DEBUG_HEADER_EXPOSURE_INTEGRITY: true,
  S2_INTERNAL_TOPOLOGY_LEAKAGE_INTEGRITY: true,
  S2_STACK_TRACE_DISCLOSURE_INTEGRITY: true,
  S2_SENSITIVE_VALUE_REDACTION: true,
  S2_TECHNOLOGY_NEUTRAL_FIRST_REMEDIATION: true,
  S2_ANTI_OVERREACH_ENFORCEMENT: true,
  S2_LIFECYCLE_ACTIVE_RESOLVED_CONVERGENCE: true,
  S2_CROSS_SURFACE_CONSISTENCY: true,
} as const;

export type LeakageType =
  | 'DEBUG_HEADER'
  | 'INTERNAL_IP_ROUTING'
  | 'STACK_TRACE'
  | 'SQL_ERROR_LEAK'
  | 'DIAGNOSTIC_SOURCEMAP';

export interface NormalizedLeakageObservation {
  id: string;
  type: LeakageType;
  source: 'HEADER' | 'BODY' | 'STATUS_REASON';
  key: string;
  rawEvidenceRedacted: string;
  details: string;
  severity: Severity;
  confidence: FindingConfidence;
  riskClassification: RiskClassification;
  severityRationale: string;
  whatThisDoesNotProve: string;
  remediationSnippet: string;
  observationTimestamp: string;
  snapshotId?: string;
}

export interface DataLeakageAssessment {
  domain?: string;
  snapshotId?: string;
  totalFindings: number;
  debugHeaderFindings: NormalizedLeakageObservation[];
  internalTopologyFindings: NormalizedLeakageObservation[];
  stackTraceFindings: NormalizedLeakageObservation[];
  isHardened: boolean;
  summary: string;
}
