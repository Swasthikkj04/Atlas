import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class SelfSignedCertificateRule implements FindingRule {
  readonly id = 'ssl.self-signed';

  readonly name = 'Self-Signed Certificate';
  readonly category = FindingCategory.CERTIFICATE;

  private readonly selfSignedErrors = new Set([
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
  ]);

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl?.authorizationError) {
      return [];
    }

    if (!this.selfSignedErrors.has(ssl.authorizationError)) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Self-Signed Certificate Detected',
        description:
          'The SSL/TLS certificate is self-signed (or contains a self-signed root in the chain) and is not issued by a trusted Certificate Authority.',
        category: FindingCategory.CERTIFICATE,
        severity: Severity.HIGH,
        recommendations: [
          {
            title: 'Use a trusted certificate',
            description:
              "Replace the self-signed certificate with one issued by a publicly trusted Certificate Authority (e.g., Let's Encrypt, DigiCert).",
          },
        ],
      },
    ];
  }
}
