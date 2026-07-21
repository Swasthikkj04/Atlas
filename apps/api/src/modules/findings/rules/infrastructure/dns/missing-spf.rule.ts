import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingSpfRule implements FindingRule {
  readonly id = 'dns.missing-spf';

  readonly name = 'Missing SPF Record';

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns) {
      return [];
    }

    const txtRecords = dns.txt.map((record) => record.join(''));

    const hasSpf = txtRecords.some((record) =>
      record.toLowerCase().startsWith('v=spf1'),
    );

    if (hasSpf) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'SPF Record Not Found',
        description:
          'The domain does not publish an SPF record. This may allow attackers to spoof email sent from this domain.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Publish an SPF record',
            description:
              'Configure an SPF TXT record to specify which mail servers are authorized to send email for this domain.',
          },
        ],
      },
    ];
  }
}