import { Injectable } from '@nestjs/common';
import { BaseTechnologyRelationshipRule } from '../../base/base-technology-relationship.rule';
import {
  TopologyNode,
  TechnologyRelationship,
  TechnologyRelationshipType,
  TopologyLayer,
  TechnologyDetectionContext,
  TechnologyCategory,
} from '../../contracts';

@Injectable()
export class ApplicationToIntegrationRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-application-to-integration';
  readonly name = 'Application to Integration Telemetry & Service Rule';
  readonly description =
    'Maps application frameworks to third-party telemetry, analytics, and payment service integrations.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];

    // Find primary application node or platform node, or fallback to public endpoint
    const appNodes = [
      ...this.findNodesByLayer(nodes, TopologyLayer.APPLICATION),
      ...this.findNodesByLayer(nodes, TopologyLayer.PLATFORM),
    ];
    const integrationNodes = this.findNodesByLayer(
      nodes,
      TopologyLayer.INTEGRATION,
    );

    if (integrationNodes.length === 0) {
      return relationships;
    }

    // Default primary node is the first application/platform node, or virtual endpoint node
    const primaryNode =
      appNodes.length > 0
        ? appNodes[0]
        : {
            id: 'public-endpoint',
            name: `Public Endpoint (${context.domainName})`,
          };

    for (const integrationNode of integrationNodes) {
      const isAnalytics =
        integrationNode.category === TechnologyCategory.ANALYTICS;
      const isPayment =
        integrationNode.category === TechnologyCategory.PAYMENTS;

      const relationshipType = isAnalytics
        ? TechnologyRelationshipType.REPORTS_TO
        : isPayment
          ? TechnologyRelationshipType.INTEGRATES_WITH
          : TechnologyRelationshipType.USES;

      const actionText = isAnalytics
        ? `exports distributed performance and error telemetry to`
        : isPayment
          ? `integrates payment gateway checkout with`
          : `utilizes external services from`;

      relationships.push(
        this.createRelationship({
          sourceNode: primaryNode,
          targetNode: integrationNode,
          relationshipType,
          evidenceState: 'CONFIRMED',
          confidence: integrationNode.confidence,
          confidenceLevel: integrationNode.confidenceLevel,
          explanation: `${primaryNode.name} ${actionText} ${integrationNode.name} based on client-side integration and communication signals.`,
          evidence: [
            {
              sourceType: 'HTML',
              source: `${integrationNode.name} Client Integration`,
              indicator: integrationNode.whyDetected,
              confidence: integrationNode.confidenceLevel,
            },
          ],
          claimBoundary:
            integrationNode.whatThisDoesNotProve ||
            `Client-side integration with ${integrationNode.name} does not expose private backend API or internal database architecture.`,
        }),
      );
    }

    return relationships;
  }
}
