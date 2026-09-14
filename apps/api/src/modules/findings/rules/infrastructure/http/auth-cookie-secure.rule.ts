import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { CookieSecurityAnalyzerService } from '../../../services/cookie-security-analyzer.service';

@Injectable()
export class AuthCookieSecureRule implements FindingRule {
  readonly id = 'http.auth-cookie-missing-secure';
  readonly name = 'Session Cookie Missing Secure Flag';
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
    const isHttps = finalResponse
      ? finalResponse.isHttps
      : http.protocol === 'https';
    const evaluatedHeaders = finalResponse
      ? finalResponse.headers
      : http.headers;
    const evaluatedUrl = finalResponse?.url || http.finalUrl || http.url;

    // Secure flag is evaluated when endpoint communicates over HTTPS
    if (!isHttps) {
      return [];
    }

    const cookies = this.cookieAnalyzer.parseSetCookieHeaders(
      evaluatedHeaders,
      context.snapshotId,
    );

    if (cookies.length === 0) {
      return [];
    }

    // Filter for session/auth cookies missing Secure
    const vulnerableCookies = cookies.filter(
      (c) =>
        (c.classification === 'CONFIRMED_SESSION' ||
          c.classification === 'STRONGLY_INDICATIVE_AUTH') &&
        !c.isSecure,
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
        title: 'Session Cookie Missing Secure Flag',
        description: `The authoritative HTTPS endpoint (${evaluatedUrl}) delivers session cookie(s) ${cookieNames} without the Secure flag. Browsers may transmit the cookie over unencrypted plaintext HTTP connections.`,
        category: FindingCategory.SECURITY_HEADER,
        severity,
        confidence,
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'The Secure flag instructs user agents to only transmit the cookie over authenticated TLS/HTTPS channels, preventing eavesdropping over cleartext transport.',
        whatThisDoesNotProve:
          'Missing Secure does not prove that network traffic is currently being intercepted or that unencrypted requests are active. It identifies the absence of the browser transmission restriction.',
        recommendations: [
          {
            title: 'Enable Secure Attribute on Session Cookies',
            description: `Configure the Set-Cookie directive to append the 'Secure' attribute for ${cookieNames}. (Evidence: ${rawEvidenceItems})`,
          },
        ],
      },
    ];
  }
}
