import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { daysUntil } from '../../shared/date.utils';

const HIGH_THRESHOLD_DAYS = 15;
const MEDIUM_THRESHOLD_DAYS = 30;

@Injectable()
export class CertificateExpiryRule implements FindingRule {
  readonly id = 'ssl.certificate-expiry';

  readonly name = 'SSL Certificate Expiry';

  readonly category = FindingCategory.CERTIFICATE;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl?.certificate?.validTo) {
      return [];
    }

    const expiryDate = new Date(ssl.certificate.validTo);

    if (Number.isNaN(expiryDate.getTime())) {
      return [];
    }

    const remainingDays = daysUntil(expiryDate);

    if (remainingDays > MEDIUM_THRESHOLD_DAYS) {
      return [];
    }

    if (remainingDays < 0) {
      return [
        {
          ruleId: this.id,
          title: 'SSL Certificate Expired',
          description: `The TLS certificate expired ${Math.abs(
            remainingDays,
          )} day(s) ago.`,
          category: FindingCategory.CERTIFICATE,
          severity: Severity.CRITICAL,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'An expired TLS certificate triggers browser warning interstitials and blocks user access.',
          whatThisDoesNotProve:
            'This observation confirms the cryptographic certificate has exceeded its validity period; it does not indicate private key compromise.',
          recommendations: [
            {
              title: 'Renew the certificate',
              description:
                'Renew and deploy a valid TLS certificate immediately.',
            },
          ],
        },
      ];
    }

    if (remainingDays <= HIGH_THRESHOLD_DAYS) {
      return [
        {
          ruleId: this.id,
          title: 'SSL Certificate Expiring Soon',
          description: `The TLS certificate will expire in ${remainingDays} day(s).`,
          category: FindingCategory.CERTIFICATE,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'Impending certificate expiration risks service interruption unless renewed within the active window.',
          whatThisDoesNotProve:
            'This observation identifies the scheduled expiration date; it does not indicate active service failure prior to expiration.',
          recommendations: [
            {
              title: 'Renew the certificate',
              description: 'Renew the TLS certificate before it expires.',
            },
          ],
        },
      ];
    }

    return [
      {
        ruleId: this.id,
        title: 'SSL Certificate Expiring',
        description: `The TLS certificate will expire in ${remainingDays} day(s).`,
        category: FindingCategory.CERTIFICATE,
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'CONFIRMED_SECURITY_CONDITION',
        severityRationale:
          'Certificate renewal should be scheduled to avoid certificate expiration outages.',
        whatThisDoesNotProve:
          'This observation tracks certificate lifecycle state and does not indicate an active defect.',
        recommendations: [
          {
            title: 'Schedule certificate renewal',
            description:
              'Plan the TLS certificate renewal before the expiry date.',
          },
        ],
      },
    ];
  }
}
