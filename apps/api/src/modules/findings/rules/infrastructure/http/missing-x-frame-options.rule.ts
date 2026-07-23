import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingXFrameOptionsRule implements FindingRule {
  readonly id = 'http.missing-x-frame-options';

  readonly name = 'Missing X-Frame-Options Header';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (http.headers['x-frame-options']) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Missing X-Frame-Options Header',
        description:
          'The application does not send the X-Frame-Options header. This may allow the site to be embedded in malicious pages, increasing the risk of clickjacking attacks.',
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.MEDIUM,
        recommendations: [
          {
            title: 'Configure X-Frame-Options',
            description:
              'Configure the X-Frame-Options response header with DENY or SAMEORIGIN to help protect against clickjacking attacks.',
          },
        ],
      },
    ];
  }
}