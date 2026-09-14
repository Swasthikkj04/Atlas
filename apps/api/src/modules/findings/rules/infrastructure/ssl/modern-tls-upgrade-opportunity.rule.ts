import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { TlsHygieneAnalyzerService } from '../../../services/tls-hygiene-analyzer.service';

@Injectable()
export class ModernTlsUpgradeOpportunityRule implements FindingRule {
  readonly id = 'ssl.modern-tls-upgrade-opportunity';
  readonly name = 'TLS 1.3 Upgrade Opportunity';
  readonly category = FindingCategory.TLS;

  constructor(private readonly tlsAnalyzer: TlsHygieneAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const ssl = context.snapshot.ssl;

    if (!ssl?.protocol) {
      return [];
    }

    const cipher = (ssl as any).cipherSuite || ssl.cipher;
    const tls = this.tlsAnalyzer.analyzeTlsProtocol(ssl.protocol, cipher);
    if (!tls) {
      return [];
    }

    // Only suggest when protocol is standard TLSv1.2 (not deprecated 1.0/1.1 and not already 1.3)
    if (tls.protocol === 'TLSv1.2' && !tls.supportsTls13) {
      return [
        {
          ruleId: this.id,
          title: 'TLS 1.3 Protocol Upgrade Opportunity',
          description: `The endpoint negotiated TLS 1.2. While TLS 1.2 remains secure, enabling TLS 1.3 provides enhanced forward secrecy, modern zero-RTT connection resumption, and removes legacy cipher negotiation.`,
          category: this.category,
          severity: Severity.INFO,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'INFORMATIONAL_OBSERVATION',
          severityRationale:
            'TLS 1.3 offers 1-RTT/0-RTT handshake latencies and eliminates obsolete cryptographic primitives present in earlier specifications.',
          whatThisDoesNotProve:
            'TLS 1.2 negotiation does not indicate an insecure channel or a vulnerability. It is an optimization opportunity for ingress modern performance and posture.',
          recommendations: [
            {
              title: 'Enable TLS 1.3 on Gateway / Load Balancer',
              description:
                'Configure your edge proxy, CDN, or ingress gateway (e.g., NGINX ssl_protocols TLSv1.2 TLSv1.3; or Cloudflare TLS 1.3 mode) to enable modern protocol negotiation.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
