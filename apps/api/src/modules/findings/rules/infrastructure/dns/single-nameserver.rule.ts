import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class SingleNameserverRule implements FindingRule {
  readonly id = 'dns.single-nameserver';

  readonly name = 'Single Name Server';
  readonly category = FindingCategory.DNS_RECORD;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns || !Array.isArray(dns.ns)) {
      return [];
    }

    // P0 Truth Invariant (WX-1020): DNS lookup failure != single nameserver.
    const nsStatus = dns.status?.ns;
    if (
      nsStatus === 'FAILED' ||
      nsStatus === 'TIMEOUT' ||
      nsStatus === 'SERVFAIL'
    ) {
      return [];
    }

    if (dns.ns.length !== 1) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Single Name Server Detected',
        description:
          'The domain is configured with only one authoritative name server. This creates a single point of failure for DNS resolution.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'OPERATIONAL_OBSERVATION',
        severityRationale:
          'Operating a single authoritative nameserver violates RFC resilience standards and exposes the zone to total resolution outages if the server becomes unreachable.',
        whatThisDoesNotProve:
          'This observation reflects DNS availability resilience and does not indicate an exploitable vulnerability in the zone configuration.',
        recommendations: [
          {
            title: 'Configure multiple name servers',
            description:
              'Publish at least two authoritative name servers hosted on independent infrastructure to improve DNS availability and resilience.',
          },
        ],
      },
    ];
  }
}
