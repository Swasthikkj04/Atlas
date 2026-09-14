import { MissingHstsRule } from './missing-hsts.rule';
import { Severity } from '../../../enums/severity.enum';
import type { FindingContext } from '../../../contracts/finding-context.interface';

describe('WX-1022: HSTS Finding Authority & Verification Audit', () => {
  let rule: MissingHstsRule;

  beforeEach(() => {
    rule = new MissingHstsRule();
  });

  const createMockContext = (http: any): FindingContext => ({
    domainId: 'dom-1',
    snapshotId: 'snap-1',
    domainName: 'google.com',
    snapshot: {
      http,
    },
  });

  describe('1. Final Authoritative HTTPS Response Evaluation', () => {
    it('returns NO finding when final HTTPS response contains HSTS even if initial redirect hop lacked it (google.com case)', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        protocol: 'https',
        finalUrl: 'https://www.google.com/',
        redirectCount: 2,
        finalResponse: {
          url: 'https://www.google.com/',
          statusCode: 200,
          isHttps: true,
          headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'content-type': 'text/html',
          },
          authority: 'FINAL_HTTPS_RESPONSE',
          confidence: 'AUTHORITATIVE',
        },
        headers: {
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
        },
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('emits HIGH severity finding with evaluated URL when authoritative HTTPS endpoint genuinely lacks HSTS', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        protocol: 'https',
        finalUrl: 'https://insecure-app.example.com/',
        finalResponse: {
          url: 'https://insecure-app.example.com/',
          statusCode: 200,
          isHttps: true,
          headers: {
            'content-type': 'text/html',
            server: 'nginx',
          },
          authority: 'FINAL_HTTPS_RESPONSE',
          confidence: 'AUTHORITATIVE',
        },
        headers: {
          'content-type': 'text/html',
        },
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].description).toContain(
        'https://insecure-app.example.com/',
      );
    });
  });

  describe('2. Invariant Enforcement: HTTPS Context & Failure Resilience', () => {
    it('does NOT emit missing HSTS finding when endpoint is plain HTTP without HTTPS termination', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        protocol: 'http',
        finalUrl: 'http://plain-http.example.com/',
        finalResponse: {
          url: 'http://plain-http.example.com/',
          statusCode: 200,
          isHttps: false,
          headers: {
            'content-type': 'text/html',
          },
          authority: 'FINAL_HTTP_RESPONSE',
          confidence: 'AUTHORITATIVE',
        },
        headers: {},
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('aborts cleanly and emits NO finding when probe timed out or failed (NO_FAILED_LOOKUP_AS_HEADER_ABSENCE)', async () => {
      const context = createMockContext({
        reachable: false,
        queryStatus: 'TIMEOUT',
        confidence: 'FAILED',
        error: 'ECONNABORTED: timeout of 10000ms exceeded',
        headers: {},
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
