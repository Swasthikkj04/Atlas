import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingReferrerPolicyRule implements FindingRule {
  readonly id = 'http.missing-referrer-policy';

  readonly name = 'Missing Referrer-Policy Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (http.headers['referrer-policy']) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Missing Referrer-Policy Header',
        description:
          'The application does not send a Referrer-Policy header. Browsers may expose more referrer information than intended when navigating to other sites.',
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.LOW,
        recommendations: [
          {
            title: 'Configure Referrer-Policy',
            description:
              'Configure the Referrer-Policy response header to control how much referrer information browsers send with outgoing requests.',
          },
        ],
      },
    ];
  }
}
