import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingIpv6Rule implements FindingRule {
  readonly id = 'dns.missing-ipv6';

  readonly name = 'Missing IPv6 Support';
  readonly category = FindingCategory.DNS_RECORD;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns) {
      return [];
    }

    if (dns.aaaa.length > 0) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'IPv6 Not Configured',
        description:
          'The domain does not publish an AAAA record. IPv6 clients may be unable to reach the service over IPv6 networks.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.LOW,
        recommendations: [
          {
            title: 'Enable IPv6',
            description:
              'Publish AAAA records if your infrastructure supports IPv6 to improve compatibility and future readiness.',
          },
        ],
      },
    ];
  }
}
