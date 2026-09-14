import { TechnologyRelationshipType } from './technology-relationship-type.enum';
import { RelationshipEvidenceState } from './relationship-evidence-state.enum';
import { TechnologyConfidenceLevel } from './technology-confidence.enum';
import { TechnologyEvidence } from './technology-evidence.interface';

export interface TechnologyRelationship {
  readonly id: string;

  readonly sourceTechnologyId: string;
  readonly sourceTechnologyName: string;
  readonly targetTechnologyId: string;
  readonly targetTechnologyName: string;

  readonly relationshipType: TechnologyRelationshipType;
  readonly evidenceState: RelationshipEvidenceState;

  readonly confidence: number;
  readonly confidenceLevel: TechnologyConfidenceLevel;

  readonly explanation: string;
  readonly evidence: TechnologyEvidence[];
  readonly claimBoundary?: string;
}
