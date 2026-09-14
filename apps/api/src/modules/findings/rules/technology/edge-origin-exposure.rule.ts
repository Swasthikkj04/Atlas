import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class EdgeOriginExposureRule implements FindingRule {
  readonly id = 'tech.edge-origin-exposure';
  readonly name = 'Edge / Origin Exposure Rule';
  readonly category = FindingCategory.CDN;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const techResult = snapshot.technology;
    const brief = techResult?.architectureBrief;

    // Check if an Edge layer is present
    const hasEdge = brief?.layers?.some(
      (l) => l.layer === TopologyLayer.EDGE && l.state === 'OBSERVED',
    );

    if (!hasEdge) {
      return [];
    }

    // Check if direct backend server metadata (e.g. Apache, NGINX direct header with unmasked origin)
    // is exposed alongside an Anycast edge proxy without origin masking
    const httpHeaders = snapshot.http?.headers || {};
    const serverHeader = (httpHeaders['server'] || '').toLowerCase();
    const xPoweredBy = (httpHeaders['x-powered-by'] || '').toLowerCase();

    const edgeTech =
      brief?.layers?.find((l) => l.layer === TopologyLayer.EDGE)
        ?.technologies?.[0]?.name || 'Edge CDN';

    // Direct server banner leaked through edge proxy
    const isDirectServerExposed =
      serverHeader.includes('apache') ||
      serverHeader.includes('nginx') ||
      serverHeader.includes('caddy') ||
      serverHeader.includes('iis') ||
      serverHeader.includes('lighttpd');

    const isDirectRuntimeExposed =
      xPoweredBy.includes('php') ||
      xPoweredBy.includes('express') ||
      xPoweredBy.includes('asp.net');

    if (isDirectServerExposed || isDirectRuntimeExposed) {
      return [
        {
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title:
            'Direct Origin Infrastructure Metadata Exposed Alongside Edge CDN',
          description: `The domain uses ${edgeTech} as an edge delivery layer, but responses expose backend server metadata (${[
            serverHeader ? `server: ${httpHeaders['server']}` : null,
            xPoweredBy ? `x-powered-by: ${httpHeaders['x-powered-by']}` : null,
          ]
            .filter(Boolean)
            .join(', ')}).`,
          category: FindingCategory.CDN,
          severity: Severity.MEDIUM,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Leaking origin web server headers through an edge proxy assists targeted origin reconnaissance and indicates incomplete edge header sanitation.',
          whatThisDoesNotProve:
            'This observation does not prove that origin IP addresses are directly reachable or that edge security controls are bypassed. It indicates origin response metadata disclosure.',
          recommendations: [
            {
              title: 'Sanitize Backend Server Headers at Edge',
              description:
                'Configure your edge CDN (or ingress gateway) to strip or normalize Server and X-Powered-By response headers before delivering responses to public clients.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
