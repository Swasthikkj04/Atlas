import { TechnologyCategory } from './technology-category.enum';
import { TopologyLayer } from './topology-layer.enum';
import { TechnologyConfidenceLevel } from './technology-confidence.enum';

export interface TopologyNode {
  readonly id: string;
  readonly technologyId: string;
  readonly name: string;
  readonly category: TechnologyCategory | string;
  readonly layer: TopologyLayer;
  readonly role: string;
  readonly infrastructureMeaning: string;
  readonly whyDetected: string;
  readonly confidence: number;
  readonly confidenceLevel: TechnologyConfidenceLevel;
  readonly version?: string;
  readonly evidenceCount: number;
  readonly whatThisDoesNotProve?: string;
  readonly implications?: string[];
}
