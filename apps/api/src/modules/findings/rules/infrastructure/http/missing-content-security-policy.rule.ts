import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingContentSecurityPolicyRule implements FindingRule {
  readonly id = 'http.missing-content-security-policy';

  readonly name = 'Missing Content Security Policy';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http?.reachable) {
      return [];
    }

    if (
      http.headers['content-security-policy']
    ) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Missing Content Security Policy',
        description:
          'The application does not send a Content-Security-Policy header. This increases the risk of content injection and cross-site scripting attacks.',
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Configure Content Security Policy',
            description:
              'Define and deploy a Content-Security-Policy header to restrict the sources from which scripts, styles, images, and other resources can be loaded.',
          },
        ],
      },
    ];
  }
}