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
export class SecurityEnforcementRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-security-enforcement';
  readonly name = 'Security Enforcement & Policy Rule';
  readonly description =
    'Maps security headers, HSTS, and encryption enforcement policies to the public endpoint.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const securityNodes = this.findNodesByLayer(nodes, TopologyLayer.SECURITY);

    for (const secNode of securityNodes) {
      const publicEndpoint = {
        id: 'public-endpoint',
        name: `Public Endpoint (${context.domainName})`,
      };

      relationships.push(
        this.createRelationship({
          sourceNode: secNode,
          targetNode: publicEndpoint,
          relationshipType: TechnologyRelationshipType.USES,
          evidenceState: 'CONFIRMED',
          confidence: secNode.confidence,
          confidenceLevel: secNode.confidenceLevel,
          explanation: `${secNode.name} is enforced across all client connections to ${context.domainName}.`,
          evidence: [
            {
              sourceType: 'HTTP',
              source: `${secNode.name} Policy`,
              indicator: secNode.whyDetected,
              confidence: secNode.confidenceLevel,
            },
          ],
          claimBoundary: secNode.whatThisDoesNotProve,
        }),
      );
    }

    return relationships;
  }
}
