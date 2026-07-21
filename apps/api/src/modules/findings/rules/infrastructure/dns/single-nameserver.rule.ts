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

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns) {
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