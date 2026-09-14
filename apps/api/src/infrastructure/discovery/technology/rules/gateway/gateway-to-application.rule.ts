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
export class GatewayToApplicationRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-gateway-to-application';
  readonly name = 'Gateway to Application Reverse Proxy Rule';
  readonly description =
    'Maps reverse proxy traffic routing from web gateway/server to downstream application framework.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const gatewayNodes = this.findNodesByLayer(nodes, TopologyLayer.GATEWAY);
    const applicationNodes = this.findNodesByLayer(
      nodes,
      TopologyLayer.APPLICATION,
    );

    if (gatewayNodes.length === 0 || applicationNodes.length === 0) {
      return relationships;
    }

    for (const gatewayNode of gatewayNodes) {
      for (const appNode of applicationNodes) {
        relationships.push(
          this.createRelationship({
            sourceNode: gatewayNode,
            targetNode: appNode,
            relationshipType: TechnologyRelationshipType.PROXIES_TO,
            evidenceState: 'SUPPORTED',
            confidence: Math.min(gatewayNode.confidence, appNode.confidence),
            explanation: `${gatewayNode.name} acts as a web gateway/reverse proxy terminating HTTP requests and proxying traffic to the ${appNode.name} application runtime.`,
            evidence: [
              {
                sourceType: 'HTTP',
                source: `${gatewayNode.name} & ${appNode.name} Gateway Path`,
                indicator: `Gateway: ${gatewayNode.whyDetected}; Application: ${appNode.whyDetected}`,
                confidence: 'HIGH',
              },
            ],
            claimBoundary: `${gatewayNode.name} proxying to ${appNode.name} confirms ingress routing, but does not prove whether the application is running locally on the same host or upstream over a private network.`,
          }),
        );
      }
    }

    return relationships;
  }
}
