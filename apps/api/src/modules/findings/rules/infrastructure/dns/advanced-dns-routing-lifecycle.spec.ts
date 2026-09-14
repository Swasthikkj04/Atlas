import { AdvancedDnsRoutingAnalyzerService } from '../../../services/advanced-dns-routing-analyzer.service';
import { DnssecValidationRule } from './dnssec-validation.rule';
import { CaaPolicyComplianceRule } from './caa-policy-compliance.rule';
import { BgpRpkiValidationRule } from './bgp-rpki-validation.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('Advanced DNSSEC, CAA & BGP RPKI Lifecycle Integration', () => {
  let analyzer: AdvancedDnsRoutingAnalyzerService;
  let dnssecRule: DnssecValidationRule;
  let caaRule: CaaPolicyComplianceRule;
  let bgpRule: BgpRpkiValidationRule;

  beforeEach(() => {
    analyzer = new AdvancedDnsRoutingAnalyzerService();
    dnssecRule = new DnssecValidationRule(analyzer);
    caaRule = new CaaPolicyComplianceRule(analyzer);
    bgpRule = new BgpRpkiValidationRule(analyzer);
  });

  it('demonstrates ACTIVE findings in Snapshot N and convergence to RESOLVED in Snapshot N+1 upon hardening', async () => {
    // Snapshot N: Unsigned DNSSEC, missing CAA, unauthenticated BGP
    const snapshotN: FindingContext = {
      domain: 'hardening-target.com',
      snapshot: {
        dns: {
          dnssec: {
            enabled: false,
            status: 'UNSIGNED',
            hasDs: false,
            hasDnskey: false,
            hasRrsig: false,
          },
          caa: [],
          status: { dnssec: 'SUCCESS', caa: 'SUCCESS' },
        },
        ssl: {
          certificate: { issuer: "Let's Encrypt Authority X3" },
        },
        routing: {
          routes: [
            {
              ip: '198.51.100.1',
              ipVersion: 4,
              prefix: '198.51.100.0/24',
              asn: 12345,
              asName: 'TRANSIT-AS',
              rpkiStatus: 'NOT_FOUND',
            },
          ],
          uniqueAsns: [12345],
          isMultiHomed: false,
          rpkiSummary: {
            totalRoutes: 1,
            validCount: 0,
            invalidCount: 0,
            notFoundCount: 1,
            overallRpkiStatus: 'NOT_FOUND',
            coveragePercentage: 0,
          },
          hijackRiskDetected: false,
          status: 'SUCCESS',
        },
      } as any,
    };

    const dnssecFindingsN = await dnssecRule.evaluate(snapshotN);
    const caaFindingsN = await caaRule.evaluate(snapshotN);
    const bgpFindingsN = await bgpRule.evaluate(snapshotN);

    expect(dnssecFindingsN).toHaveLength(1);
    expect(caaFindingsN).toHaveLength(1);
    expect(bgpFindingsN).toHaveLength(1);

    // Snapshot N+1: Remediated (DNSSEC enabled, CAA published with Let's Encrypt, RPKI ROA signed)
    const snapshotNPlus1: FindingContext = {
      domain: 'hardening-target.com',
      snapshot: {
        dns: {
          dnssec: {
            enabled: true,
            status: 'VALID',
            hasDs: true,
            hasDnskey: true,
            hasRrsig: true,
            algorithms: ['ECDSAP256SHA256 (13)'],
          },
          caa: [
            { critical: 0, issue: 'letsencrypt.org' },
            { critical: 0, iodef: 'mailto:security@hardening-target.com' },
          ],
          status: { dnssec: 'SUCCESS', caa: 'SUCCESS' },
        },
        ssl: {
          certificate: { issuer: "Let's Encrypt Authority X3" },
        },
        routing: {
          routes: [
            {
              ip: '104.21.4.1',
              ipVersion: 4,
              prefix: '104.16.0.0/13',
              asn: 13335,
              asName: 'CLOUDFLARENET',
              rpkiStatus: 'VALID',
            },
          ],
          uniqueAsns: [13335],
          isMultiHomed: false,
          rpkiSummary: {
            totalRoutes: 1,
            validCount: 1,
            invalidCount: 0,
            notFoundCount: 0,
            overallRpkiStatus: 'VALID',
            coveragePercentage: 100,
          },
          hijackRiskDetected: false,
          status: 'SUCCESS',
        },
      } as any,
    };

    const dnssecFindingsN1 = await dnssecRule.evaluate(snapshotNPlus1);
    const caaFindingsN1 = await caaRule.evaluate(snapshotNPlus1);
    const bgpFindingsN1 = await bgpRule.evaluate(snapshotNPlus1);

    expect(dnssecFindingsN1).toHaveLength(0);
    expect(caaFindingsN1).toHaveLength(0);
    expect(bgpFindingsN1).toHaveLength(0);
  });
});
