import { MissingContentSecurityPolicyRule } from '../infrastructure/http/missing-content-security-policy.rule';
import { Severity } from '../../enums/severity.enum';
import type { FindingContext } from '../../contracts/finding-context.interface';

describe('WX-1023: Content Security Policy Severity Calibration', () => {
  let rule: MissingContentSecurityPolicyRule;

  beforeEach(() => {
    rule = new MissingContentSecurityPolicyRule();
  });

  describe('1. Authoritative HTML Response Evaluation (openai.com pattern)', () => {
    it('produces valid hardening finding with authoritative confidence on HTML 200 without CSP', async () => {
      const context: FindingContext = {
        domainId: 'openai-1',
        snapshotId: 'snp-openai',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 65,
            confidence: 'AUTHORITATIVE',
            queryStatus: 'SUCCESS',
            finalResponse: {
              url: 'https://openai.com',
              statusCode: 200,
              isHttps: true,
              contentType: 'text/html; charset=utf-8',
              headers: {
                'content-type': 'text/html; charset=utf-8',
                'strict-transport-security': 'max-age=31536000',
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);

      const finding = findings[0];
      expect(finding.ruleId).toBe('http.missing-content-security-policy');
      expect(finding.severity).toBe(Severity.HIGH);
      expect(finding.confidence).toBe('AUTHORITATIVE');
      expect(finding.riskClassification).toBe('SECURITY_HARDENING_GAP');
      expect(finding.description).toContain(
        'does not advertise a Content-Security-Policy header',
      );
      expect(finding.whatThisDoesNotProve).toContain(
        'does not establish that the application is currently exploitable to cross-site scripting',
      );
    });
  });

  describe('2. Redirect Chain Awareness (google.com pattern)', () => {
    it('does not generate false CSP finding on 301/302 redirects', async () => {
      const context: FindingContext = {
        domainId: 'google-1',
        snapshotId: 'snp-google',
        snapshot: {
          http: {
            reachable: true,
            status: 301,
            statusCode: 301,
            responseTimeMs: 40,
            confidence: 'AUTHORITATIVE',
            queryStatus: 'SUCCESS',
            finalResponse: {
              url: 'http://google.com',
              statusCode: 301,
              isHttps: false,
              contentType: 'text/html; charset=UTF-8',
              headers: {
                location: 'https://www.google.com/',
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('does not generate CSP finding on pure JSON API response', async () => {
      const context: FindingContext = {
        domainId: 'api-1',
        snapshotId: 'snp-api',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 50,
            confidence: 'AUTHORITATIVE',
            queryStatus: 'SUCCESS',
            finalResponse: {
              url: 'https://api.example.com/v1/health',
              statusCode: 200,
              isHttps: true,
              contentType: 'application/json',
              headers: {
                'content-type': 'application/json',
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
