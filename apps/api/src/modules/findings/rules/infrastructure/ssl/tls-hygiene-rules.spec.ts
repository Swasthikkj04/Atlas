import { Severity } from '../../../enums/severity.enum';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { TlsHygieneAnalyzerService } from '../../../services/tls-hygiene-analyzer.service';
import { HstsPolicyHygieneRule } from '../http/hsts-policy-hygiene.rule';
import { SanCoverageMismatchRule } from './san-coverage-mismatch.rule';
import { ModernTlsUpgradeOpportunityRule } from './modern-tls-upgrade-opportunity.rule';

describe('S3 Ingress Security & TLS Hygiene Rules (S3-002, S3-003, S3-004)', () => {
  let tlsAnalyzer: TlsHygieneAnalyzerService;
  let hstsRule: HstsPolicyHygieneRule;
  let sanRule: SanCoverageMismatchRule;
  let tlsUpgradeRule: ModernTlsUpgradeOpportunityRule;

  beforeEach(() => {
    tlsAnalyzer = new TlsHygieneAnalyzerService();
    hstsRule = new HstsPolicyHygieneRule(tlsAnalyzer);
    sanRule = new SanCoverageMismatchRule(tlsAnalyzer);
    tlsUpgradeRule = new ModernTlsUpgradeOpportunityRule(tlsAnalyzer);
  });

  function createMockContext(overrides: {
    domainName?: string;
    ssl?: any;
    http?: any;
  }): FindingContext {
    return {
      domain: {
        id: 'dom-1',
        domainName: overrides.domainName || 'example.com',
        workspaceId: 'ws-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      snapshot: {
        id: 'snap-1',
        domainId: 'dom-1',
        timestamp: new Date(),
        dns: null,
        whois: null,
        ssl: overrides.ssl || null,
        http: overrides.http || {
          reachable: true,
          queryStatus: 'SUCCESS',
          finalResponse: {
            isHttps: true,
            status: 200,
            headers: {},
          },
        },
        technology: null,
        ports: null,
        screenshot: null,
      },
      now: new Date(),
    };
  }

  describe('HstsPolicyHygieneRule (http.hsts-policy-hygiene)', () => {
    it('creates LOW severity finding for short HSTS duration (< 180 days)', async () => {
      const context = createMockContext({
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          finalResponse: {
            isHttps: true,
            headers: {
              'strict-transport-security': 'max-age=86400',
            },
          },
        },
      });

      const findings = await hstsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.hsts-policy-hygiene');
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].description).toContain('max-age=86400');
      expect(findings[0].whatThisDoesNotProve).toBeDefined();
    });

    it('returns empty findings when HSTS policy has standard duration (>= 180 days)', async () => {
      const context = createMockContext({
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          finalResponse: {
            isHttps: true,
            headers: {
              'strict-transport-security':
                'max-age=31536000; includeSubDomains',
            },
          },
        },
      });

      const findings = await hstsRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('SanCoverageMismatchRule (ssl.san-coverage-mismatch)', () => {
    it('creates HIGH severity finding when certificate SAN does not match domain', async () => {
      const context = createMockContext({
        domainName: 'portal.company.com',
        ssl: {
          validTo: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          subject: 'legacy.company.com',
          issuer: 'DigiCert',
          subjectAltNames: ['legacy.company.com', 'internal.company.com'],
        },
      });

      const findings = await sanRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('ssl.san-coverage-mismatch');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].description).toContain('portal.company.com');
      expect(findings[0].whatThisDoesNotProve).toBeDefined();
    });

    it('returns empty findings when certificate wildcard covers domain', async () => {
      const context = createMockContext({
        domainName: 'portal.company.com',
        ssl: {
          validTo: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          subject: '*.company.com',
          issuer: 'DigiCert',
          subjectAltNames: ['*.company.com', 'company.com'],
        },
      });

      const findings = await sanRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('ModernTlsUpgradeOpportunityRule (ssl.modern-tls-upgrade-opportunity)', () => {
    it('creates INFO finding suggesting TLS 1.3 upgrade when endpoint negotiates TLS 1.2', async () => {
      const context = createMockContext({
        ssl: {
          protocol: 'TLSv1.2',
          cipherSuite: 'ECDHE-RSA-AES256-GCM-SHA384',
        },
      });

      const findings = await tlsUpgradeRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('ssl.modern-tls-upgrade-opportunity');
      expect(findings[0].severity).toBe(Severity.INFO);
      expect(findings[0].riskClassification).toBe('INFORMATIONAL_OBSERVATION');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not indicate an insecure channel',
      );
    });

    it('returns empty findings when TLS 1.3 is already negotiated', async () => {
      const context = createMockContext({
        ssl: {
          protocol: 'TLSv1.3',
          cipherSuite: 'TLS_AES_256_GCM_SHA384',
        },
      });

      const findings = await tlsUpgradeRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
