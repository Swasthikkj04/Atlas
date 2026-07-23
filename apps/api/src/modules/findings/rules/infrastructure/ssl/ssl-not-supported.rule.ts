import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class SslUnsupportedRule implements FindingRule {
  readonly id = 'ssl.unsupported';

  readonly name = 'SSL Unsupported';
  readonly category = FindingCategory.TLS;

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl) {
      return [];
    }

    // If the host isn't network-reachable on port 443, we cannot draw conclusions about SSL support
    if (!ssl.reachable) {
      return [];
    }

    if (ssl.supported) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'SSL/TLS Not Supported',
        description:
          'The target is reachable on port 443, but failed to complete a valid TLS handshake.',
        category: FindingCategory.CERTIFICATE,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Enable HTTPS',
            description:
              'Configure the server with a valid TLS certificate and supported protocol stack to secure client communications.',
          },
        ],
      },
    ];
  }
}