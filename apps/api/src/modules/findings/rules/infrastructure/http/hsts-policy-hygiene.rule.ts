import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { TlsHygieneAnalyzerService } from '../../../services/tls-hygiene-analyzer.service';

@Injectable()
export class HstsPolicyHygieneRule implements FindingRule {
  readonly id = 'http.hsts-policy-hygiene';
  readonly name = 'Suboptimal HSTS Policy Duration or Scope';
  readonly category = FindingCategory.SECURITY_HEADER;
  private readonly tlsAnalyzer: TlsHygieneAnalyzerService;

  constructor(tlsAnalyzer?: TlsHygieneAnalyzerService) {
    this.tlsAnalyzer = tlsAnalyzer || new TlsHygieneAnalyzerService();
  }

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (
      !http?.reachable ||
      (http.queryStatus && http.queryStatus !== 'SUCCESS')
    ) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const isHttps = finalResponse
      ? finalResponse.isHttps
      : http.protocol === 'https';
    const evaluatedHeaders = finalResponse
      ? finalResponse.headers
      : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    if (!isHttps) {
      return [];
    }

    const hsts = this.tlsAnalyzer.analyzeHsts(evaluatedHeaders, isHttps);

    // If HSTS is missing entirely, MissingHstsRule handles it.
    // This rule evaluates suboptimal HSTS configurations when HSTS is present.
    if (!hsts.present || hsts.hygieneTier !== 'SUBOPTIMAL_MAX_AGE') {
      return [];
    }

    const maxAgeDays = Math.floor((hsts.maxAgeSeconds || 0) / 86400);

    return [
      {
        ruleId: this.id,
        title: 'Short HSTS Policy Duration',
        description: `The authoritative HTTPS endpoint (${evaluatedUrl}) advertises a Strict-Transport-Security policy with max-age=${hsts.maxAgeSeconds}s (~${maxAgeDays} days), which is below the recommended minimum of 180 days (15,552,000s).`,
        category: this.category,
        severity: Severity.LOW,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        whatThisDoesNotProve:
          'A short HSTS policy duration does not prove an insecure backend or lack of SSL/TLS encryption.',
        recommendations: [
          {
            title: 'Increase HSTS Duration',
            description:
              'Increase the HSTS max-age directive to at least 180 days (15552000 seconds), and consider adding includeSubDomains and preload once verified.',
          },
        ],
      },
    ];
  }
}
