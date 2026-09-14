import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { ContentSecurityAnalyzerService } from '../../../services/content-security-analyzer.service';

@Injectable()
export class PermissionsPolicyHygieneRule implements FindingRule {
  readonly id = 'http.permissions-policy-hygiene';
  readonly name = 'Permissions-Policy Browser API Hygiene';
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

    const isHttps = (evaluatedUrl || '').startsWith('https://');
    if (!isHttps) {
      return [];
    }

    const policy = this.contentAnalyzer.analyzePermissionsPolicy(
      evaluatedHeaders || {},
    );
    if (policy.isConfigured) {
      return [];
    }

    const confidence =
      http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing Permissions-Policy Header',
        description: `The document at ${evaluatedUrl} does not define a Permissions-Policy header. Declaring explicit permissions prevents embedded third-party frames from accessing sensitive browser capabilities such as camera, microphone, or geolocation.`,
        category: this.category,
        severity: Severity.LOW,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Permissions-Policy allows developers to selectively enable, disable, and restrict the behavior of certain browser features and APIs across framing boundaries.',
        whatThisDoesNotProve:
          'This observation indicates the absence of declarative origin restrictions for browser APIs; it does not allow websites to access device hardware without explicit user prompts.',
        recommendations: [
          {
            title: 'Configure Permissions-Policy Header',
            description:
              "Deploy a Permissions-Policy header disabling unused hardware APIs, e.g., 'camera=(), microphone=(), geolocation=()'.",
          },
        ],
      },
    ];
  }
}
