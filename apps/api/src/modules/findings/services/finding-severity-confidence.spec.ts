import { Severity } from '../enums/severity.enum';
import { MissingContentSecurityPolicyRule } from '../rules/infrastructure/http/missing-content-security-policy.rule';
import { MissingHstsRule } from '../rules/infrastructure/http/missing-hsts.rule';
import { SlowResponseRule } from '../rules/infrastructure/http/slow-response.rule';
import { MissingIpv6Rule } from '../rules/infrastructure/dns/missing-ipv6.rule';
import { CertificateExpiryRule } from '../rules/infrastructure/ssl/certificate-expiry.rule';
import type { FindingContext } from '../contracts/finding-context.interface';

describe('WX-1023: Finding Severity and Confidence Calibration', () => {
  describe('1. Separation of Severity from Confidence', () => {
    it('accurately assigns independent severity (HIGH) and confidence (AUTHORITATIVE) for CSP absence', async () => {
      const rule = new MissingContentSecurityPolicyRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 80,
            confidence: 'AUTHORITATIVE',
            queryStatus: 'SUCCESS',
            finalResponse: {
              url: 'https://example.com',
              statusCode: 200,
              isHttps: true,
              contentType: 'text/html; charset=utf-8',
              headers: {
                'content-type': 'text/html; charset=utf-8',
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);

      const finding = findings[0];
      // Severity describes potential impact
      expect(finding.severity).toBe(Severity.HIGH);
      // Confidence describes evidence strength
      expect(finding.confidence).toBe('AUTHORITATIVE');
      // Risk classification separates hardening gap from active exploit
      expect(finding.riskClassification).toBe('SECURITY_HARDENING_GAP');
      expect(finding.severityRationale).toBeDefined();
      expect(finding.whatThisDoesNotProve).toContain(
        'does not establish that the application is currently exploitable',
      );
    });

    it('prohibits finding confidence from exceeding observation confidence', async () => {
      const rule = new MissingContentSecurityPolicyRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 80,
            confidence: 'SUPPORTED',
            queryStatus: 'SUCCESS',
            finalResponse: {
              url: 'https://example.com',
              statusCode: 200,
              isHttps: true,
              contentType: 'text/html',
              headers: {
                'content-type': 'text/html',
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      // Confidence must not exceed observation confidence
      expect(findings[0].confidence).toBe('SUPPORTED');
    });
  });

  describe('2. Failed Probes Never Produce Findings', () => {
    it('produces zero findings when HTTP discovery probe failed or timed out', async () => {
      const cspRule = new MissingContentSecurityPolicyRule();
      const hstsRule = new MissingHstsRule();

      const failedContext: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          http: {
            reachable: false,
            status: 0,
            statusCode: 0,
            responseTimeMs: 0,
            queryStatus: 'TIMEOUT',
            confidence: 'FAILED',
            headers: {},
          },
        },
      };

      const cspFindings = await cspRule.evaluate(failedContext);
      const hstsFindings = await hstsRule.evaluate(failedContext);

      expect(cspFindings).toHaveLength(0);
      expect(hstsFindings).toHaveLength(0);
    });
  });

  describe('3. Rule-Specific Severity Rationales', () => {
    it('guarantees every evaluated finding carries an explicit severity rationale', async () => {
      const expiryRule = new CertificateExpiryRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          ssl: {
            reachable: true,
            supported: true,
            authorized: true,
            certificate: {
              subject: 'CN=example.com',
              issuer: 'Let Encrypt',
              validFrom: '2025-01-01',
              validTo: new Date(
                Date.now() + 5 * 24 * 60 * 60 * 1000,
              ).toISOString(), // 5 days left -> HIGH
            },
          },
        },
      };

      const findings = await expiryRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].riskClassification).toBe(
        'CONFIRMED_SECURITY_CONDITION',
      );
      expect(findings[0].severityRationale).toContain(
        'expiration risks service interruption',
      );
    });
  });
});
