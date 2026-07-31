import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingMxRule implements FindingRule {
  readonly id = 'dns.missing-mx';

  readonly name = 'Missing MX Record';
  readonly category = FindingCategory.DNS_RECORD;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns) {
      return [];
    }

    if (dns.mx.length > 0) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'MX Record Not Found',
        description:
          'The domain does not publish any MX records. Email delivery to this domain may not function correctly.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.MEDIUM,
        recommendations: [
          {
            title: 'Configure MX records',
            description:
              'Publish one or more MX records that point to the domain’s mail servers if email services are required.',
          },
        ],
      },
    ];
  }
}
