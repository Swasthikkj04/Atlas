import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { AdvancedDnsRoutingAnalyzerService } from '../../../services/advanced-dns-routing-analyzer.service';

@Injectable()
export class BgpRpkiValidationRule implements FindingRule {
  readonly id = 'network.bgp-rpki-validation';
  readonly name = 'BGP Route Origin Authorization (RPKI ROV) Validation';
  readonly category = FindingCategory.DNS_RECORD;

  constructor(
    private readonly routingAnalyzer: AdvancedDnsRoutingAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const routing = context.snapshot.routing;
    if (!routing || routing.status === 'FAILED') {
      // WX-1020: Truth preservation on lookup failures
      return [];
    }

    const assessment = this.routingAnalyzer.analyzeBgpRpki(routing);

    if (assessment.isHardened && !assessment.hijackRiskDetected) {
      return [];
    }

    if (assessment.hijackRiskDetected || assessment.invalidRoaCount > 0) {
      return [
        {
          ruleId: this.id,
          title: 'BGP Route Origin Authorization (ROA) Mismatch / Hijack Risk',
          description: `Route Origin Validation (ROV) failed for ${assessment.invalidRoaCount} announced BGP prefix(es). The announcing Autonomous System does not match the cryptographically authorized ASN in published RPKI ROAs (RFC 6480 / RFC 6811), exposing network traffic to BGP route leaks or unauthorized interception.`,
          category: this.category,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Invalid BGP route announcements may be dropped by major transit ISPs enforcing RPKI ROV filtering, leading to unreachable services or traffic diversion.',
          whatThisDoesNotProve:
            'This finding identifies an RPKI cryptographic mismatch on the BGP routing plane; it does not confirm active malicious traffic interception.',
          recommendations: [
            {
              title: 'Correct RPKI Route Origin Authorization (ROA)',
              description:
                'Update your ROA objects in your Regional Internet Registry portal (ARIN, RIPE NCC, APNIC, LACNIC, AFRINIC) to authorize the active transit ASN and prefix maxLength.',
            },
          ],
        },
      ];
    }

    if (assessment.notFoundRoaCount > 0 && assessment.validRoaCount === 0) {
      return [
        {
          ruleId: this.id,
          title:
            'BGP Prefix Lacks Cryptographic RPKI Route Origin Authorization',
          description:
            "The domain's infrastructure IP prefixes are announced on global BGP routing tables without cryptographic Route Origin Authorizations (ROAs) published in RPKI repositories. Traffic is vulnerable to unauthorized BGP route announcements.",
          category: this.category,
          severity: Severity.LOW,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Without published RPKI ROAs, upstream tier-1 Internet Service Providers cannot cryptographically distinguish legitimate route announcements from accidental leaks or malicious hijacks.',
          whatThisDoesNotProve:
            'This observation notes the absence of RPKI ROA publication; it does not establish that routing anomalies or BGP attacks have occurred.',
          recommendations: [
            {
              title: 'Create and Sign RPKI ROA Objects',
              description:
                'Generate cryptographically signed ROA objects through your Regional Internet Registry (e.g. ARIN RPKI, RIPE NCC LIR Portal) specifying authorized Origin ASNs and maximum prefix lengths.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
