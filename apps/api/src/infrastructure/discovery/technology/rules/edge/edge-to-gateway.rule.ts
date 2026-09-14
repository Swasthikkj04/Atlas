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
export class EdgeToGatewayRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-edge-to-gateway';
  readonly name = 'Edge to Ingress Gateway Forwarding Rule';
  readonly description =
    'Maps traffic flow from Edge CDN/proxy to downstream web gateway/reverse proxy.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const edgeNodes = this.findNodesByLayer(nodes, TopologyLayer.EDGE);
    const gatewayNodes = this.findNodesByLayer(nodes, TopologyLayer.GATEWAY);

    if (edgeNodes.length === 0 || gatewayNodes.length === 0) {
      return relationships;
    }

    for (const edgeNode of edgeNodes) {
      for (const gatewayNode of gatewayNodes) {
        // Skip if edge node is identical to gateway (e.g. self)
        if (edgeNode.id === gatewayNode.id) continue;

        relationships.push(
          this.createRelationship({
            sourceNode: edgeNode,
            targetNode: gatewayNode,
            relationshipType: TechnologyRelationshipType.FORWARDS_TO,
            evidenceState: 'SUPPORTED',
            confidence: Math.min(edgeNode.confidence, gatewayNode.confidence),
            explanation: `Traffic received at ${edgeNode.name} edge is forwarded downstream to ${gatewayNode.name} gateway/proxy for routing and processing.`,
            evidence: [
              {
                sourceType: 'HTTP',
                source: `${edgeNode.name} & ${gatewayNode.name} Ingress Path`,
                indicator: `Edge: ${edgeNode.whyDetected}; Gateway: ${gatewayNode.whyDetected}`,
                confidence: 'HIGH',
              },
            ],
            claimBoundary: `Edge forwarding to ${gatewayNode.name} does not expose internal VPC topology between edge POPs and origin gateway.`,
          }),
        );
      }
    }

    return relationships;
  }
}
