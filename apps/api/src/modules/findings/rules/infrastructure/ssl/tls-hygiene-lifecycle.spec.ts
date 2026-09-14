import { Severity } from '../../../enums/severity.enum';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { TlsHygieneAnalyzerService } from '../../../services/tls-hygiene-analyzer.service';
import { HstsPolicyHygieneRule } from '../http/hsts-policy-hygiene.rule';
import { SanCoverageMismatchRule } from './san-coverage-mismatch.rule';
import { ModernTlsUpgradeOpportunityRule } from './modern-tls-upgrade-opportunity.rule';

describe('S3 Ingress Security & TLS Hygiene Finding Lifecycle Transitions (S3-005)', () => {
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

  it('demonstrates ACTIVE in Snapshot N -> RESOLVED in Snapshot N+1 when HSTS and SAN are hardened', async () => {
    // Snapshot N: Unhardened state (suboptimal HSTS, mismatched SAN, TLS 1.2)
    const snapshotN: FindingContext = {
      domain: {
        id: 'dom-1',
        domainName: 'app.mycloud.io',
        workspaceId: 'ws-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      snapshot: {
        id: 'snap-n',
        domainId: 'dom-1',
        timestamp: new Date('2026-08-01T00:00:00Z'),
        dns: null,
        whois: null,
        ssl: {
          protocol: 'TLSv1.2',
          cipherSuite: 'ECDHE-RSA-AES128-GCM-SHA256',
          validTo: new Date('2026-12-31T00:00:00Z').toISOString(),
          subject: 'old-app.mycloud.io',
          issuer: 'DigiCert',
          subjectAltNames: ['old-app.mycloud.io'],
        },
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          finalResponse: {
            isHttps: true,
            status: 200,
            headers: {
              'strict-transport-security': 'max-age=3600', // Suboptimal max-age (1 hour)
            },
          },
        },
        technology: null,
        ports: null,
        screenshot: null,
      },
      now: new Date('2026-08-01T00:00:00Z'),
    };

    const findingsN_hsts = await hstsRule.evaluate(snapshotN);
    const findingsN_san = await sanRule.evaluate(snapshotN);
    const findingsN_tls = await tlsUpgradeRule.evaluate(snapshotN);

    expect(findingsN_hsts).toHaveLength(1);
    expect(findingsN_hsts[0].ruleId).toBe('http.hsts-policy-hygiene');

    expect(findingsN_san).toHaveLength(1);
    expect(findingsN_san[0].ruleId).toBe('ssl.san-coverage-mismatch');

    expect(findingsN_tls).toHaveLength(1);
    expect(findingsN_tls[0].ruleId).toBe('ssl.modern-tls-upgrade-opportunity');

    // Snapshot N+1: Hardened state (1 year HSTS with subdomains, wildcard SAN cert, TLS 1.3)
    const snapshotN1: FindingContext = {
      domain: {
        id: 'dom-1',
        domainName: 'app.mycloud.io',
        workspaceId: 'ws-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      snapshot: {
        id: 'snap-n1',
        domainId: 'dom-1',
        timestamp: new Date('2026-08-02T00:00:00Z'),
        dns: null,
        whois: null,
        ssl: {
          protocol: 'TLSv1.3',
          cipherSuite: 'TLS_AES_256_GCM_SHA384',
          validTo: new Date('2027-08-01T00:00:00Z').toISOString(),
          subject: '*.mycloud.io',
          issuer: "Let's Encrypt Authority X3",
          subjectAltNames: ['*.mycloud.io', 'mycloud.io'],
        },
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          finalResponse: {
            isHttps: true,
            status: 200,
            headers: {
              'strict-transport-security':
                'max-age=31536000; includeSubDomains; preload',
            },
          },
        },
        technology: null,
        ports: null,
        screenshot: null,
      },
      now: new Date('2026-08-02T00:00:00Z'),
    };

    const findingsN1_hsts = await hstsRule.evaluate(snapshotN1);
    const findingsN1_san = await sanRule.evaluate(snapshotN1);
    const findingsN1_tls = await tlsUpgradeRule.evaluate(snapshotN1);

    expect(findingsN1_hsts).toHaveLength(0);
    expect(findingsN1_san).toHaveLength(0);
    expect(findingsN1_tls).toHaveLength(0);
  });
});
