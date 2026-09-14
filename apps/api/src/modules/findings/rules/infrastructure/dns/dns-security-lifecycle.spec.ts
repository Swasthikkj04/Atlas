import { DnsSecurityAnalyzerService } from '../../../services/dns-security-analyzer.service';
import { DmarcPolicyHygieneRule } from './dmarc-policy-hygiene.rule';
import { SpfPermissivePolicyRule } from './spf-permissive-policy.rule';
import { DanglingCnameTakeoverRule } from './dangling-cname-takeover.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('S5 DNS Security Finding Lifecycle Integration', () => {
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

  it('demonstrates ACTIVE in snapshot N and RESOLVED in snapshot N+1 upon hardening', async () => {
    // Snapshot N: Permissive SPF, monitoring DMARC, dangling CNAME
    const snapshotN: FindingContext = {
      domain: 'security-lifecycle.io',
      snapshot: {
        dns: {
          txt: ['v=spf1 include:_spf.google.com ?all'],
          dmarc: ['v=DMARC1; p=none; rua=mailto:dmarc@security-lifecycle.io'],
          cname: ['old-blog.github.io'],
          a: [],
          status: { txt: 'SUCCESS', dmarc: 'SUCCESS', cname: 'SUCCESS' },
        },
        http: { reachable: false },
      } as any,
    };

    const dmarcFindingsN = await dmarcRule.evaluate(snapshotN);
    const spfFindingsN = await spfRule.evaluate(snapshotN);
    const takeoverFindingsN = await takeoverRule.evaluate(snapshotN);

    expect(dmarcFindingsN).toHaveLength(1);
    expect(spfFindingsN).toHaveLength(1);
    expect(takeoverFindingsN).toHaveLength(1);

    // Snapshot N+1: Remediated
    const snapshotNPlus1: FindingContext = {
      domain: 'security-lifecycle.io',
      snapshot: {
        dns: {
          txt: ['v=spf1 include:_spf.google.com -all'],
          dmarc: ['v=DMARC1; p=reject; rua=mailto:dmarc@security-lifecycle.io'],
          cname: [],
          a: ['104.21.15.22'],
          status: { txt: 'SUCCESS', dmarc: 'SUCCESS', cname: 'SUCCESS' },
        },
        http: { reachable: true },
      } as any,
    };

    const dmarcFindingsN1 = await dmarcRule.evaluate(snapshotNPlus1);
    const spfFindingsN1 = await spfRule.evaluate(snapshotNPlus1);
    const takeoverFindingsN1 = await takeoverRule.evaluate(snapshotNPlus1);

    expect(dmarcFindingsN1).toHaveLength(0);
    expect(spfFindingsN1).toHaveLength(0);
    expect(takeoverFindingsN1).toHaveLength(0);
  });
});
