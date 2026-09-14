import { Injectable } from '@nestjs/common';
import { BaseTechnologyRelationshipRule } from '../../base/base-technology-relationship.rule';
import {
  TopologyNode,
  TechnologyRelationship,
  TechnologyRelationshipType,
  TopologyLayer,
  TechnologyDetectionContext,
} from '../../contracts';

@Injectable()
export class EdgeToEndpointRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-edge-to-endpoint';
  readonly name = 'Edge to Public Endpoint Rule';
  readonly description =
    'Maps edge CDN, WAF, and Anycast network layers to the public endpoint entrypoint.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const edgeNodes = this.findNodesByLayer(nodes, TopologyLayer.EDGE);

    for (const edgeNode of edgeNodes) {
      const publicEndpoint = {
        id: 'public-endpoint',
        name: `Public Endpoint (${context.domainName})`,
      };

      relationships.push(
        this.createRelationship({
          sourceNode: edgeNode,
          targetNode: publicEndpoint,
          relationshipType: TechnologyRelationshipType.EDGE_OF,
          evidenceState: 'CONFIRMED',
          confidence: edgeNode.confidence,
          confidenceLevel: edgeNode.confidenceLevel,
          explanation: `${edgeNode.name} operates at the outer edge of ${context.domainName}, intercepting and caching public requests.`,
          evidence: [
            {
              sourceType: 'HTTP',
              source: `${edgeNode.name} Edge Detection`,
              indicator: edgeNode.whyDetected,
              confidence: edgeNode.confidenceLevel,
            },
          ],
          claimBoundary: edgeNode.whatThisDoesNotProve,
        }),
      );
    }

    return relationships;
  }
}
