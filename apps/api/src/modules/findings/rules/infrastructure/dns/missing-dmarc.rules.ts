import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingDmarcRule implements FindingRule {
  readonly id = 'dns.missing-dmarc';

  readonly name = 'Missing DMARC Record';
  readonly category = FindingCategory.DNS_RECORD;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns || !Array.isArray(dns.dmarc)) {
      return [];
    }

    // P0 Truth Invariant (WX-1020): DMARC lookup failed != DMARC record absent.
    const dmarcStatus = dns.status?.dmarc;
    if (
      dmarcStatus === 'FAILED' ||
      dmarcStatus === 'TIMEOUT' ||
      dmarcStatus === 'SERVFAIL'
    ) {
      return [];
    }

    const hasDmarc = dns.dmarc.some((record) =>
      Array.isArray(record)
        ? record.join('').trim().toLowerCase().startsWith('v=dmarc1')
        : String(record).trim().toLowerCase().startsWith('v=dmarc1'),
    );

    if (hasDmarc) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'DMARC Record Not Found',
        description:
          'The domain does not publish a DMARC policy in authoritative DNS.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'DMARC specifies how receiving mail servers should treat messages failing SPF or DKIM alignment, preventing unauthorized sender impersonation.',
        whatThisDoesNotProve:
          'This observation does not establish that phishing attacks are actively impersonating this domain. It identifies the absence of an enforcement policy for SPF/DKIM alignment.',
        recommendations: [
          {
            title: 'Publish a DMARC policy',
            description:
              'Configure a DMARC TXT record to define how receiving mail servers should handle messages that fail SPF or DKIM validation.',
          },
        ],
      },
    ];
  }
}
