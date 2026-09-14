import { ContentSecurityAnalyzerService } from './content-security-analyzer.service';

describe('ContentSecurityAnalyzerService', () => {
  let service: ContentSecurityAnalyzerService;

  beforeEach(() => {
    service = new ContentSecurityAnalyzerService();
  });

  it('correctly parses a strict Content-Security-Policy', () => {
    const rawCsp =
      "default-src 'self'; script-src 'self' https://cdn.example.com; object-src 'none'; base-uri 'self'";
    const res = service.parseCspDirectives(rawCsp);

    expect(res.present).toBe(true);
    expect(res.isReportOnly).toBe(false);
    expect(res.hasUnsafeInline).toBe(false);
    expect(res.hasUnsafeEval).toBe(false);
    expect(res.hasWildcardScript).toBe(false);
    expect(res.isStrict).toBe(true);
    expect(res.permissiveTokens).toHaveLength(0);
  });

  it('identifies permissive tokens: unsafe-inline and unsafe-eval', () => {
    const rawCsp =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'";
    const res = service.parseCspDirectives(rawCsp);

    expect(res.present).toBe(true);
    expect(res.hasUnsafeInline).toBe(true);
    expect(res.hasUnsafeEval).toBe(true);
    expect(res.isStrict).toBe(false);
    expect(res.permissiveTokens).toContain("'unsafe-inline'");
    expect(res.permissiveTokens).toContain("'unsafe-eval'");
  });

  it('treats nonce or strict-dynamic as mitigating unsafe-inline in modern CSP', () => {
    const rawCsp =
      "script-src 'nonce-r4nd0m' 'strict-dynamic' 'unsafe-inline' https:";
    const res = service.parseCspDirectives(rawCsp);

    expect(res.hasUnsafeInline).toBe(true);
    // When strict-dynamic / nonce is present, modern browsers ignore unsafe-inline
    expect(res.permissiveTokens).not.toContain("'unsafe-inline'");
  });

  it('handles report-only CSP header', () => {
    const headers = {
      'content-security-policy-report-only':
        "default-src 'self'; report-uri /csp-violation",
    };
    const res = service.analyzeCsp(headers);

    expect(res.present).toBe(true);
    expect(res.isReportOnly).toBe(true);
  });

  it('correctly assesses cross-origin process isolation headers (COOP + COEP)', () => {
    const isolatedHeaders = {
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
      'cross-origin-resource-policy': 'same-origin',
    };
    const res = service.analyzeCrossOriginIsolation(isolatedHeaders);
    expect(res.isIsolated).toBe(true);
    expect(res.coop).toBe('same-origin');
    expect(res.coep).toBe('require-corp');

    const unisolatedHeaders = {
      'cross-origin-opener-policy': 'same-origin-allow-popups',
    };
    const res2 = service.analyzeCrossOriginIsolation(unisolatedHeaders);
    expect(res2.isIsolated).toBe(false);
  });

  it('analyzes Permissions-Policy configurations and restrictions', () => {
    const headers = {
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    };
    const res = service.analyzePermissionsPolicy(headers);
    expect(res.present).toBe(true);
    expect(res.isConfigured).toBe(true);
    expect(res.restrictedFeatures).toContain('camera');
    expect(res.restrictedFeatures).toContain('microphone');
    expect(res.restrictedFeatures).toContain('geolocation');
  });

  it('computes holistic posture score deterministically', () => {
    const hardenedHttp = {
      headers: {
        'content-security-policy':
          "default-src 'self'; script-src 'self'; object-src 'none'",
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-embedder-policy': 'require-corp',
        'permissions-policy': 'camera=(), microphone=()',
      },
    };
    const assessment = service.assessContentSecurityPosture(
      'secure.corp.internal',
      hardenedHttp,
    );
    expect(assessment.overallScore).toBe(100);
    expect(assessment.isCompliant).toBe(true);

    const permissiveHttp = {
      headers: {
        'content-security-policy':
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      },
    };
    const assessment2 = service.assessContentSecurityPosture(
      'leaking.corp.internal',
      permissiveHttp,
    );
    expect(assessment2.overallScore).toBeLessThan(80);
    expect(assessment2.isCompliant).toBe(false);
  });
});
