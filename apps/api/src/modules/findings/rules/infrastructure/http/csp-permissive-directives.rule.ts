import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { ContentSecurityAnalyzerService } from '../../../services/content-security-analyzer.service';

@Injectable()
export class CspPermissiveDirectivesRule implements FindingRule {
  readonly id = 'http.csp-permissive-directives';
  readonly name = 'Permissive Content Security Policy Directives';
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

    // Response aware: Only evaluate HTML documents
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

    const csp = this.contentAnalyzer.analyzeCsp(evaluatedHeaders || {});
    if (!csp.present || csp.permissiveTokens.length === 0) {
      return [];
    }

    const tokenList = csp.permissiveTokens.join(', ');
    const confidence =
      http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Permissive Directives in Content Security Policy',
        description: `The Content-Security-Policy header on ${evaluatedUrl} contains permissive execution tokens (${tokenList}). This significantly weakens client-side defense in depth against DOM-based cross-site scripting.`,
        category: this.category,
        severity: Severity.MEDIUM,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Permissive tokens like unsafe-inline or unsafe-eval allow the browser to execute unhashed inline scripts or dynamic string evaluation, undermining CSP protection.',
        whatThisDoesNotProve:
          'This observation identifies permissive execution allowances in the browser CSP directive; it does not prove the presence of an exploitable XSS injection sink in the application code.',
        recommendations: [
          {
            title: 'Adopt Nonce or Hash Based CSP',
            description:
              "Refactor inline scripts to use cryptographic nonces (e.g. 'nonce-randomHex') or SHA-256 hashes, and remove 'unsafe-inline' and 'unsafe-eval' from script-src directives.",
          },
        ],
      },
    ];
  }
}
