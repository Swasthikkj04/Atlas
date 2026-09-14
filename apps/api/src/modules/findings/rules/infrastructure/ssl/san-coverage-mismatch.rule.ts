import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { TlsHygieneAnalyzerService } from '../../../services/tls-hygiene-analyzer.service';

@Injectable()
export class SanCoverageMismatchRule implements FindingRule {
  readonly id = 'ssl.san-coverage-mismatch';
  readonly name = 'Certificate Subject Alternative Name (SAN) Mismatch';
  readonly category = FindingCategory.TLS;

  constructor(private readonly tlsAnalyzer: TlsHygieneAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;
    let domain = (context as any).domain?.domainName;
    if (!domain && context.snapshot.http?.finalUrl) {
      try {
        domain = new URL(context.snapshot.http.finalUrl).hostname;
      } catch {
        // Ignore URL parsing errors
      }
    }
    if (!domain && context.snapshot.http?.url) {
      try {
        domain = new URL(context.snapshot.http.url).hostname;
      } catch {
        // Ignore URL parsing errors
      }
    }
    if (!domain && (context.snapshot as any)?.domainName) {
      domain = (context.snapshot as any).domainName;
    }

    if (!ssl || !domain) {
      return [];
    }

    const cert = this.tlsAnalyzer.analyzeCertificate(ssl, domain);
    if (!cert) {
      return [];
    }

    // If SANs exist but domain is not covered
    if (!cert.sanCoverageMatchesDomain) {
      const sansFormatted =
        cert.subjectAltNames.length > 0
          ? cert.subjectAltNames.slice(0, 5).join(', ')
          : cert.subject;

      return [
        {
          ruleId: this.id,
          title: 'Certificate SAN Domain Name Mismatch',
          description: `The certificate presented by ${domain} does not cover this hostname in its Subject Alternative Names (SANs) or Common Name. Observed SANs: [${sansFormatted}].`,
          category: this.category,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'CONFIRMED_SECURITY_CONDITION',
          severityRationale:
            'When a browser navigates to a domain whose name does not match the presented TLS certificate SANs, it throws an untrusted domain security warning and aborts connection.',
          whatThisDoesNotProve:
            'This observation confirms a name mismatch in the presented certificate; it does not prove the server backend is malicious or compromised.',
          recommendations: [
            {
              title: 'Reissue Certificate with Correct SAN Coverage',
              description: `Reissue or reconfigure the TLS certificate to include '${domain}' or a matching wildcard (e.g. '*.${domain.split('.').slice(1).join('.')}') in its Subject Alternative Names.`,
            },
          ],
        },
      ];
    }

    return [];
  }
}
