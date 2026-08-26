import { MissingSpfRule } from './missing-spf.rule';
import { MissingDmarcRule } from './missing-dmarc.rules';
import { MissingIpv6Rule } from './missing-ipv6.rule';
import { MissingMxRule } from './missing-mx.rules';
import { SingleNameserverRule } from './single-nameserver.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { FindingCategory } from '../../../enums/finding-category.enum';
import { Severity } from '../../../enums/severity.enum';

describe('WX-1020: DNS Rules Observation Truth & Finding Accuracy Audit', () => {
  let spfRule: MissingSpfRule;
  let dmarcRule: MissingDmarcRule;
  let ipv6Rule: MissingIpv6Rule;
  let mxRule: MissingMxRule;
  let nsRule: SingleNameserverRule;

  beforeEach(() => {
    spfRule = new MissingSpfRule();
    dmarcRule = new MissingDmarcRule();
    ipv6Rule = new MissingIpv6Rule();
    mxRule = new MissingMxRule();
    nsRule = new SingleNameserverRule();
  });

  describe('1. MissingSpfRule (dns.missing-spf)', () => {
    it('returns NO finding when SPF record exists (v=spf1 ...)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: ['192.0.2.1'],
            aaaa: [],
            mx: [],
            ns: ['ns1.example.com', 'ns2.example.com'],
            cname: [],
            txt: [['v=spf1 include:_spf.example.com ~all']],
            dmarc: [],
            status: { txt: 'SUCCESS' },
          },
        },
      };

      const findings = await spfRule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('returns SPF Record Not Found finding when TXT lookup succeeded and no SPF is present', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: ['192.0.2.1'],
            aaaa: [],
            mx: [],
            ns: ['ns1.example.com', 'ns2.example.com'],
            cname: [],
            txt: [['google-site-verification=abc123xyz']],
            dmarc: [],
            status: { txt: 'SUCCESS' },
          },
        },
      };

      const findings = await spfRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.missing-spf');
      expect(findings[0].title).toBe('SPF Record Not Found');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].category).toBe(FindingCategory.DNS_RECORD);
    });

    it('returns NO finding on DNS TIMEOUT (lookup failure != absence)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [],
            status: { txt: 'TIMEOUT' },
          },
        },
      };

      const findings = await spfRule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('returns NO finding on DNS SERVFAIL (lookup failure != absence)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [],
            status: { txt: 'SERVFAIL' },
          },
        },
      };

      const findings = await spfRule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('returns NO finding on DNS general FAILED status', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [],
            status: { txt: 'FAILED' },
          },
        },
      };

      const findings = await spfRule.evaluate(context);
      expect(findings).toEqual([]);
    });
  });

  describe('2. MissingDmarcRule (dns.missing-dmarc)', () => {
    it('returns NO finding when DMARC policy exists (v=DMARC1; ...)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [['v=DMARC1; p=reject; rua=mailto:dmarc@example.com']],
            status: { dmarc: 'SUCCESS' },
          },
        },
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('returns DMARC Record Not Found when DMARC lookup succeeded and record is absent', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [],
            status: { dmarc: 'NODATA' },
          },
        },
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.missing-dmarc');
      expect(findings[0].title).toBe('DMARC Record Not Found');
    });

    it('returns NO finding when DMARC resolution timed out or failed', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: [],
            aaaa: [],
            mx: [],
            ns: [],
            cname: [],
            txt: [],
            dmarc: [],
            status: { dmarc: 'TIMEOUT' },
          },
        },
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toEqual([]);
    });
  });

  describe('3. MissingIpv6Rule, MissingMxRule, SingleNameserverRule Lookup Failure Guards', () => {
    it('MissingIpv6Rule ignores AAAA resolution timeouts', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: ['192.0.2.1'],
            aaaa: [],
            mx: [],
            ns: ['ns1.example.com'],
            cname: [],
            txt: [],
            dmarc: [],
            status: { aaaa: 'TIMEOUT' },
          },
        },
      };

      const findings = await ipv6Rule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('MissingMxRule ignores MX resolution failures', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: ['192.0.2.1'],
            aaaa: [],
            mx: [],
            ns: ['ns1.example.com'],
            cname: [],
            txt: [],
            dmarc: [],
            status: { mx: 'SERVFAIL' },
          },
        },
      };

      const findings = await mxRule.evaluate(context);
      expect(findings).toEqual([]);
    });

    it('SingleNameserverRule ignores NS resolution timeouts', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snp-1',
        snapshot: {
          dns: {
            a: ['192.0.2.1'],
            aaaa: [],
            mx: [],
            ns: ['ns1.example.com'],
            cname: [],
            txt: [],
            dmarc: [],
            status: { ns: 'TIMEOUT' },
          },
        },
      };

      const findings = await nsRule.evaluate(context);
      expect(findings).toEqual([]);
    });
  });
});
