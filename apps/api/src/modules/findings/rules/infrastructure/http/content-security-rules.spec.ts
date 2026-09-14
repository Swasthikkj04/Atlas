import { ContentSecurityAnalyzerService } from '../../../services/content-security-analyzer.service';
import { CspPermissiveDirectivesRule } from './csp-permissive-directives.rule';
import { CrossOriginIsolationHygieneRule } from './cross-origin-isolation-hygiene.rule';
import { PermissionsPolicyHygieneRule } from './permissions-policy-hygiene.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('S4 Content Security Rules & Invariant Audit', () => {
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

  describe('CspPermissiveDirectivesRule', () => {
    it('triggers finding when CSP contains unsafe-inline on HTML document', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            finalUrl: 'https://app.example.com',
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'content-security-policy':
                "default-src 'self'; script-src 'self' 'unsafe-inline'",
            },
          } as any,
        },
      };

      const findings = await cspRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.csp-permissive-directives');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].description).toContain("'unsafe-inline'");
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not prove the presence of an exploitable XSS',
      );
    });

    it('does NOT trigger on strict CSP with no unsafe tokens', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            headers: {
              'content-type': 'text/html',
              'content-security-policy':
                "default-src 'self'; script-src 'self' https://cdn.example.com",
            },
          } as any,
        },
      };

      const findings = await cspRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });

    it('does NOT evaluate on non-HTML API endpoints (JSON)', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://api.example.com/v1/users',
            headers: {
              'content-type': 'application/json',
              'content-security-policy': "default-src 'self' 'unsafe-inline'",
            },
          } as any,
        },
      };

      const findings = await cspRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('CrossOriginIsolationHygieneRule', () => {
    it('triggers on HTTPS HTML document when COOP/COEP are missing', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            headers: {
              'content-type': 'text/html',
            },
          } as any,
        },
      };

      const findings = await coopRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.cross-origin-isolation-hygiene');
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not prove active cross-origin data theft',
      );
    });

    it('does NOT trigger when COOP same-origin and COEP require-corp are present', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            headers: {
              'content-type': 'text/html',
              'cross-origin-opener-policy': 'same-origin',
              'cross-origin-embedder-policy': 'require-corp',
            },
          } as any,
        },
      };

      const findings = await coopRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('PermissionsPolicyHygieneRule', () => {
    it('triggers when Permissions-Policy is absent on HTTPS HTML', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            headers: {
              'content-type': 'text/html',
            },
          } as any,
        },
      };

      const findings = await permissionsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.permissions-policy-hygiene');
      expect(findings[0].severity).toBe(Severity.LOW);
      expect(findings[0].whatThisDoesNotProve).toContain(
        'does not allow websites to access device hardware without explicit user prompts',
      );
    });

    it('does NOT trigger when Permissions-Policy restricts sensitive hardware APIs', async () => {
      const context: FindingContext = {
        domainId: 'dom-1',
        snapshotId: 'snap-1',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            statusCode: 200,
            url: 'https://app.example.com',
            headers: {
              'content-type': 'text/html',
              'permissions-policy': 'camera=(), microphone=(), geolocation=()',
            },
          } as any,
        },
      };

      const findings = await permissionsRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
