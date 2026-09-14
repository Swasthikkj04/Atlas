import { TopologyNode } from './topology-node.interface';
import { TechnologyRelationship } from './technology-relationship.interface';
import { TechnologyDetectionContext } from './technology-detection-context.interface';

export interface TechnologyRelationshipRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] | Promise<TechnologyRelationship[]>;
}
