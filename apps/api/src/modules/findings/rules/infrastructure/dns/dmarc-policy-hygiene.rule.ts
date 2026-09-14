import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DnsSecurityAnalyzerService } from '../../../services/dns-security-analyzer.service';

@Injectable()
export class DmarcPolicyHygieneRule implements FindingRule {
  readonly id = 'dns.dmarc-policy-hygiene';
  readonly name = 'DMARC Policy Enforcement Hygiene';
  readonly category = FindingCategory.DNS_RECORD;

  constructor(private readonly dnsAnalyzer: DnsSecurityAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns || !Array.isArray(dns.dmarc)) {
      return [];
    }

    const dmarcStatus = dns.status?.dmarc;
    if (
      dmarcStatus === 'FAILED' ||
      dmarcStatus === 'TIMEOUT' ||
      dmarcStatus === 'SERVFAIL'
    ) {
      return [];
    }

    const parsedDmarc = this.dnsAnalyzer.analyzeDmarc(dns.dmarc);
    if (!parsedDmarc.present || !parsedDmarc.isMonitoringOnly) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        title: 'DMARC Policy Configured in Monitoring Mode (p=none)',
        description:
          'The domain publishes a DMARC policy with p=none. In monitoring mode, receiving mail transfer agents do not reject or quarantine unauthorized messages that fail SPF or DKIM alignment checks.',
        category: this.category,
        severity: Severity.LOW,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'A DMARC policy with p=none allows reporting but provides zero active protection against domain spoofing or unauthorized email delivery.',
        whatThisDoesNotProve:
          'This observation indicates that the domain publishes a reporting-only DMARC policy without active quarantine or rejection; it does not prove active email spoofing or phishing campaigns.',
        recommendations: [
          {
            title: 'Upgrade DMARC Policy to Quarantine or Reject',
            description:
              "After reviewing aggregate RUA reports and verifying all legitimate senders, update the DMARC record to 'p=quarantine' or 'p=reject'.",
          },
        ],
      },
    ];
  }
}
