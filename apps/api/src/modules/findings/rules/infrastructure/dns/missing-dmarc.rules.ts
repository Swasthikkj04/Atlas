import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingDmarcRule implements FindingRule {
  readonly id = 'dns.missing-dmarc';

  readonly name = 'Missing DMARC Record';

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns) {
      return [];
    }

    const hasDmarc = (dns.dmarc ?? []).some((record) =>
      record.join('').trim().toLowerCase().startsWith('v=dmarc1'),
    );

    if (hasDmarc) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'DMARC Record Not Found',
        description:
          'The domain does not publish a DMARC policy. This reduces protection against email spoofing and phishing.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Publish a DMARC policy',
            description:
              'Configure a DMARC TXT record to define how receiving mail servers should handle messages that fail SPF or DKIM validation.',
          },
        ],
      },
    ];
  }
}