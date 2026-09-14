import { TechnologyConfidenceLevel } from '../../../infrastructure/discovery/technology/contracts';

/**
 * H5 — Unified Infrastructure Narrative Contracts
 *
 * Defines the synthesized, evidence-grounded, multi-tier narrative model
 * that unifies T1-T30, H1, H2, H3, H4, and WX-211 into a deterministic,
 * progressive-disclosure narrative without unevidenced leaps.
 */

export type NarrativeConfidenceLevel =
  'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';

export interface UnifiedNarrativeObservedLayer {
  readonly layer: string;
  readonly technologies: string[];
  readonly role: string;
  readonly confidence: NarrativeConfidenceLevel;
}

export interface UnifiedNarrativeArchitectureSection {
  readonly headline: string;
  readonly narrative: string;
  readonly observedLayers: UnifiedNarrativeObservedLayer[];
  readonly unobservedLayers: string[];
}

export interface UnifiedNarrativeJourneyHop {
  readonly hopIndex: number;
  readonly title: string;
  readonly layer: string;
  readonly detail: string;
  readonly status: 'OBSERVED' | 'UNOBSERVED' | 'SEALED';
}

export interface UnifiedNarrativeRequestJourney {
  readonly hops: UnifiedNarrativeJourneyHop[];
  readonly missingHopsExplanation: string | null;
  readonly journeySummary: string;
}

export interface UnifiedNarrativeForensicEventSummary {
  readonly id: string;
  readonly title: string;
  readonly whatChanged: string;
  readonly whatItMeans: string;
  readonly whatWeCannotConclude: string;
  readonly significance: string;
}

export interface UnifiedNarrativeEvolutionSection {
  readonly hasChanges: boolean;
  readonly changeCount: number;
  readonly evolutionNarrative: string;
  readonly recentForensicEvents: UnifiedNarrativeForensicEventSummary[];
}

export interface UnifiedNarrativeCurrentTruthSection {
  readonly lifecycleState: 'ACTIVE' | 'RESOLVED' | 'STABLE';
  readonly headline: string;
  readonly narrative: string;
  readonly activeFindingsCount: number;
  readonly resolvedFindingsCount: number;
  readonly whyTruthIsCurrent: string;
}

export interface UnifiedNarrativeKnownUnknownsSection {
  readonly explicitStatements: string[];
  readonly sealedPerimeterBoundaries: string[];
  readonly integrityNote: string;
}

export interface UnifiedNarrativeEvidenceLineageItem {
  readonly claim: string;
  readonly layer?: string;
  readonly technology?: string;
  readonly source: string;
  readonly rawEvidence: string;
  readonly timestamp: string;
  readonly confidence: NarrativeConfidenceLevel;
}

export interface UnifiedNarrativeEvidenceLineage {
  readonly items: UnifiedNarrativeEvidenceLineageItem[];
}

export interface UnifiedNarrativeLevel1 {
  readonly headline: string;
  readonly pathSummary: string;
  readonly oneLiner: string;
}

export interface UnifiedNarrativeLevel2 {
  readonly architectureMeaning: string;
  readonly layerRationale: string[];
  readonly evolutionContext: string;
  readonly postureContext: string;
  readonly unobservedDimensions: string[];
}

export interface UnifiedNarrativeLevel3 {
  readonly evidenceLineage: UnifiedNarrativeEvidenceLineageItem[];
  readonly rawObservationsSummary: string;
  readonly snapshotId: string;
  readonly timestamp: string;
}

export interface UnifiedNarrativeProgressiveDisclosure {
  readonly level1Understanding: UnifiedNarrativeLevel1;
  readonly level2Context: UnifiedNarrativeLevel2;
  readonly level3Evidence: UnifiedNarrativeLevel3;
}

export interface UnifiedInfrastructureNarrative {
  readonly domainName: string;
  readonly snapshotId: string;
  readonly evaluatedAt: string;
  readonly architecture: UnifiedNarrativeArchitectureSection;
  readonly requestJourney: UnifiedNarrativeRequestJourney;
  readonly evolution: UnifiedNarrativeEvolutionSection;
  readonly currentTruth: UnifiedNarrativeCurrentTruthSection;
  readonly knownUnknowns: UnifiedNarrativeKnownUnknownsSection;
  readonly evidenceLineage: UnifiedNarrativeEvidenceLineage;
  readonly progressiveDisclosure: UnifiedNarrativeProgressiveDisclosure;
  readonly executiveBrief: string;
  readonly confidenceLevel: NarrativeConfidenceLevel;
  readonly antiOverreachCertified: boolean;
}
