import { TopologyLayer } from './topology-layer.enum';
import { TechnologyConfidenceLevel } from './technology-confidence.enum';
import { TechnologyRelationshipType } from './technology-relationship-type.enum';
import { RelationshipEvidenceState } from './relationship-evidence-state.enum';
import { TechnologyEvidence } from './technology-evidence.interface';

export interface ArchitecturePathSegment {
  readonly hop: number;
  readonly layer: TopologyLayer;
  readonly technologyId: string;
  readonly technologyName: string;
  readonly role: string;
  readonly targetTechnologyId?: string;
  readonly targetTechnologyName?: string;
  readonly relationshipType?: TechnologyRelationshipType;
  readonly evidenceState?: RelationshipEvidenceState;
}

export interface TechnologyArchitectureSummary {
  readonly technologyId: string;
  readonly name: string;
  readonly category: string;
  readonly layer: TopologyLayer;
  readonly role: string;
  readonly infrastructureMeaning: string;
  readonly whyDetected: string;
  readonly confidence: number;
  readonly confidenceLevel: TechnologyConfidenceLevel;
  readonly version?: string;
  readonly whatThisDoesNotProve?: string;
  readonly implications?: string[];
  readonly evidence: TechnologyEvidence[];
}

export interface ArchitectureLayerSummary {
  readonly layer: TopologyLayer;
  readonly name: string;
  readonly state: 'OBSERVED' | 'UNOBSERVED';
  readonly confidenceLevel: TechnologyConfidenceLevel;
  readonly technologies: TechnologyArchitectureSummary[];
  readonly description: string;
}

export interface ArchitectureConfidenceSummary {
  readonly overallLevel: TechnologyConfidenceLevel;
  readonly overallScore: number;
  readonly layerConfidence: Record<TopologyLayer, TechnologyConfidenceLevel>;
  readonly rationale: string;
  readonly confirmedRelationshipsCount: number;
  readonly supportedRelationshipsCount: number;
  readonly inferredRelationshipsCount: number;
}

export interface ArchitectureUnknown {
  readonly dimension: string;
  readonly status: 'UNKNOWN' | 'MASKED' | 'UNOBSERVED';
  readonly explanation: string;
  readonly whyUnknown: string;
}

export interface ClaimBoundary {
  readonly technologyId: string;
  readonly technologyName: string;
  readonly boundary: string;
}

export interface InfrastructureArchitectureBrief {
  /**
   * Deterministic, coherent human-readable narrative answering:
   * "Given everything Nebula can observe, what does this infrastructure appear to look like as a system?"
   */
  readonly summary: string;

  /**
   * Linear, best-supported request/traffic flow path through observed layers.
   */
  readonly architecturePath: ArchitecturePathSegment[];

  /**
   * Structured layer-by-layer architectural breakdown.
   */
  readonly layers: ArchitectureLayerSummary[];

  /**
   * Core request-handling and runtime technologies.
   */
  readonly keyTechnologies: TechnologyArchitectureSummary[];

  /**
   * External integrations (Analytics, Telemetry/APM, Payments, Third-Party SaaS).
   */
  readonly integrations: TechnologyArchitectureSummary[];

  /**
   * Consolidated evidence lineage references.
   */
  readonly evidence: TechnologyEvidence[];

  /**
   * Multi-dimensional confidence breakdown.
   */
  readonly confidence: ArchitectureConfidenceSummary;

  /**
   * Explicitly stated architectural unknowns and unobserved dimensions.
   */
  readonly knownUnknowns: ArchitectureUnknown[];

  /**
   * Anti-overreach claim boundaries preventing unwarranted inferences.
   */
  readonly claimBoundaries: ClaimBoundary[];

  /**
   * Timestamp of architecture brief generation.
   */
  readonly generatedAt: string;
}
