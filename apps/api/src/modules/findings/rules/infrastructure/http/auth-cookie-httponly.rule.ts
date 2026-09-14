import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { CookieSecurityAnalyzerService } from '../../../services/cookie-security-analyzer.service';

@Injectable()
export class AuthCookieHttpOnlyRule implements FindingRule {
  readonly id = 'http.auth-cookie-missing-httponly';
  readonly name = 'Session Cookie Missing HttpOnly Flag';
  readonly category = FindingCategory.SECURITY_HEADER;

  constructor(private readonly cookieAnalyzer: CookieSecurityAnalyzerService) {}

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const http = context.snapshot.http;

    // Invariant: HTTP_FINDING_REQUIRES_AUTHORITATIVE_RESPONSE
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

    const cookies = this.cookieAnalyzer.parseSetCookieHeaders(
      evaluatedHeaders,
      context.snapshotId,
    );

    if (cookies.length === 0) {
      return [];
    }

    // Filter for session/auth cookies missing HttpOnly
    const vulnerableCookies = cookies.filter(
      (c) =>
        (c.classification === 'CONFIRMED_SESSION' ||
          c.classification === 'STRONGLY_INDICATIVE_AUTH') &&
        !c.isHttpOnly,
    );

    if (vulnerableCookies.length === 0) {
      return [];
    }

    const cookieNames = vulnerableCookies.map((c) => `'${c.name}'`).join(', ');
    const isConfirmed = vulnerableCookies.some(
      (c) => c.classification === 'CONFIRMED_SESSION',
    );
    const severity = isConfirmed ? Severity.HIGH : Severity.MEDIUM;
    const confidence = isConfirmed ? 'AUTHORITATIVE' : 'SUPPORTED';

    const rawEvidenceItems = vulnerableCookies
      .map((c) => c.rawSetCookieRedacted)
      .join('\n');

    return [
      {
        ruleId: this.id,
        title: 'Session Cookie Missing HttpOnly Flag',
        description: `The authoritative HTTP response (${evaluatedUrl}) sets session cookie(s) ${cookieNames} without the HttpOnly attribute. Client-side scripts can access the cookie content via JavaScript APIs.`,
        category: FindingCategory.SECURITY_HEADER,
        severity,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'The HttpOnly flag prevents client-side scripts from reading session identifiers through document.cookie, mitigating session theft via Cross-Site Scripting (XSS).',
        whatThisDoesNotProve:
          'Missing HttpOnly does not prove that an exploitable XSS vulnerability exists or that session tokens have been compromised. It identifies the absence of browser-enforced script access restriction.',
        recommendations: [
          {
            title: 'Enable HttpOnly on Session Cookies',
            description: `Configure the Set-Cookie directive to include the 'HttpOnly' attribute for ${cookieNames}. (Evidence: ${rawEvidenceItems})`,
          },
        ],
      },
    ];
  }
}
