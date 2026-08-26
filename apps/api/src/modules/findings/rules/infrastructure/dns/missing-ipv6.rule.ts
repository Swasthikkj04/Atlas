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

    if (!dns || !Array.isArray(dns.aaaa)) {
      return [];
    }

    // P0 Truth Invariant (WX-1020): DNS lookup failure != IPv6 not configured.
    const aaaaStatus = dns.status?.aaaa;
    if (aaaaStatus === 'FAILED' || aaaaStatus === 'TIMEOUT' || aaaaStatus === 'SERVFAIL') {
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
          'The domain does not publish an AAAA record in authoritative DNS.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.INFO,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'INFORMATIONAL_OBSERVATION',
        severityRationale:
          'IPv6 deployment provides dual-stack accessibility and future network readiness.',
        whatThisDoesNotProve:
          'This observation is informational and does not represent a vulnerability or security risk. IPv4 connectivity remains fully functional.',
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
