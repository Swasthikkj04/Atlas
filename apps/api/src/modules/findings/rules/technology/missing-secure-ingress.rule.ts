import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class MissingSecureIngressRule implements FindingRule {
  readonly id = 'tech.missing-secure-ingress';
  readonly name = 'Missing Secure Ingress Rule';
  readonly category = FindingCategory.TLS;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const http = snapshot.http;
    const brief = snapshot.technology?.architectureBrief;

    if (!http?.reachable) {
      return [];
    }

    // Check if an application or gateway layer is observed
    const hasApplicationOrGateway = brief?.layers?.some(
      (l) =>
        (l.layer === TopologyLayer.APPLICATION ||
          l.layer === TopologyLayer.GATEWAY) &&
        l.state === 'OBSERVED',
    );

    if (!hasApplicationOrGateway) {
      return [];
    }

    // If final authoritative response terminated on plain HTTP without TLS
    const isPlainHttp =
      http.protocol === 'http' ||
      (http.finalUrl && http.finalUrl.startsWith('http://'));

    if (isPlainHttp) {
      const appTechs =
        brief?.layers
          ?.filter(
            (l) =>
              l.layer === TopologyLayer.APPLICATION ||
              l.layer === TopologyLayer.GATEWAY,
          )
          .flatMap((l) => l.technologies.map((t) => t.name))
          .join(', ') || 'Application Services';

      return [
        {
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title: 'Application Endpoint Accessible Over Unencrypted HTTP',
          description: `The public endpoint serves application infrastructure (${appTechs}) over unencrypted HTTP without mandatory TLS enforcement.`,
          category: FindingCategory.TLS,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Unencrypted public endpoints expose user credentials, session tokens, and application payload data to cleartext network interception and tampering.',
          whatThisDoesNotProve:
            'This observation does not indicate active eavesdropping or payload tampering. It identifies that application endpoints respond over cleartext HTTP without automatic TLS upgrade.',
          recommendations: [
            {
              title: 'Enforce Automatic HTTPS Redirection',
              description:
                'Configure your edge proxies and web gateways to automatically issue 301/308 redirects from HTTP (port 80) to HTTPS (port 443).',
            },
          ],
        },
      ];
    }

    return [];
  }
}
