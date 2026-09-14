import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../../infrastructure/discovery/technology/contracts';
import {
  SecurityPostureRating,
  ArchitecturePostureRating,
  ExposureLevel,
} from './architectural-posture.interface';
import { TechnologyDifference } from './technology-change.interface';
import {
  UnifiedNarrativeLevel1,
  UnifiedNarrativeLevel2,
  UnifiedNarrativeLevel3,
} from './unified-narrative.interface';

/**
 * H7 — Infrastructure Intelligence Consistency & Cross-Surface Truth Contracts
 *
 * Enforces the Golden Nebula Invariant:
 * "One verified observation must produce one consistent truth everywhere it appears."
 */

export interface AuthoritativeTechnologyTruth {
  readonly name: string;
  readonly layer: TopologyLayer;
  readonly version?: string;
  readonly confidence: TechnologyConfidenceLevel;
  readonly evidence: string[];
  readonly whatThisDoesNotProve: string[];
}

export interface AuthoritativeTopologyHop {
  readonly hopIndex: number;
  readonly title: string;
  readonly layer: TopologyLayer;
  readonly technologyName?: string;
  readonly status: 'OBSERVED' | 'UNOBSERVED' | 'SEALED';
  readonly isDirectConnection: boolean;
}

export interface AuthoritativeFindingTruth {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  readonly status: 'ACTIVE' | 'RESOLVED' | 'MUTED';
  readonly isCompliant: boolean;
  readonly snapshotId: string;
  readonly resolvingSnapshotId?: string;
  readonly evidence: string[];
}

export interface AuthoritativeKnownUnknown {
  readonly dimension: string;
  readonly status: 'UNOBSERVED' | 'MASKED' | 'UNKNOWN';
  readonly explanation: string;
}

export interface AuthoritativeEvidenceLineageItem {
  readonly id: string;
  readonly claim: string;
  readonly layer?: TopologyLayer;
  readonly technology?: string;
  readonly source: string;
  readonly rawEvidence: string;
  readonly timestamp: string;
  readonly confidence: TechnologyConfidenceLevel;
  readonly snapshotId: string;
}

export interface AuthoritativeIntelligenceStateDto {
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly timestamp: string;
  readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION';
  readonly technologies: AuthoritativeTechnologyTruth[];
  readonly ingressPath: AuthoritativeTopologyHop[];
  readonly activeFindings: AuthoritativeFindingTruth[];
  readonly resolvedFindings: AuthoritativeFindingTruth[];
  readonly changeEvents: TechnologyDifference[];
  readonly posture: {
    readonly securityRating: SecurityPostureRating;
    readonly architectureRating: ArchitecturePostureRating;
    readonly exposureLevel: ExposureLevel;
    readonly activeControls: string[];
    readonly securityGaps: string[];
    readonly summary: string;
  };
  readonly whatMattersNow: {
    readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION';
    readonly headline: string;
    readonly narrative: string;
    readonly primaryAction: string;
  };
  readonly unifiedNarrative: {
    readonly level1: UnifiedNarrativeLevel1;
    readonly level2: UnifiedNarrativeLevel2;
    readonly level3: UnifiedNarrativeLevel3;
  };
  readonly knownUnknowns: AuthoritativeKnownUnknown[];
  readonly evidenceLineage: AuthoritativeEvidenceLineageItem[];
  readonly confidence: {
    readonly overall: TechnologyConfidenceLevel;
    readonly score: number;
    readonly rationale: string;
  };
}

export type ContradictionDimension =
  | 'FINDING_LIFECYCLE'
  | 'TECHNOLOGY_TRUTH'
  | 'TOPOLOGY_DRIFT'
  | 'CONFIDENCE_MISMATCH'
  | 'KNOWN_UNKNOWNS'
  | 'CHANGE_TRUTH'
  | 'POSTURE_ALIGNMENT'
  | 'NARRATIVE_FIDELITY';

export interface CrossSurfaceContradiction {
  readonly dimension: ContradictionDimension;
  readonly surfaceA: string;
  readonly surfaceB: string;
  readonly message: string;
  readonly severity: 'FATAL' | 'WARNING';
}

export interface SurfaceIntelligenceProjection {
  readonly surfaceName: string;
  readonly snapshotId: string;
  readonly status?: 'STABLE' | 'CHANGED' | 'ATTENTION';
  readonly technologies?: Array<{
    name: string;
    layer: string;
    version?: string;
  }>;
  readonly topologyHops?: string[];
  readonly activeFindings?: string[];
  readonly resolvedFindings?: string[];
  readonly confidenceLevel?: TechnologyConfidenceLevel;
  readonly knownUnknowns?: string[];
  readonly narrativeClaims?: string[];
}

export interface IntelligenceConsistencyValidationResult {
  readonly isConsistent: boolean;
  readonly snapshotId: string;
  readonly checkedSurfaces: string[];
  readonly contradictions: CrossSurfaceContradiction[];
  readonly timestamp: string;
}
