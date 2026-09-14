import { ContentSecurityAnalyzerService } from '../../../services/content-security-analyzer.service';
import { CspPermissiveDirectivesRule } from './csp-permissive-directives.rule';
import { CrossOriginIsolationHygieneRule } from './cross-origin-isolation-hygiene.rule';
import { PermissionsPolicyHygieneRule } from './permissions-policy-hygiene.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';

describe('S4 Content Security Finding Lifecycle Transitions', () => {
  let analyzer: ContentSecurityAnalyzerService;
  let cspRule: CspPermissiveDirectivesRule;
  let coopRule: CrossOriginIsolationHygieneRule;
  let permissionsRule: PermissionsPolicyHygieneRule;

  beforeEach(() => {
    analyzer = new ContentSecurityAnalyzerService();
    cspRule = new CspPermissiveDirectivesRule(analyzer);
    coopRule = new CrossOriginIsolationHygieneRule(analyzer);
    permissionsRule = new PermissionsPolicyHygieneRule(analyzer);
  });

  it('demonstrates active finding generation in Snapshot N and resolution in Snapshot N+1', async () => {
    // Snapshot N: Unhardened website with permissive CSP and no COOP / Permissions-Policy
    const snapshotN: FindingContext = {
      domainId: 'domain-lifecycle-s4',
      snapshotId: 'snap-unhardened',
      snapshot: {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          statusCode: 200,
          url: 'https://staging.corp.internal',
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy':
              "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
          },
        } as any,
      },
    };

    const findingsN_Csp = await cspRule.evaluate(snapshotN);
    const findingsN_Coop = await coopRule.evaluate(snapshotN);
    const findingsN_Perm = await permissionsRule.evaluate(snapshotN);

    expect(findingsN_Csp).toHaveLength(1);
    expect(findingsN_Coop).toHaveLength(1);
    expect(findingsN_Perm).toHaveLength(1);

    // Snapshot N+1: Remediated website with strict CSP, COOP/COEP, and Permissions-Policy
    const snapshotNPlus1: FindingContext = {
      domainId: 'domain-lifecycle-s4',
      snapshotId: 'snap-hardened',
      snapshot: {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          statusCode: 200,
          url: 'https://staging.corp.internal',
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy':
              "default-src 'self'; script-src 'self' https://cdn.corp.internal; object-src 'none'; base-uri 'self'",
            'cross-origin-opener-policy': 'same-origin',
            'cross-origin-embedder-policy': 'require-corp',
            'permissions-policy': 'camera=(), microphone=(), geolocation=()',
          },
        } as any,
      },
    };

    const findingsNPlus1_Csp = await cspRule.evaluate(snapshotNPlus1);
    const findingsNPlus1_Coop = await coopRule.evaluate(snapshotNPlus1);
    const findingsNPlus1_Perm = await permissionsRule.evaluate(snapshotNPlus1);

    expect(findingsNPlus1_Csp).toHaveLength(0);
    expect(findingsNPlus1_Coop).toHaveLength(0);
    expect(findingsNPlus1_Perm).toHaveLength(0);
  });
});
