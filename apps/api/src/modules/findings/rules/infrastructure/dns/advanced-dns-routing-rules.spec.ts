import { AdvancedDnsRoutingAnalyzerService } from '../../../services/advanced-dns-routing-analyzer.service';
import { DnssecValidationRule } from './dnssec-validation.rule';
import { CaaPolicyComplianceRule } from './caa-policy-compliance.rule';
import { BgpRpkiValidationRule } from './bgp-rpki-validation.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('Advanced DNSSEC, CAA & BGP RPKI Validation Rules', () => {
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

  describe('DnssecValidationRule', () => {
    it('returns empty when DNSSEC is cryptographically valid', async () => {
      const context: FindingContext = {
        domain: 'secure.org',
        snapshot: {
          dns: {
            dnssec: {
              enabled: true,
              status: 'VALID',
              hasDs: true,
              hasDnskey: true,
              hasRrsig: true,
            },
            status: { dnssec: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dnssecRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('flags expired RRSIG signature with HIGH severity', async () => {
      const context: FindingContext = {
        domain: 'expired-dnssec.com',
        snapshot: {
          dns: {
            dnssec: {
              enabled: true,
              status: 'EXPIRED_RRSIG',
              hasDs: true,
              hasDnskey: true,
              hasRrsig: true,
            },
            status: { dnssec: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dnssecRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.dnssec-validation');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('Expired DNSSEC Signature');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'expired cryptographic signature in DNS',
      );
    });

    it('flags broken chain of trust (DS/DNSKEY mismatch) with MEDIUM severity', async () => {
      const context: FindingContext = {
        domain: 'broken-chain.com',
        snapshot: {
          dns: {
            dnssec: {
              enabled: true,
              status: 'MISCONFIGURED',
              hasDs: true,
              hasDnskey: true,
              hasRrsig: true,
            },
            status: { dnssec: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dnssecRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].title).toContain('Broken DNSSEC Chain of Trust');
    });

    it('flags unsigned DNS zone with LOW severity', async () => {
      const context: FindingContext = {
        domain: 'unsigned.com',
        snapshot: {
          dns: {
            dnssec: {
              enabled: false,
              status: 'UNSIGNED',
              hasDs: false,
              hasDnskey: false,
              hasRrsig: false,
            },
            status: { dnssec: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dnssecRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].title).toContain('DNSSEC Not Configured');
    });

    it('preserves truth on lookup failures (SERVFAIL / TIMEOUT)', async () => {
      const context: FindingContext = {
        domain: 'timeout.com',
        snapshot: {
          dns: {
            status: { dnssec: 'TIMEOUT' },
          },
        } as any,
      };

      const findings = await dnssecRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('CaaPolicyComplianceRule', () => {
    it('returns empty when CAA permits active TLS issuer', async () => {
      const context: FindingContext = {
        domain: 'permitted.com',
        snapshot: {
          dns: {
            caa: [{ critical: 0, issue: 'letsencrypt.org' }],
            status: { caa: 'SUCCESS' },
          },
          ssl: {
            certificate: { issuer: "Let's Encrypt Authority X3" },
          },
        } as any,
      };

      const findings = await caaRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('flags CAA issuer mismatch with HIGH severity', async () => {
      const context: FindingContext = {
        domain: 'mismatch.com',
        snapshot: {
          dns: {
            caa: [{ critical: 0, issue: 'digicert.com' }],
            status: { caa: 'SUCCESS' },
          },
          ssl: {
            certificate: { issuer: "Let's Encrypt Authority X3" },
          },
        } as any,
      };

      const findings = await caaRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.caa-policy-compliance');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain(
        'CAA Record Restricts Active TLS Certificate Authority',
      );
    });

    it('flags missing CAA record with LOW severity', async () => {
      const context: FindingContext = {
        domain: 'no-caa.com',
        snapshot: {
          dns: {
            caa: [],
            status: { caa: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await caaRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].title).toContain('Missing CAA Record');
    });
  });

  describe('BgpRpkiValidationRule', () => {
    it('returns empty when all BGP prefixes have VALID RPKI ROAs', async () => {
      const context: FindingContext = {
        domain: 'valid-bgp.com',
        snapshot: {
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
        },
      };

      const findings = await bgpRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('flags RPKI INVALID route with HIGH severity', async () => {
      const context: FindingContext = {
        domain: 'hijacked-bgp.com',
        snapshot: {
          routing: {
            routes: [
              {
                ip: '198.51.100.1',
                ipVersion: 4,
                prefix: '198.51.100.0/24',
                asn: 99999,
                asName: 'ROGUE-AS',
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
          },
        },
      };

      const findings = await bgpRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('network.bgp-rpki-validation');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain(
        'BGP Route Origin Authorization (ROA) Mismatch / Hijack Risk',
      );
      expect(findings[0].whatThisDoesNotProve).toContain(
        'RPKI cryptographic mismatch',
      );
    });

    it('flags unauthenticated BGP prefix with LOW severity', async () => {
      const context: FindingContext = {
        domain: 'unauthenticated-bgp.com',
        snapshot: {
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
        },
      };

      const findings = await bgpRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].title).toContain(
        'BGP Prefix Lacks Cryptographic RPKI Route Origin Authorization',
      );
    });
  });
});
