import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class ArchitectureDriftRiskRule implements FindingRule {
  readonly id = 'tech.architecture-drift-risk';
  readonly name = 'Architecture Drift Risk Rule';
  readonly category = FindingCategory.CDN;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const brief = snapshot.technology?.architectureBrief;

    // Check if an edge proxy layer is unobserved while application servers are directly exposed
    const hasEdge = brief?.layers?.some(
      (l) => l.layer === TopologyLayer.EDGE && l.state === 'OBSERVED',
    );
    const hasApplication = brief?.layers?.some(
      (l) => l.layer === TopologyLayer.APPLICATION && l.state === 'OBSERVED',
    );

    // If an application is directly exposed without any edge or gateway protection layer
    const hasGateway = brief?.layers?.some(
      (l) => l.layer === TopologyLayer.GATEWAY && l.state === 'OBSERVED',
    );

    if (!hasEdge && !hasGateway && hasApplication) {
      const appNames =
        brief?.layers
          ?.find((l) => l.layer === TopologyLayer.APPLICATION)
          ?.technologies.map((t) => t.name)
          .join(', ') || 'Application Services';

      return [
        {
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title:
            'Direct Application Ingress Without Edge or Gateway Protection',
          description: `Application infrastructure (${appNames}) is directly observable on the public endpoint without an intermediary edge CDN or reverse proxy gateway layer.`,
          category: FindingCategory.CDN,
          severity: Severity.LOW,
          confidence: 'SUPPORTED',
          riskClassification: 'OPERATIONAL_OBSERVATION',
          severityRationale:
            'Routing public requests directly to application runtime containers without a reverse proxy or edge CDN increases exposure to direct volumetric denial of service and unbuffered client traffic.',
          whatThisDoesNotProve:
            'This observation identifies a direct application topology and does not establish that the application is vulnerable or unmanaged.',
          recommendations: [
            {
              title: 'Consider Deploying an Ingress Gateway or Edge CDN',
              description:
                'Place a hardened reverse proxy (e.g. NGINX, Caddy, Envoy) or Anycast edge network in front of application instances for SSL termination, request buffering, and rate limiting.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
