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
export class PlatformHostingRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-platform-hosting';
  readonly name = 'Managed Platform Hosting & Storefront Rule';
  readonly description =
    'Maps managed cloud platforms (Shopify, Webflow, Wix, Vercel, Netlify) to the hosted storefront/application.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const platformNodes = this.findNodesByLayer(nodes, TopologyLayer.PLATFORM);

    for (const platformNode of platformNodes) {
      const publicEndpoint = {
        id: 'public-endpoint',
        name: `Public Endpoint (${context.domainName})`,
      };

      relationships.push(
        this.createRelationship({
          sourceNode: platformNode,
          targetNode: publicEndpoint,
          relationshipType: TechnologyRelationshipType.SERVES,
          evidenceState: 'CONFIRMED',
          confidence: platformNode.confidence,
          confidenceLevel: platformNode.confidenceLevel,
          explanation: `${platformNode.name} provides the managed cloud hosting and CMS platform serving ${context.domainName}.`,
          evidence: [
            {
              sourceType: 'HTTP',
              source: `${platformNode.name} Platform Detection`,
              indicator: platformNode.whyDetected,
              confidence: platformNode.confidenceLevel,
            },
          ],
          claimBoundary: platformNode.whatThisDoesNotProve,
        }),
      );
    }

    return relationships;
  }
}
