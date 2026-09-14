import { TopologyNode } from './topology-node.interface';
import { TechnologyRelationship } from './technology-relationship.interface';
import { TopologyLayer } from './topology-layer.enum';

export interface InfrastructureTopology {
  readonly nodes: TopologyNode[];
  readonly relationships: TechnologyRelationship[];
  readonly layers: Record<TopologyLayer, TopologyNode[]>;
  readonly summary: string;
  readonly totalNodes: number;
  readonly totalRelationships: number;
  readonly confirmedRelationshipsCount: number;
  readonly supportedRelationshipsCount: number;
  readonly inferredRelationshipsCount: number;
  readonly generatedAt: string;
}
