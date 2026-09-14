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
export class ApplicationToRuntimeRule extends BaseTechnologyRelationshipRule {
  readonly id = 'rule-application-to-runtime';
  readonly name = 'Application to Runtime Execution Rule';
  readonly description =
    'Maps application frameworks and web services to their underlying container runtime or cluster orchestrator.';

  evaluate(
    nodes: TopologyNode[],
    context: TechnologyDetectionContext,
  ): TechnologyRelationship[] {
    const relationships: TechnologyRelationship[] = [];
    const appNodes = [
      ...this.findNodesByLayer(nodes, TopologyLayer.APPLICATION),
      ...this.findNodesByLayer(nodes, TopologyLayer.GATEWAY),
    ];
    const runtimeNodes = this.findNodesByLayer(nodes, TopologyLayer.RUNTIME);

    if (appNodes.length === 0 || runtimeNodes.length === 0) {
      return relationships;
    }

    for (const appNode of appNodes) {
      for (const runtimeNode of runtimeNodes) {
        relationships.push(
          this.createRelationship({
            sourceNode: appNode,
            targetNode: runtimeNode,
            relationshipType: TechnologyRelationshipType.RUNS_ON,
            evidenceState: 'SUPPORTED',
            confidence: Math.min(appNode.confidence, runtimeNode.confidence),
            explanation: `${appNode.name} workloads are packaged and executed inside ${runtimeNode.name} containerized runtime environments.`,
            evidence: [
              {
                sourceType: 'HTTP',
                source: `${appNode.name} & ${runtimeNode.name} Execution Substrate`,
                indicator: `Application: ${appNode.whyDetected}; Runtime: ${runtimeNode.whyDetected}`,
                confidence: 'HIGH',
              },
            ],
            claimBoundary: `${runtimeNode.name} execution confirms process containerization, but does not prove which cloud provider hosts the underlying compute nodes.`,
          }),
        );
      }
    }

    return relationships;
  }
}
