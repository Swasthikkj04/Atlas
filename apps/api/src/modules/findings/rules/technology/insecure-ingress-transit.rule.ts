import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class InsecureIngressTransitRule implements FindingRule {
  readonly id = 'tech.insecure-ingress-transit';
  readonly name = 'Insecure Ingress Transit & Protocol Downgrade Rule';
  readonly category = FindingCategory.REDIRECT;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const http = snapshot.http;
    if (!http) return [];

    const hops = http.redirectHops || [];
    let hasDowngrade = false;
    let downgradeDetail = '';

    for (let i = 0; i < hops.length - 1; i++) {
      if (hops[i].scheme === 'https' && hops[i + 1].scheme === 'http') {
        hasDowngrade = true;
        downgradeDetail = `Redirect hop from ${hops[i].url} (HTTPS) to ${hops[i + 1].url} (unencrypted HTTP)`;
        break;
      }
    }

    if (hasDowngrade) {
      return [
        {
          ruleId: this.id,
          module: FindingModule.HTTP,
          title: 'Insecure Protocol Downgrade in Ingress Redirect Chain',
          description: `Ingress network transit downgraded from HTTPS to unencrypted HTTP during redirect flow: ${downgradeDetail}.`,
          category: FindingCategory.REDIRECT,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Downgrading from HTTPS to unencrypted HTTP exposes credentials, cookies, and session data in transit to interception.',
          whatThisDoesNotProve:
            'This observation does not prove data was intercepted; it identifies an insecure redirect sequence in the public ingress path.',
          recommendations: [
            {
              title: 'Enforce End-to-End HTTPS in Ingress Redirects',
              description:
                'Update your reverse proxy, edge CDN, and web server redirect configurations so that all redirect targets explicitly specify https:// URLs.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
