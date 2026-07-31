import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class WeakTlsVersionRule implements FindingRule {
  readonly id = 'ssl.weak-tls-version';

  readonly name = 'Weak TLS Version';
  readonly category = FindingCategory.TLS;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl?.protocol) {
      return [];
    }

    if (ssl.protocol !== 'TLSv1' && ssl.protocol !== 'TLSv1.1') {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Weak TLS Version Detected',
        description: `The endpoint negotiated ${ssl.protocol}, which is deprecated and considered insecure.`,
        category: FindingCategory.CERTIFICATE,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Upgrade TLS',
            description:
              'Disable TLS 1.0 and TLS 1.1. Configure the server to use TLS 1.2 or TLS 1.3.',
          },
        ],
      },
    ];
  }
}
