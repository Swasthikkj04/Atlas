import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DnsSecurityAnalyzerService } from '../../../services/dns-security-analyzer.service';

@Injectable()
export class SpfPermissivePolicyRule implements FindingRule {
  readonly id = 'dns.spf-permissive-policy';
  readonly name = 'Permissive SPF Policy Qualifier';
  readonly category = FindingCategory.DNS_RECORD;

  constructor(private readonly dnsAnalyzer: DnsSecurityAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;

    if (!dns || !Array.isArray(dns.txt)) {
      return [];
    }

    const txtStatus = dns.status?.txt;
    if (
      txtStatus === 'FAILED' ||
      txtStatus === 'TIMEOUT' ||
      txtStatus === 'SERVFAIL'
    ) {
      return [];
    }

    const parsedSpf = this.dnsAnalyzer.analyzeSpf(dns.txt);
    if (!parsedSpf.present || !parsedSpf.isPermissive) {
      return [];
    }

    const qualifierStr = parsedSpf.qualifier === 'PASS_ALL' ? '+all' : '?all';

    return [
      {
        ruleId: this.id,
        title: `Permissive SPF Qualifier Configured (${qualifierStr})`,
        description: `The authoritative SPF record ends with '${qualifierStr}'. This qualifier explicitly instructs receiving mail servers to accept or neutrally evaluate messages from any source on the internet, negating sender authorization controls.`,
        category: this.category,
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Permissive SPF qualifiers (+all or ?all) allow unauthorized third-party mail servers to send email pretending to originate from this domain.',
        whatThisDoesNotProve:
          'This observation identifies a permissive SPF qualifier in DNS; it does not establish that mail receivers have processed fraudulent messages.',
        recommendations: [
          {
            title: 'Transition SPF Qualifier to SoftFail or HardFail',
            description:
              "Update the SPF record mechanism from '+all' or '?all' to '~all' (SoftFail) or '-all' (HardFail) to restrict unauthorized senders.",
          },
        ],
      },
    ];
  }
}
