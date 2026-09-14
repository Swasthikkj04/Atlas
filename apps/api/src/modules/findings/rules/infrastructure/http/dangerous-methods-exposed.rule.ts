import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { HttpTransitAnalyzerService } from '../../../services/http-transit-analyzer.service';

@Injectable()
export class DangerousMethodsExposedRule implements FindingRule {
  readonly id = 'http.dangerous-methods-exposed';
  readonly name = 'Dangerous HTTP Methods Exposed';
  readonly category = FindingCategory.RESPONSE;

  constructor(private readonly transitAnalyzer: HttpTransitAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const report = this.transitAnalyzer.analyzeTransit(context.snapshot);

    if (!report.isEvaluated || !report.methodsAudit.hasDangerousMethods) {
      return [];
    }

    const hasTrace = report.methodsAudit.hasTraceMethod;
    const methodsList = report.methodsAudit.dangerousMethodsList.join(', ');

    return [
      {
        ruleId: this.id,
        title: hasTrace
          ? 'Dangerous HTTP TRACE Method Enabled (XST Risk)'
          : `Potentially Insecure HTTP Methods Enabled: ${methodsList}`,
        description: hasTrace
          ? 'The server indicates support for the HTTP TRACE/TRACK method. TRACE reflects incoming request headers including authentication cookies and Authorization headers, exposing users to Cross-Site Tracing (XST) attacks.'
          : `The server advertises support for sensitive HTTP methods (${methodsList}) in response headers, which should be restricted or disabled for unauthenticated public clients.`,
        category: this.category,
        severity: hasTrace ? Severity.HIGH : Severity.MEDIUM,
        confidence: report.confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale: hasTrace
          ? 'HTTP TRACE allows attackers exploiting Cross-Site Scripting (XSS) to steal HttpOnly cookies by forcing a TRACE reflection of client headers.'
          : 'Enabling arbitrary non-standard HTTP methods expands attack surface at the ingress gateway.',
        whatThisDoesNotProve:
          'This finding proves the server advertises support for the method in headers; it does not prove arbitrary method invocations succeed without authorization.',
        recommendations: [
          {
            title: 'Disable HTTP TRACE and Restrict Allowed HTTP Verbs',
            description:
              'Configure the web server or ingress gateway (e.g. NGINX `limit_except` or Cloudflare WAF) to reject TRACE, TRACK, and unneeded HTTP methods.',
          },
        ],
      },
    ];
  }
}
