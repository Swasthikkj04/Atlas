import { CookieSecurityAnalyzerService } from '../../../services/cookie-security-analyzer.service';
import { AuthCookieHttpOnlyRule } from './auth-cookie-httponly.rule';
import { AuthCookieSecureRule } from './auth-cookie-secure.rule';
import { AuthCookieSameSiteRule } from './auth-cookie-samesite.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('S1 Cookie & Session Security Rules (S1-003, S1-004, S1-005, S1-010)', () => {
  let cookieAnalyzer: CookieSecurityAnalyzerService;
  let httpOnlyRule: AuthCookieHttpOnlyRule;
  let secureRule: AuthCookieSecureRule;
  let sameSiteRule: AuthCookieSameSiteRule;

  beforeEach(() => {
    cookieAnalyzer = new CookieSecurityAnalyzerService();
    httpOnlyRule = new AuthCookieHttpOnlyRule(cookieAnalyzer);
    secureRule = new AuthCookieSecureRule(cookieAnalyzer);
    sameSiteRule = new AuthCookieSameSiteRule(cookieAnalyzer);
  });

  function createMockContext(
    headers: Record<string, any>,
    isHttps = true,
  ): FindingContext {
    return {
      domainId: 'domain-1',
      snapshotId: 'snap-1',
      snapshot: {
        http: {
          reachable: true,
          url: isHttps ? 'https://example.com' : 'http://example.com',
          finalUrl: isHttps ? 'https://example.com' : 'http://example.com',
          protocol: isHttps ? 'https' : 'http',
          statusCode: 200,
          responseTimeMs: 120,
          headers: headers as Record<string, string>,
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: {
            url: isHttps ? 'https://example.com' : 'http://example.com',
            statusCode: 200,
            headers: headers as Record<string, string>,
            responseTimeMs: 120,
            isHttps,
            authority: isHttps ? 'FINAL_HTTPS_RESPONSE' : 'FINAL_HTTP_RESPONSE',
            confidence: 'AUTHORITATIVE',
          },
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      },
    };
  }

  describe('AuthCookieHttpOnlyRule (S1-003)', () => {
    it('detects session cookie missing HttpOnly attribute with HIGH severity', async () => {
      const context = createMockContext({
        'set-cookie':
          'connect.sid=session_token_123; Path=/; Secure; SameSite=Lax',
      });

      const findings = await httpOnlyRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.auth-cookie-missing-httponly');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].confidence).toBe('AUTHORITATIVE');
      expect(findings[0].description).toContain("'connect.sid'");
      expect(findings[0].recommendations[0].description).toContain(
        '[REDACTED]',
      );
      expect(findings[0].whatThisDoesNotProve).toBeDefined();
    });

    it('does NOT flag ordinary non-sensitive cookies missing HttpOnly', async () => {
      const context = createMockContext({
        'set-cookie': 'theme=dark; Path=/; Secure; SameSite=Lax',
      });

      const findings = await httpOnlyRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('returns empty when session cookie has HttpOnly', async () => {
      const context = createMockContext({
        'set-cookie':
          'connect.sid=token; Path=/; Secure; HttpOnly; SameSite=Lax',
      });

      const findings = await httpOnlyRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('AuthCookieSecureRule (S1-004)', () => {
    it('detects session cookie missing Secure attribute over HTTPS', async () => {
      const context = createMockContext(
        {
          'set-cookie':
            'PHPSESSID=php_session_val; Path=/; HttpOnly; SameSite=Lax',
        },
        true,
      );

      const findings = await secureRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.auth-cookie-missing-secure');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].description).toContain("'PHPSESSID'");
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not prove that network traffic is currently being intercepted',
      );
    });

    it('does NOT flag Secure rule if transport was not HTTPS', async () => {
      const context = createMockContext(
        {
          'set-cookie': 'PHPSESSID=php_session_val; Path=/; HttpOnly',
        },
        false, // plain HTTP
      );

      const findings = await secureRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('AuthCookieSameSiteRule (S1-005)', () => {
    it('detects missing SameSite attribute on session cookie with MEDIUM severity', async () => {
      const context = createMockContext({
        'set-cookie': 'laravel_session=session_data; Path=/; Secure; HttpOnly',
      });

      const findings = await sameSiteRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.auth-cookie-missing-samesite');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not prove that the application is vulnerable to CSRF exploitation',
      );
    });

    it('detects SameSite=None without Secure as HIGH severity standards gap', async () => {
      const context = createMockContext({
        'set-cookie': 'user_session=user_tok; Path=/; HttpOnly; SameSite=None', // Missing Secure
      });

      const findings = await sameSiteRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe(
        'http.auth-cookie-missing-samesite.insecure-none',
      );
      expect(findings[0].severity).toBe(Severity.HIGH);
    });

    it('does NOT flag session cookie with SameSite=Lax and Secure', async () => {
      const context = createMockContext({
        'set-cookie':
          'laravel_session=session_data; Path=/; Secure; HttpOnly; SameSite=Lax',
      });

      const findings = await sameSiteRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('Anti-Overreach Invariants (S1-010)', () => {
    it('verifies that all rules preserve bounded whatThisDoesNotProve boundaries', async () => {
      const context = createMockContext({
        'set-cookie': 'session=insecure_token; Path=/',
      });

      const httpOnlyFindings = await httpOnlyRule.evaluate(context);
      const secureFindings = await secureRule.evaluate(context);
      const sameSiteFindings = await sameSiteRule.evaluate(context);

      expect(httpOnlyFindings[0].whatThisDoesNotProve).toContain(
        'does not prove that an exploitable XSS vulnerability exists',
      );
      expect(secureFindings[0].whatThisDoesNotProve).toContain(
        'does not prove that network traffic is currently being intercepted',
      );
      expect(sameSiteFindings[0].whatThisDoesNotProve).toContain(
        'does not prove that the application is vulnerable to CSRF exploitation',
      );
    });
  });
});
