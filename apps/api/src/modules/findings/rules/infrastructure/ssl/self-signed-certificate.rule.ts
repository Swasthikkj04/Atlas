import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class SelfSignedCertificateRule implements FindingRule {
  readonly id = 'ssl.self-signed-certificate';

  readonly name = 'Self-Signed Certificate';
  readonly category = FindingCategory.CERTIFICATE;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl?.certificate) {
      return [];
    }

    if (ssl.authorized) {
      return [];
    }

    if (
      ssl.error !== 'SELF_SIGNED_CERT_IN_CHAIN' &&
      ssl.error !== 'DEPTH_ZERO_SELF_SIGNED_CERT'
    ) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'Self-Signed Certificate Detected',
        description:
          'The endpoint presented a self-signed TLS certificate that is not trusted by public Certificate Authorities.',
        category: FindingCategory.CERTIFICATE,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale:
          'Self-signed certificates cannot be verified by standard web browsers, exposing users to man-in-the-middle risks.',
        whatThisDoesNotProve:
          'This observation confirms the trust chain is not rooted in a public CA; it does not indicate malicious intent if used in internal testing environments.',
        recommendations: [
          {
            title: 'Deploy CA-signed certificate',
            description:
              'Obtain and install a TLS certificate from a recognized Certificate Authority (CA) such as Let’s Encrypt.',
          },
        ],
      },
    ];
  }
}
