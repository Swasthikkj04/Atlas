import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { ContentSecurityAnalyzerService } from '../../../services/content-security-analyzer.service';

@Injectable()
export class CrossOriginIsolationHygieneRule implements FindingRule {
  readonly id = 'http.cross-origin-isolation-hygiene';
  readonly name = 'Cross-Origin Process Isolation Hygiene';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(
    private readonly contentAnalyzer: ContentSecurityAnalyzerService,
  ) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    if (
      !http?.reachable ||
      (http.queryStatus && http.queryStatus !== 'SUCCESS')
    ) {
      return [];
    }

    const finalResponse = http.finalResponse;
    const evaluatedHeaders = finalResponse
      ? finalResponse.headers
      : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;
    const contentType =
      finalResponse?.contentType || evaluatedHeaders?.['content-type'] || '';
    const statusCode = finalResponse?.statusCode || http.statusCode || 200;

    // Response aware: Only evaluate HTML documents over HTTPS
    if (statusCode >= 300 && statusCode < 400) {
      return [];
    }
    if (
      contentType &&
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml')
    ) {
      return [];
    }

    // Only applicable when served over HTTPS
    const isHttps = (evaluatedUrl || '').startsWith('https://');
    if (!isHttps) {
      return [];
    }

    const isolation = this.contentAnalyzer.analyzeCrossOriginIsolation(
      evaluatedHeaders || {},
    );
    if (isolation.isIsolated) {
      return [];
    }

    const confidence =
      http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing Cross-Origin Process Isolation (COOP / COEP)',
        description: `The document at ${evaluatedUrl} does not advertise Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp. Without these headers, the browser does not isolate the document in a dedicated OS process, limiting access to high-resolution timers and SharedArrayBuffer.`,
        category: this.category,
        severity: Severity.LOW,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Cross-Origin Opener and Embedder policies mitigate cross-origin information leaks and Spectre-class transient execution attacks by ensuring process-level isolation.',
        whatThisDoesNotProve:
          'This observation identifies that the web document has not opted into browser process isolation; it does not prove active cross-origin data theft or Spectre side-channel exploitation.',
        recommendations: [
          {
            title: 'Enable COOP and COEP Headers',
            description:
              "Deploy 'Cross-Origin-Opener-Policy: same-origin' and 'Cross-Origin-Embedder-Policy: require-corp' (or credentialless) on web endpoints.",
          },
        ],
      },
    ];
  }
}
