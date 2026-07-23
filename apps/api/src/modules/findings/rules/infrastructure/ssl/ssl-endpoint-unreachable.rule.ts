import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class SslEndpointUnreachableRule implements FindingRule {
  readonly id = 'ssl.endpoint-unreachable';

  readonly name = 'SSL Endpoint Unreachable';
  readonly category = FindingCategory.TLS;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl) {
      return [];
    }

    if (ssl.reachable) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'SSL Endpoint Unreachable',
        description:
          'Atlas could not establish a TCP connection to the HTTPS endpoint on port 443.',
        category: FindingCategory.CERTIFICATE,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Verify HTTPS availability',
            description:
              'Ensure the server is online, port 443 is accessible, and firewall or network rules are not blocking HTTPS traffic.',
          },
        ],
      },
    ];
  }
}