import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';
import {
  TechnologyEvidence,
  TopologyLayer,
} from '../../../infrastructure/discovery/technology/contracts';

/**
 * T23 — Canonical Infrastructure Delta States
 */
export type InfrastructureDeltaState =
  'ADDED' | 'REMOVED' | 'MODIFIED' | 'STABLE';

/**
 * T23 — Change Significance Classification
 */
export type ChangeSignificance =
  'INFORMATIONAL' | 'NOTABLE' | 'IMPORTANT' | 'CRITICAL';

/**
 * Authoritative Change Categories
 */
export type ChangeCategory =
  | 'technology'
  | 'hosting'
  | 'edge_cdn'
  | 'tls_ssl'
  | 'security_headers'
  | 'dns'
  | 'http'
  | 'network'
  | 'performance';

/**
 * T23.5 — Structured Forensic Explanation Model
 *
 * Answers:
 * 1. WHAT CHANGED
 * 2. WHY WE BELIEVE IT
 * 3. WHAT IT MEANS
 * 4. WHAT WE CANNOT CONCLUDE
 * 5. IMPACT
 * 6. ATTENTION
 */
export interface ForensicExplanation {
  readonly whatChanged: string;
  readonly whyWeBelieveIt: string;
  readonly whatItMeans: string;
  readonly whatWeCannotConclude: string;
  readonly impact: string;
  readonly attention: string;
  readonly attentionRequired: boolean;
}

/**
 * T23 — Canonical Forensic Change Event
 */
export interface ForensicChangeEvent {
  readonly id: string;
  readonly domainId: string;
  readonly previousSnapshotId?: string;
  readonly currentSnapshotId: string;
  readonly title: string;
  readonly summary: string;
  readonly state: InfrastructureDeltaState;
  readonly significance: ChangeSignificance;
  readonly category: ChangeCategory;
  readonly module: FindingModule;
  readonly findingCategory: FindingCategory;
  readonly changeType: ChangeType;
  readonly severity: ChangeSeverity;
  readonly layer?: TopologyLayer;
  readonly blastRadiusLayers: TopologyLayer[];
  readonly explanation: ForensicExplanation;
  readonly technologyId?: string;
  readonly technologyName?: string;
  readonly previousState?: any;
  readonly currentState?: any;
  readonly previousEvidenceReferences: string[];
  readonly currentEvidenceReferences: string[];
  readonly detectedAt: Date;
}

/**
 * T23 — Temporal Delta Computation Result
 */
export interface TemporalDeltaResult {
  readonly hasMeaningfulChanges: boolean;
  readonly totalChangesCount: number;
  readonly changesBySignificance: {
    readonly critical: number;
    readonly important: number;
    readonly notable: number;
    readonly informational: number;
  };
  readonly attentionRequiredCount: number;
  readonly events: ForensicChangeEvent[];
  readonly suppressedNoiseCount: number;
  readonly previousSnapshotId?: string;
  readonly currentSnapshotId?: string;
  readonly previousUnderstandingAt?: Date;
  readonly currentUnderstandingAt?: Date;
}
