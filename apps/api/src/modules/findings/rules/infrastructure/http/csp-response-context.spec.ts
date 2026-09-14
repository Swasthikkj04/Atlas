import { MissingContentSecurityPolicyRule } from './missing-content-security-policy.rule';
import { Severity } from '../../../enums/severity.enum';
import type { FindingContext } from '../../../contracts/finding-context.interface';

describe('WX-1022: Content Security Policy Response-Aware Authority Audit', () => {
  let rule: MissingContentSecurityPolicyRule;

  beforeEach(() => {
    rule = new MissingContentSecurityPolicyRule();
  });

  const createMockContext = (http: any): FindingContext => ({
    domainId: 'dom-1',
    snapshotId: 'snap-1',
    domainName: 'example.com',
    snapshot: {
      http,
    },
  });

  describe('1. Response-Aware Evaluation', () => {
    it('emits HIGH severity finding when authoritative HTML page genuinely lacks CSP', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        finalUrl: 'https://example.com/',
        finalResponse: {
          url: 'https://example.com/',
          statusCode: 200,
          contentType: 'text/html; charset=utf-8',
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        },
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].description).toContain('https://example.com/');
    });

    it('returns NO finding when authoritative response includes Content-Security-Policy', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        finalUrl: 'https://example.com/',
        finalResponse: {
          url: 'https://example.com/',
          statusCode: 200,
          contentType: 'text/html',
          headers: {
            'content-security-policy': "default-src 'self'",
            'content-type': 'text/html',
          },
        },
        headers: {
          'content-security-policy': "default-src 'self'",
        },
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('returns NO finding for non-HTML API responses (application/json)', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        finalUrl: 'https://api.example.com/v1/health',
        finalResponse: {
          url: 'https://api.example.com/v1/health',
          statusCode: 200,
          contentType: 'application/json; charset=utf-8',
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('returns NO finding for 3xx redirect responses', async () => {
      const context = createMockContext({
        reachable: true,
        queryStatus: 'SUCCESS',
        finalUrl: 'https://example.com/redirect',
        finalResponse: {
          url: 'https://example.com/redirect',
          statusCode: 302,
          contentType: 'text/html',
          headers: {
            location: '/target',
          },
        },
        headers: {},
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('2. Lookup Failure Resilience', () => {
    it('aborts and emits NO finding when probe timed out or failed', async () => {
      const context = createMockContext({
        reachable: false,
        queryStatus: 'TIMEOUT',
        confidence: 'FAILED',
        error: 'ECONNABORTED',
        headers: {},
      });

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
