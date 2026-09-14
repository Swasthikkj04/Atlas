import { CookieSecurityAnalyzerService } from '../../../services/cookie-security-analyzer.service';
import { AuthCookieHttpOnlyRule } from './auth-cookie-httponly.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('S1 Cookie Finding Lifecycle & Historical Separation (S1-009)', () => {
  let cookieAnalyzer: CookieSecurityAnalyzerService;
  let httpOnlyRule: AuthCookieHttpOnlyRule;

  beforeEach(() => {
    cookieAnalyzer = new CookieSecurityAnalyzerService();
    httpOnlyRule = new AuthCookieHttpOnlyRule(cookieAnalyzer);
  });

  function createContext(
    snapshotId: string,
    setCookieHeader: string,
  ): FindingContext {
    return {
      domainId: 'domain-prod',
      snapshotId,
      snapshot: {
        http: {
          reachable: true,
          url: 'https://app.example.com',
          finalUrl: 'https://app.example.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 95,
          headers: { 'set-cookie': setCookieHeader },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: {
            url: 'https://app.example.com',
            statusCode: 200,
            headers: { 'set-cookie': setCookieHeader },
            responseTimeMs: 95,
            isHttps: true,
            authority: 'FINAL_HTTPS_RESPONSE',
            confidence: 'AUTHORITATIVE',
          },
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      },
    };
  }

  it('generates ACTIVE finding in Snapshot N and resolves to 0 active findings in Snapshot N+1', async () => {
    // Snapshot N: connect.sid is missing HttpOnly
    const snapNContext = createContext(
      'snap-1',
      'connect.sid=session_val_xyz; Path=/; Secure; SameSite=Lax',
    );
    const snapNFindings = await httpOnlyRule.evaluate(snapNContext);
    expect(snapNFindings).toHaveLength(1);
    expect(snapNFindings[0].ruleId).toBe('http.auth-cookie-missing-httponly');

    // Snapshot N+1: Developer remediates and adds HttpOnly
    const snapNPlus1Context = createContext(
      'snap-2',
      'connect.sid=session_val_xyz; Path=/; Secure; HttpOnly; SameSite=Lax',
    );
    const snapNPlus1Findings = await httpOnlyRule.evaluate(snapNPlus1Context);
    expect(snapNPlus1Findings).toHaveLength(0); // Successfully resolved
  });

  it('guarantees that multiple concurrent cookies do not generate false positive cross-talk', async () => {
    const multiContext = createContext(
      'snap-3',
      'connect.sid=val; Path=/; Secure; HttpOnly, theme=dark; Path=/',
    );
    const findings = await httpOnlyRule.evaluate(multiContext);
    expect(findings).toHaveLength(0);
  });
});
