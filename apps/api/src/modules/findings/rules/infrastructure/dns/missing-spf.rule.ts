import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingSpfRule implements FindingRule {
  readonly id = 'dns.missing-spf';

  readonly name = 'Missing SPF Record';
  readonly category = FindingCategory.DNS_RECORD;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns || !Array.isArray(dns.txt)) {
      return [];
    }

    // P0 Truth Invariant (WX-1020): DNS lookup failed != SPF record absent.
    // If the TXT lookup failed (TIMEOUT, SERVFAIL, FAILED), do NOT convert absence of evidence into evidence of absence.
    const txtStatus = dns.status?.txt;
    if (
      txtStatus === 'FAILED' ||
      txtStatus === 'TIMEOUT' ||
      txtStatus === 'SERVFAIL'
    ) {
      return [];
    }

    const txtRecords = dns.txt.map((record) =>
      Array.isArray(record) ? record.join('') : String(record),
    );

    const hasSpf = txtRecords.some((record) =>
      record.toLowerCase().includes('v=spf1'),
    );

    if (hasSpf) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'SPF Record Not Found',
        description:
          'The domain does not publish a Sender Policy Framework (SPF) record in authoritative DNS.',
        category: FindingCategory.DNS_RECORD,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'SPF records allow receiving mail servers to verify whether incoming mail from a domain was sent by an authorized host.',
        whatThisDoesNotProve:
          'This observation does not establish that unauthorized emails are currently being forged using this domain. It identifies the absence of an authoritative sender validation policy.',
        recommendations: [
          {
            title: 'Publish an SPF record',
            description:
              'Configure an SPF TXT record to specify which mail servers are authorized to send email for this domain.',
          },
        ],
      },
    ];
  }
}
