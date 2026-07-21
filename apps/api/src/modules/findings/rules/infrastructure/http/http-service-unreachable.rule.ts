import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class HttpServiceUnreachableRule implements FindingRule {
  readonly id = 'http.service-unreachable';

  readonly name = 'HTTP Service Unreachable';

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (!http) {
      return [];
    }

    if (http.reachable) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'HTTP Service Unreachable',
        description:
          'Atlas could not establish an HTTP/HTTPS connection to the target application.',
        category: FindingCategory.RESPONSE,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Verify application availability',
            description:
              'Ensure the web service is running, DNS resolves correctly, and firewall or network configuration allows inbound HTTP/HTTPS traffic.',
          },
        ],
      },
    ];
  }
}