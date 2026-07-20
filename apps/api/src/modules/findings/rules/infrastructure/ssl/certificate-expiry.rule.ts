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

  async evaluate(
    context: FindingContext,
  ): Promise<FindingResult[]> {
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
          recommendations: [
            {
              title: 'Renew the certificate',
              description:
                'Renew the TLS certificate before it expires.',
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