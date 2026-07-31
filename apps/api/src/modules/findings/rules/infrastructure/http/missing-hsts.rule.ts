import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingHstsRule implements FindingRule {
  readonly id = 'http.missing-hsts';

  readonly name = 'Missing HSTS Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (http.protocol !== 'https') {
      return [];
    }

    if (http.headers['strict-transport-security']) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Missing HSTS Header',
        description:
          'The application does not send the Strict-Transport-Security header. Browsers cannot enforce HTTPS for future requests.',
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Enable HSTS',
            description:
              'Configure the Strict-Transport-Security response header with an appropriate max-age and consider preload only after validation.',
          },
        ],
      },
    ];
  }
}
