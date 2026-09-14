import { AdvancedDnsRoutingAnalyzerService } from './advanced-dns-routing-analyzer.service';

describe('AdvancedDnsRoutingAnalyzerService', () => {
  let analyzer: AdvancedDnsRoutingAnalyzerService;

  beforeEach(() => {
    analyzer = new AdvancedDnsRoutingAnalyzerService();
  });

  describe('DNSSEC Analysis', () => {
    it('identifies cryptographically valid DNSSEC configuration', () => {
      const assessment = analyzer.analyzeDnssec({
        enabled: true,
        status: 'VALID',
        hasDs: true,
        hasDnskey: true,
        hasRrsig: true,
        keyTags: [2371],
        algorithms: ['ECDSAP256SHA256 (13)'],
        digestTypes: ['SHA-256 (2)'],
      });

      expect(assessment.enabled).toBe(true);
      expect(assessment.status).toBe('VALID');
      expect(assessment.isHardened).toBe(true);
      expect(assessment.summary).toContain('fully valid');
    });

    it('identifies expired DNSSEC RRSIG signatures', () => {
      const assessment = analyzer.analyzeDnssec({
        enabled: true,
        status: 'EXPIRED_RRSIG',
        hasDs: true,
        hasDnskey: true,
        hasRrsig: true,
      });

      expect(assessment.status).toBe('EXPIRED_RRSIG');
      expect(assessment.isHardened).toBe(false);
      expect(assessment.summary).toContain('expired');
    });

    it('identifies unsigned DNS zones', () => {
      const assessment = analyzer.analyzeDnssec({
        enabled: false,
        status: 'UNSIGNED',
        hasDs: false,
        hasDnskey: false,
        hasRrsig: false,
      });

      expect(assessment.status).toBe('UNSIGNED');
      expect(assessment.isHardened).toBe(false);
      expect(assessment.summary).toContain('not enabled');
    });
  });

  describe('CAA Record Analysis', () => {
    it('validates compliant CAA policy matching active TLS issuer', () => {
      const assessment = analyzer.analyzeCaa(
        [
          { critical: 0, issue: 'letsencrypt.org' },
          { critical: 0, issuewild: ';' },
          { critical: 0, iodef: 'mailto:security@example.com' },
        ],
        "Let's Encrypt Authority X3",
      );

      expect(assessment.present).toBe(true);
      expect(assessment.isHardened).toBe(true);
      expect(assessment.isTlsIssuerPermitted).toBe(true);
      expect(assessment.issuerMismatchDetected).toBe(false);
      expect(assessment.authorizedIssuers).toContain('letsencrypt.org');
      expect(assessment.wildcardIssuers).toContain(';');
      expect(assessment.iodefMailbox).toBe('mailto:security@example.com');
    });

    it('detects issuer mismatch when active TLS issuer is not in CAA policy', () => {
      const assessment = analyzer.analyzeCaa(
        [{ critical: 0, issue: 'digicert.com' }],
        "Let's Encrypt Authority X3",
      );

      expect(assessment.present).toBe(true);
      expect(assessment.issuerMismatchDetected).toBe(true);
      expect(assessment.isTlsIssuerPermitted).toBe(false);
      expect(assessment.isHardened).toBe(false);
      expect(assessment.summary).toContain('restricts certificate issuance');
    });

    it('identifies missing CAA records allowing all CAs', () => {
      const assessment = analyzer.analyzeCaa([]);

      expect(assessment.present).toBe(false);
      expect(assessment.allowsAllIssuers).toBe(true);
      expect(assessment.isHardened).toBe(false);
    });
  });

  describe('BGP RPKI Analysis', () => {
    it('evaluates fully valid RPKI ROA deployment', () => {
      const assessment = analyzer.analyzeBgpRpki({
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
      });

      expect(assessment.isHardened).toBe(true);
      expect(assessment.coveragePercentage).toBe(100);
      expect(assessment.hijackRiskDetected).toBe(false);
      expect(assessment.summary).toContain('cryptographically authenticated');
    });

    it('flags BGP hijack risk when RPKI status is INVALID', () => {
      const assessment = analyzer.analyzeBgpRpki({
        routes: [
          {
            ip: '198.51.100.1',
            ipVersion: 4,
            prefix: '198.51.100.0/24',
            asn: 99999,
            asName: 'ROGUE-ASN',
            rpkiStatus: 'INVALID',
          },
        ],
        uniqueAsns: [99999],
        isMultiHomed: false,
        rpkiSummary: {
          totalRoutes: 1,
          validCount: 0,
          invalidCount: 1,
          notFoundCount: 0,
          overallRpkiStatus: 'INVALID',
          coveragePercentage: 0,
        },
        hijackRiskDetected: true,
        status: 'SUCCESS',
      });

      expect(assessment.isHardened).toBe(false);
      expect(assessment.hijackRiskDetected).toBe(true);
      expect(assessment.summary).toContain('INVALID');
    });
  });

  describe('Holistic Assessment', () => {
    it('computes high score and compliance for fully hardened domain', () => {
      const assessment = analyzer.assessAdvancedDnsRouting('hardened.io', {
        dns: {
          dnssec: {
            enabled: true,
            status: 'VALID',
            hasDs: true,
            hasDnskey: true,
            hasRrsig: true,
          },
          caa: [{ critical: 0, issue: 'letsencrypt.org' }],
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
      });

      expect(assessment.overallScore).toBe(100);
      expect(assessment.isCompliant).toBe(true);
      expect(assessment.summary).toContain(
        'Hardened Advanced DNS & Routing security',
      );
    });
  });
});
