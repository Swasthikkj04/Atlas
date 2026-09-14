import { DnsSecurityAnalyzerService } from '../../../services/dns-security-analyzer.service';
import { DmarcPolicyHygieneRule } from './dmarc-policy-hygiene.rule';
import { SpfPermissivePolicyRule } from './spf-permissive-policy.rule';
import { DanglingCnameTakeoverRule } from './dangling-cname-takeover.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('S5 DNS Security Posture & Mail Authentication Rules', () => {
  let analyzer: DnsSecurityAnalyzerService;
  let dmarcRule: DmarcPolicyHygieneRule;
  let spfRule: SpfPermissivePolicyRule;
  let takeoverRule: DanglingCnameTakeoverRule;

  beforeEach(() => {
    analyzer = new DnsSecurityAnalyzerService();
    dmarcRule = new DmarcPolicyHygieneRule(analyzer);
    spfRule = new SpfPermissivePolicyRule(analyzer);
    takeoverRule = new DanglingCnameTakeoverRule(analyzer);
  });

  describe('DmarcPolicyHygieneRule', () => {
    it('triggers finding when DMARC policy is set to p=none (monitoring only)', async () => {
      const context: FindingContext = {
        domain: 'example.com',
        snapshot: {
          dns: {
            dmarc: ['v=DMARC1; p=none; rua=mailto:dmarc@example.com'],
            status: { dmarc: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.dmarc-policy-hygiene');
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].whatThisDoesNotProve).toContain(
        'reporting-only DMARC policy without active quarantine or rejection',
      );
    });

    it('returns empty when DMARC policy is strictly enforced (p=reject or p=quarantine)', async () => {
      const context: FindingContext = {
        domain: 'secure.com',
        snapshot: {
          dns: {
            dmarc: ['v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@secure.com'],
            status: { dmarc: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('preserves WX-1020: does not fire if DMARC lookup timed out or failed', async () => {
      const context: FindingContext = {
        domain: 'flaky.com',
        snapshot: {
          dns: {
            dmarc: [],
            status: { dmarc: 'TIMEOUT' },
          },
        } as any,
      };

      const findings = await dmarcRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('SpfPermissivePolicyRule', () => {
    it('triggers MEDIUM finding when SPF ends with +all or ?all', async () => {
      const contextPassAll: FindingContext = {
        domain: 'permissive.com',
        snapshot: {
          dns: {
            txt: ['v=spf1 include:_spf.google.com +all'],
            status: { txt: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await spfRule.evaluate(contextPassAll);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.spf-permissive-policy');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].whatThisDoesNotProve).toContain(
        'identifies a permissive SPF qualifier in DNS',
      );
    });

    it('returns empty when SPF ends with strict -all or ~all', async () => {
      const contextStrict: FindingContext = {
        domain: 'hardened.com',
        snapshot: {
          dns: {
            txt: ['v=spf1 include:_spf.google.com -all'],
            status: { txt: 'SUCCESS' },
          },
        } as any,
      };

      const findings = await spfRule.evaluate(contextStrict);
      expect(findings).toHaveLength(0);
    });
  });

  describe('DanglingCnameTakeoverRule', () => {
    it('triggers HIGH finding when CNAME points to cloud provider and target is unresolved', async () => {
      const context: FindingContext = {
        domain: 'abandoned-docs.corp.com',
        snapshot: {
          dns: {
            cname: ['my-old-docs.github.io'],
            a: [],
            status: { cname: 'SUCCESS' },
          },
          http: {
            reachable: false,
          },
        } as any,
      };

      const findings = await takeoverRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('dns.dangling-cname-takeover');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('GitHub Pages');
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not confirm that an adversary has successfully claimed',
      );
    });

    it('returns empty when CNAME points to active responding endpoint', async () => {
      const context: FindingContext = {
        domain: 'live-app.corp.com',
        snapshot: {
          dns: {
            cname: ['app.herokuapp.com'],
            a: ['54.231.1.1'],
            status: { cname: 'SUCCESS' },
          },
          http: {
            reachable: true,
          },
        } as any,
      };

      const findings = await takeoverRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
