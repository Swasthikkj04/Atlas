import {
  TechnologyRelationshipRule,
  TopologyNode,
  TechnologyRelationship,
  TechnologyRelationshipType,
  RelationshipEvidenceState,
  TechnologyConfidenceLevel,
  TechnologyEvidence,
  TopologyLayer,
  TechnologyDetectionContext,
} from '../contracts';

export interface CreateRelationshipOptions {
  sourceNode: TopologyNode | { id: string; name: string };
  targetNode: TopologyNode | { id: string; name: string };
  relationshipType: TechnologyRelationshipType;
  evidenceState: RelationshipEvidenceState;
  confidence: number;
  confidenceLevel?: TechnologyConfidenceLevel;
  explanation: string;
  evidence: TechnologyEvidence[];
  claimBoundary?: string;
}

export abstract class BaseTechnologyRelationshipRule implements TechnologyRelationshipRule {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] | Promise<TechnologyRelationship[]>;

  protected createRelationship(
    options: CreateRelationshipOptions,
  ): TechnologyRelationship {
    const confidenceLevel: TechnologyConfidenceLevel =
      options.confidenceLevel ??
      (options.confidence >= 0.9
        ? 'HIGH'
        : options.confidence >= 0.7
          ? 'MEDIUM'
          : 'LOW');

    const id = `rel-${options.sourceNode.id}-${options.relationshipType.toLowerCase()}-${options.targetNode.id}`;

    return {
      id,
      sourceTechnologyId: options.sourceNode.id,
      sourceTechnologyName: options.sourceNode.name,
      targetTechnologyId: options.targetNode.id,
      targetTechnologyName: options.targetNode.name,
      relationshipType: options.relationshipType,
      evidenceState: options.evidenceState,
      confidence: options.confidence,
      confidenceLevel,
      explanation: options.explanation,
      evidence: options.evidence,
      claimBoundary: options.claimBoundary,
    };
  }

  protected findNode(
    nodes: TopologyNode[],
    identifier: string | RegExp,
  ): TopologyNode | undefined {
    if (typeof identifier === 'string') {
      const lower = identifier.toLowerCase();
      return nodes.find(
        (n) =>
          n.id.toLowerCase() === lower ||
          n.technologyId?.toLowerCase() === lower ||
          n.name.toLowerCase() === lower,
      );
    }
    return nodes.find((n) => identifier.test(n.id) || identifier.test(n.name));
  }

  protected findNodesByLayer(
    nodes: TopologyNode[],
    layer: TopologyLayer,
  ): TopologyNode[] {
    return nodes.filter((n) => n.layer === layer);
  }

  protected findNodesByCategory(
    nodes: TopologyNode[],
    categoryPattern: string | RegExp,
  ): TopologyNode[] {
    if (typeof categoryPattern === 'string') {
      const lower = categoryPattern.toLowerCase();
      return nodes.filter((n) => n.category.toLowerCase().includes(lower));
    }
    return nodes.filter((n) => categoryPattern.test(n.category));
  }
}
