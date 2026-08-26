import { Injectable } from '@nestjs/common';

import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

@Injectable()
export class MissingContentSecurityPolicyRule implements FindingRule {
  readonly id = 'http.missing-content-security-policy';

  readonly name = 'Missing Content Security Policy';
  readonly category = FindingCategory.SECURITY_HEADER;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    // Invariant: NO_FAILED_LOOKUP_AS_HEADER_ABSENCE
    if (!http?.reachable || (http.queryStatus && http.queryStatus !== 'SUCCESS')) {
      return [];
    }

    // Invariant: HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE
    const finalResponse = http.finalResponse;
    const evaluatedHeaders = finalResponse ? finalResponse.headers : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;
    const contentType = finalResponse?.contentType || evaluatedHeaders?.['content-type'] || '';
    const statusCode = finalResponse?.statusCode || http.statusCode || 200;

    // Invariant: CSP_OBSERVATION_IS_RESPONSE_AWARE
    // Redirects (3xx) and pure non-HTML API/asset responses (JSON, images) do not require web CSP
    if (statusCode >= 300 && statusCode < 400) {
      return [];
    }
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return [];
    }

    if (evaluatedHeaders && evaluatedHeaders['content-security-policy']) {
      return [];
    }

    const confidence = http.confidence === 'AUTHORITATIVE' ? 'AUTHORITATIVE' : 'SUPPORTED';

    return [
      {
        ruleId: this.id,
        title: 'Missing Content Security Policy',
        description: `The authoritative HTML response (${evaluatedUrl}) does not advertise a Content-Security-Policy header. This removes a browser-side defense-in-depth control against certain content-injection scenarios.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.HIGH,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Content-Security-Policy provides critical browser-side defense in depth against content injection and unauthorized asset execution on web documents.',
        whatThisDoesNotProve:
          'This observation does not establish that the application is currently exploitable to cross-site scripting (XSS). It identifies the absence of a browser-side mitigation policy.',
        recommendations: [
          {
            title: 'Configure Content Security Policy',
            description:
              'Define and deploy a Content-Security-Policy header to restrict the sources from which scripts, styles, images, and other resources can be loaded.',
          },
        ],
      },
    ];
  }
}
