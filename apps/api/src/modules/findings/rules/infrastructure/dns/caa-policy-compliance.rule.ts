import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { AdvancedDnsRoutingAnalyzerService } from '../../../services/advanced-dns-routing-analyzer.service';

@Injectable()
export class CaaPolicyComplianceRule implements FindingRule {
  readonly id = 'dns.caa-policy-compliance';
  readonly name =
    'Certification Authority Authorization (CAA) Policy Compliance';
  readonly category = FindingCategory.DNS_RECORD;

  constructor(
    private readonly routingAnalyzer: AdvancedDnsRoutingAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const dns = context.snapshot.dns;
    if (!dns) {
      return [];
    }

    const caaStatus = dns.status?.caa;
    if (
      caaStatus === 'FAILED' ||
      caaStatus === 'TIMEOUT' ||
      caaStatus === 'SERVFAIL'
    ) {
      // WX-1020: Truth preservation on resolution failures
      return [];
    }

    const observedIssuer = context.snapshot.ssl?.certificate?.issuer;
    const assessment = this.routingAnalyzer.analyzeCaa(
      dns.caa || [],
      observedIssuer,
    );

    if (assessment.isHardened && !assessment.issuerMismatchDetected) {
      return [];
    }

    if (assessment.issuerMismatchDetected) {
      const allowedStr =
        assessment.authorizedIssuers.length > 0
          ? assessment.authorizedIssuers.join(', ')
          : 'none (issue ";")';

      return [
        {
          ruleId: this.id,
          title: 'CAA Record Restricts Active TLS Certificate Authority',
          description: `Authoritative CAA records restrict certificate issuance to [${allowedStr}], but the active TLS certificate was issued by '${observedIssuer || 'an unauthorized CA'}'. Future certificate renewals will fail automated validation.`,
          category: this.category,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'A mismatch between published CAA policies and active TLS issuers will cause automated certificate renewals to be blocked by CAs, risking site outages.',
          whatThisDoesNotProve:
            'This observation identifies a configuration discrepancy between DNS CAA policy and the deployed TLS certificate; it does not indicate the current certificate is invalid or compromised.',
          recommendations: [
            {
              title: 'Add Active Certificate Authority to CAA Policy',
              description: `Add an 'issue' tag authorizing '${observedIssuer || 'your active CA'}' to the domain's CAA DNS record.`,
            },
          ],
        },
      ];
    }

    if (!assessment.present) {
      return [
        {
          ruleId: this.id,
          title: 'Missing CAA Record (Unrestricted Certificate Issuance)',
          description:
            'No Certification Authority Authorization (CAA) record is published in DNS (RFC 8659). Any globally trusted Certificate Authority is permitted to issue certificates for this domain without restriction.',
          category: this.category,
          severity: Severity.LOW,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Without CAA records, an attacker obtaining unauthorized access to any public CA could issue rogue certificates for this domain without triggering CA-side rejection.',
          whatThisDoesNotProve:
            'This finding notes the absence of CAA policy restrictions in DNS; it does not indicate fraudulent certificates have been requested or issued.',
          recommendations: [
            {
              title: 'Publish CAA Records for Authorized CAs',
              description:
                'Publish DNS CAA records (e.g., 0 issue "letsencrypt.org", 0 issuewild ";", 0 iodef "mailto:security@domain.com") to whitelist approved certificate authorities.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
