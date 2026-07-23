import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingXContentTypeOptionsRule implements FindingRule {
  readonly id = 'http.missing-x-content-type-options';

  readonly name = 'Missing X-Content-Type-Options Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (http.headers['x-content-type-options']) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Missing X-Content-Type-Options Header',
        description:
          'The application does not send the X-Content-Type-Options header. Browsers may MIME-sniff responses, increasing the risk of content-type confusion attacks.',
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.MEDIUM,
        recommendations: [
          {
            title: 'Enable X-Content-Type-Options',
            description:
              'Configure the X-Content-Type-Options response header with the value "nosniff" to prevent MIME type sniffing.',
          },
        ],
      },
    ];
  }
}