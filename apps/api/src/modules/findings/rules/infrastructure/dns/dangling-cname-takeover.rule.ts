import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { DnsSecurityAnalyzerService } from '../../../services/dns-security-analyzer.service';

@Injectable()
export class DanglingCnameTakeoverRule implements FindingRule {
  readonly id = 'dns.dangling-cname-takeover';
  readonly name = 'Dangling CNAME Subdomain Takeover Risk';
  readonly category = FindingCategory.DNS_RECORD;

  constructor(private readonly dnsAnalyzer: DnsSecurityAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;
    const http = context.snapshot.http;

    if (!dns || !Array.isArray(dns.cname) || dns.cname.length === 0) {
      return [];
    }

    const cnameStatus = dns.status?.cname;
    if (
      cnameStatus === 'FAILED' ||
      cnameStatus === 'TIMEOUT' ||
      cnameStatus === 'SERVFAIL'
    ) {
      return [];
    }

    const httpReachable =
      http?.reachable ?? (Array.isArray(dns.a) && dns.a.length > 0);
    const observation = this.dnsAnalyzer.analyzeDanglingCname(
      dns.cname,
      dns.a || [],
      httpReachable,
    );

    if (!observation.isPotentiallyDangling || !observation.cnameTarget) {
      return [];
    }

    const provider = observation.matchedProvider || 'Third-Party Cloud Service';
    const serviceType = observation.targetServiceType || 'Cloud Hosting';

    return [
      {
        ruleId: this.id,
        title: `Potential Dangling CNAME to Unclaimed ${provider}`,
        description: `Authoritative DNS points to '${observation.cnameTarget}' (${provider} - ${serviceType}), but the destination does not resolve active A/AAAA addresses or respond to HTTP probes. If the underlying cloud resource was de-provisioned without removing the DNS record, an external actor could claim the resource and hijack traffic.`,
        category: this.category,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Dangling CNAME records pointing to decommissioned third-party cloud assets create an exploitable subdomain takeover vector allowing attackers to host arbitrary content or intercept cookies.',
        whatThisDoesNotProve:
          'This observation identifies an unresolvable or unclaimed third-party CNAME target; it does not confirm that an adversary has successfully claimed the underlying resource.',
        recommendations: [
          {
            title: 'Remove Dangling CNAME Record or Re-provision Asset',
            description: `Delete the CNAME record in your authoritative DNS zone or ensure the corresponding asset is actively registered and claimed in your ${provider} tenant.`,
          },
        ],
      },
    ];
  }
}
