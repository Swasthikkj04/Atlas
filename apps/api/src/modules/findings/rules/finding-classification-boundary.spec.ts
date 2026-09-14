import { MissingSpfRule } from './infrastructure/dns/missing-spf.rule';
import { MissingDmarcRule } from './infrastructure/dns/missing-dmarc.rules';
import { MissingMxRule } from './infrastructure/dns/missing-mx.rules';
import { SingleNameserverRule } from './infrastructure/dns/single-nameserver.rule';
import { MissingIpv6Rule } from './infrastructure/dns/missing-ipv6.rule';
import { SlowResponseRule } from './infrastructure/http/slow-response.rule';
import { MissingHstsRule } from './infrastructure/http/missing-hsts.rule';
import { WeakTlsVersionRule } from './infrastructure/ssl/weak-tls-version.rule';
import { FindingCategory } from '../enums/finding-category.enum';
import { Severity } from '../enums/severity.enum';
import type { FindingContext } from '../contracts/finding-context.interface';

describe('WX-1023: Finding Risk Classification and Exploit Boundary Audit', () => {
  describe('1. Confirmed Security Conditions vs Hardening Gaps', () => {
    it('accurately classifies weak TLS protocol negotiation as CONFIRMED_SECURITY_CONDITION', async () => {
      const rule = new WeakTlsVersionRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          ssl: {
            reachable: true,
            supported: true,
            authorized: true,
            protocol: 'TLSv1',
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].riskClassification).toBe(
        'CONFIRMED_SECURITY_CONDITION',
      );
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not prove active eavesdropping',
      );
    });

    it('accurately classifies missing HSTS as SECURITY_HARDENING_GAP without claiming traffic is intercepted', async () => {
      const rule = new MissingHstsRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 60,
            queryStatus: 'SUCCESS',
            protocol: 'https',
            headers: {
              'content-type': 'text/html',
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].riskClassification).toBe('SECURITY_HARDENING_GAP');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not establish that network traffic is currently being intercepted',
      );
    });

    it('accurately classifies missing SPF and DMARC as SECURITY_HARDENING_GAP without claiming active spoofing', async () => {
      const spfRule = new MissingSpfRule();
      const dmarcRule = new MissingDmarcRule();

      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          dns: {
            a: ['1.2.3.4'],
            txt: ['some-verification=123'],
            dmarc: [],
            ns: ['ns1.example.com'],
            aaaa: [],
            mx: [],
            status: {
              txt: 'SUCCESS',
              dmarc: 'SUCCESS',
            },
          },
        },
      };

      const spfFindings = await spfRule.evaluate(context);
      const dmarcFindings = await dmarcRule.evaluate(context);

      expect(spfFindings).toHaveLength(1);
      expect(spfFindings[0].riskClassification).toBe('SECURITY_HARDENING_GAP');
      expect(spfFindings[0].whatThisDoesNotProve).toContain(
        'does not establish that unauthorized emails are currently being forged',
      );

      expect(dmarcFindings).toHaveLength(1);
      expect(dmarcFindings[0].riskClassification).toBe(
        'SECURITY_HARDENING_GAP',
      );
      expect(dmarcFindings[0].whatThisDoesNotProve).toContain(
        'does not establish that phishing attacks are actively impersonating',
      );
    });
  });

  describe('2. Operational Observations are NOT Security Vulnerabilities', () => {
    it('accurately classifies Slow HTTP Response as OPERATIONAL_OBSERVATION under PERFORMANCE category', async () => {
      const rule = new SlowResponseRule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          http: {
            reachable: true,
            status: 200,
            statusCode: 200,
            responseTimeMs: 3200, // > 2000ms
            headers: {},
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].category).toBe(FindingCategory.PERFORMANCE);
      expect(findings[0].riskClassification).toBe('OPERATIONAL_OBSERVATION');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not represent a security vulnerability',
      );
    });

    it('accurately classifies Missing MX and Single Nameserver as OPERATIONAL_OBSERVATION', async () => {
      const mxRule = new MissingMxRule();
      const nsRule = new SingleNameserverRule();

      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          dns: {
            a: ['1.2.3.4'],
            mx: [],
            ns: ['ns1.single-server.com'],
            aaaa: [],
            txt: [],
            dmarc: [],
            status: {
              mx: 'SUCCESS',
              ns: 'SUCCESS',
            },
          },
        },
      };

      const mxFindings = await mxRule.evaluate(context);
      const nsFindings = await nsRule.evaluate(context);

      expect(mxFindings).toHaveLength(1);
      expect(mxFindings[0].riskClassification).toBe('OPERATIONAL_OBSERVATION');
      expect(mxFindings[0].whatThisDoesNotProve).toContain(
        'does not represent a security vulnerability',
      );

      expect(nsFindings).toHaveLength(1);
      expect(nsFindings[0].riskClassification).toBe('OPERATIONAL_OBSERVATION');
      expect(nsFindings[0].whatThisDoesNotProve).toContain(
        'does not indicate an exploitable vulnerability',
      );
    });
  });

  describe('3. Informational Observations are NOT Security Risks', () => {
    it('accurately classifies Missing IPv6 as INFORMATIONAL_OBSERVATION with INFO severity', async () => {
      const rule = new MissingIpv6Rule();
      const context: FindingContext = {
        domainId: 'd-1',
        snapshotId: 's-1',
        snapshot: {
          dns: {
            a: ['1.2.3.4'],
            aaaa: [],
            ns: ['ns1.example.com', 'ns2.example.com'],
            mx: ['mail.example.com'],
            txt: ['v=spf1 ~all'],
            dmarc: ['v=DMARC1; p=reject'],
            status: {
              aaaa: 'SUCCESS',
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.INFO);
      expect(findings[0].riskClassification).toBe('INFORMATIONAL_OBSERVATION');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not represent a vulnerability or security risk',
      );
    });
  });
});
