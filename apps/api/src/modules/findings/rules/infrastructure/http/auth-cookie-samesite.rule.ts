import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingResult } from '../../../contracts/finding-result.interface';
import { FindingRule } from '../../../contracts/finding-rule.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';
import { CookieSecurityAnalyzerService } from '../../../services/cookie-security-analyzer.service';

@Injectable()
export class AuthCookieSameSiteRule implements FindingRule {
  readonly id = 'http.auth-cookie-missing-samesite';
  readonly name = 'Session Cookie Missing or Insecure SameSite Policy';
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

    // Filter for session/auth cookies with missing SameSite or SameSite=None without Secure
    const sessionCookies = cookies.filter(
      (c) =>
        c.classification === 'CONFIRMED_SESSION' ||
        c.classification === 'STRONGLY_INDICATIVE_AUTH',
    );

    const missingSameSite = sessionCookies.filter(
      (c) => c.sameSite === 'Missing',
    );
    const insecureSameSiteNone = sessionCookies.filter(
      (c) => c.sameSite === 'None' && !c.isSecure,
    );

    if (missingSameSite.length === 0 && insecureSameSiteNone.length === 0) {
      return [];
    }

    const results: FindingResult[] = [];

    if (insecureSameSiteNone.length > 0) {
      const names = insecureSameSiteNone.map((c) => `'${c.name}'`).join(', ');
      const rawEvidence = insecureSameSiteNone
        .map((c) => c.rawSetCookieRedacted)
        .join('\n');

      results.push({
        ruleId: `${this.id}.insecure-none`,
        title: 'Session Cookie Sets SameSite=None Without Secure Attribute',
        description: `The authoritative HTTP response (${evaluatedUrl}) sets cookie(s) ${names} with 'SameSite=None' but lacks the 'Secure' attribute. Modern browsers will reject or restrict this cookie configuration.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.HIGH,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Browsers conforming to RFC 6265bis reject cookies with SameSite=None unless the Secure attribute is also present, leading to authentication failures or insecure transport.',
        whatThisDoesNotProve:
          'This configuration anomaly does not prove that cross-origin token theft has occurred. It identifies a standards non-compliance condition.',
        recommendations: [
          {
            title: 'Append Secure Flag or Restrict SameSite Policy',
            description: `Configure ${names} with both 'SameSite=None' AND 'Secure', or migrate to 'SameSite=Lax' / 'SameSite=Strict'. (Evidence: ${rawEvidence})`,
          },
        ],
      });
    }

    if (missingSameSite.length > 0) {
      const names = missingSameSite.map((c) => `'${c.name}'`).join(', ');
      const rawEvidence = missingSameSite
        .map((c) => c.rawSetCookieRedacted)
        .join('\n');

      results.push({
        ruleId: this.id,
        title: 'Session Cookie Missing SameSite Policy',
        description: `The authoritative HTTP response (${evaluatedUrl}) sets session cookie(s) ${names} without an explicit SameSite attribute. User agents will rely on default browser heuristics for cross-site request behavior.`,
        category: FindingCategory.SECURITY_HEADER,
        severity: Severity.MEDIUM,
        confidence: 'AUTHORITATIVE',
        riskClassification: 'SECURITY_HARDENING_GAP',
        severityRationale:
          'Explicit SameSite configuration (Strict or Lax) provides defense-in-depth against Cross-Site Request Forgery (CSRF) and unwanted ambient credential leakage.',
        whatThisDoesNotProve:
          'The absence of an explicit SameSite attribute does not prove that the application is vulnerable to CSRF exploitation. Effective CSRF defense depends on comprehensive application-level token and header verification.',
        recommendations: [
          {
            title: 'Declare Explicit SameSite Attribute',
            description: `Configure the Set-Cookie directive for ${names} with 'SameSite=Lax' (recommended for navigation) or 'SameSite=Strict'. (Evidence: ${rawEvidence})`,
          },
        ],
      });
    }

    return results;
  }
}
