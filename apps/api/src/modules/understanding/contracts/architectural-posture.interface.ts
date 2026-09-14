import {
  TopologyLayer,
  TechnologyConfidenceLevel,
} from '../../../infrastructure/discovery/technology/contracts';
import { TechnologyDifference } from './technology-change.interface';

export type SecurityPostureRating =
  'EXCELLENT' | 'GOOD' | 'ADEQUATE' | 'DEGRADED' | 'CRITICAL';

export type ArchitecturePostureRating =
  'MODERN_MULTI_TIER' | 'BUFFERED_GATEWAY' | 'FLAT_DIRECT' | 'INDETERMINATE';

export type ExposureLevel =
  'MINIMAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';

export type PostureImpactType =
  | 'SECURITY_REGRESSION'
  | 'SECURITY_IMPROVEMENT'
  | 'EXPOSURE_INCREASE'
  | 'EXPOSURE_REDUCTION'
  | 'ARCHITECTURAL_EVOLUTION'
  | 'TOPOLOGY_DRIFT'
  | 'NEUTRAL_DRIFT';

export interface SecurityPostureEvaluation {
  readonly rating: SecurityPostureRating;
  readonly tlsScore: number; // [0, 100]
  readonly headerScore: number; // [0, 100]
  readonly protectionLayer:
    'EDGE_PROTECTED' | 'GATEWAY_BUFFERED' | 'DIRECT_ORIGIN' | 'UNKNOWN';
  readonly summary: string;
  readonly activeControls: string[];
  readonly securityGaps: string[];
  readonly whyDegraded?: string;
}

export interface ArchitecturePostureEvaluation {
  readonly rating: ArchitecturePostureRating;
  readonly ingressDepth: number;
  readonly observedLayers: TopologyLayer[];
  readonly perimeterBoundary: 'PROTECTED' | 'SEALED' | 'EXPOSED';
  readonly summary: string;
  readonly rationale: string;
  readonly antiOverreachStatement: string;
}

export interface ExposurePostureEvaluation {
  readonly level: ExposureLevel;
  readonly disclosedBanners: string[];
  readonly leakedHeaders: string[];
  readonly debugTracesDisclosed: boolean;
  readonly summary: string;
}

export interface ObservableResilienceSignals {
  readonly hasAnycastRouting: boolean;
  readonly hasEdgeCdn: boolean;
  readonly hasHttp2Or3: boolean;
  readonly hasKeepAlive: boolean;
  readonly observableSignals: string[];
  readonly unobservedDimensions: string[];
}

export interface ChangeImpactAssessment {
  readonly impactType: PostureImpactType;
  readonly significance:
    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  readonly title: string;
  readonly narrative: string;
  readonly whatItMeans: string;
  readonly whatWeCannotConclude: string;
  readonly evidenceBefore?: string[];
  readonly evidenceAfter?: string[];
  readonly remediationRecommendation?: string;
}

export interface WhatMattersNowItem {
  readonly status: 'STABLE' | 'CHANGED' | 'ATTENTION' | 'RESOLVED';
  readonly title: string;
  readonly subtitle: string;
  readonly reason: string;
  readonly evidenceBefore?: string;
  readonly evidenceAfter?: string;
  readonly actionText?: string;
  readonly actionTarget?: 'findings' | 'changes' | 'overview' | 'memory';
  readonly lastVerified?: string;
}

export interface ArchitecturalPostureReport {
  readonly securityPosture: SecurityPostureEvaluation;
  readonly architecturePosture: ArchitecturePostureEvaluation;
  readonly exposurePosture: ExposurePostureEvaluation;
  readonly resilienceSignals: ObservableResilienceSignals;
  readonly impactAssessments: ChangeImpactAssessment[];
  readonly whatMattersNow: WhatMattersNowItem;
  readonly evaluatedAt: string;
}
