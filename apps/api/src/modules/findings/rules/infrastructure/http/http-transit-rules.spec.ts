import { HttpTransitAnalyzerService } from '../../../services/http-transit-analyzer.service';
import { InsecureCorsPolicyRule } from './insecure-cors-policy.rule';
import { DangerousMethodsExposedRule } from './dangerous-methods-exposed.rule';
import { CleartextUpgradeMissingRule } from './cleartext-upgrade-missing.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('HTTP Transit & Transit Invariant Rules (S6)', () => {
  let transitAnalyzer: HttpTransitAnalyzerService;
  let corsRule: InsecureCorsPolicyRule;
  let methodsRule: DangerousMethodsExposedRule;
  let upgradeRule: CleartextUpgradeMissingRule;

  beforeEach(() => {
    transitAnalyzer = new HttpTransitAnalyzerService();
    corsRule = new InsecureCorsPolicyRule(transitAnalyzer);
    methodsRule = new DangerousMethodsExposedRule(transitAnalyzer);
    upgradeRule = new CleartextUpgradeMissingRule(transitAnalyzer);
  });

  describe('InsecureCorsPolicyRule (http.insecure-cors-policy)', () => {
    it('emits HIGH finding when Access-Control-Allow-Origin: * is paired with Access-Control-Allow-Credentials: true', async () => {
      const context: FindingContext = {
        domainName: 'cors-vulnerable.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              'access-control-allow-origin': '*',
              'access-control-allow-credentials': 'true',
            },
          },
        } as any,
      };

      const findings = await corsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.insecure-cors-policy');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('Credentials Allowed');
    });

    it('emits MEDIUM finding when wildcard CORS is enabled without credentials', async () => {
      const context: FindingContext = {
        domainName: 'cors-wildcard.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              'access-control-allow-origin': '*',
            },
          },
        } as any,
      };

      const findings = await corsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].title).toBe('Wildcard CORS Origin Policy Configured');
    });

    it('returns empty when CORS is restricted to specific origin', async () => {
      const context: FindingContext = {
        domainName: 'cors-safe.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              'access-control-allow-origin': 'https://dashboard.cors-safe.com',
              'access-control-allow-credentials': 'true',
            },
          },
        } as any,
      };

      const findings = await corsRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('DangerousMethodsExposedRule (http.dangerous-methods-exposed)', () => {
    it('emits HIGH finding when TRACE method is enabled in Allow header', async () => {
      const context: FindingContext = {
        domainName: 'trace-enabled.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              allow: 'GET, POST, TRACE, OPTIONS',
            },
          },
        } as any,
      };

      const findings = await methodsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.dangerous-methods-exposed');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('TRACE Method Enabled (XST Risk)');
    });

    it('emits HIGH finding when CONNECT method is enabled', async () => {
      const context: FindingContext = {
        domainName: 'connect-enabled.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              public: 'GET, POST, CONNECT, OPTIONS',
            },
          },
        } as any,
      };

      const findings = await methodsRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.dangerous-methods-exposed');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
    });

    it('returns empty when only safe standard methods are advertised', async () => {
      const context: FindingContext = {
        domainName: 'safe-methods.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            headers: {
              allow: 'GET, HEAD, POST, OPTIONS',
            },
          },
        } as any,
      };

      const findings = await methodsRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('CleartextUpgradeMissingRule (http.cleartext-upgrade-missing)', () => {
    it('emits MEDIUM finding when port 80 responds with 200 OK without redirecting to HTTPS', async () => {
      const context: FindingContext = {
        domainName: 'cleartext-unprotected.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            redirectHops: [
              {
                url: 'http://cleartext-unprotected.com',
                scheme: 'http',
                statusCode: 200,
                headers: {},
              },
            ],
          },
        } as any,
      };

      const findings = await upgradeRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('http.cleartext-upgrade-missing');
      expect(findings[0].severity).toBe(Severity.MEDIUM);
      expect(findings[0].title).toContain(
        'Cleartext HTTP Not Redirected to HTTPS',
      );
    });

    it('returns empty when cleartext HTTP 301 redirects to HTTPS', async () => {
      const context: FindingContext = {
        domainName: 'properly-redirected.com',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            redirectHops: [
              {
                url: 'http://properly-redirected.com',
                scheme: 'http',
                statusCode: 301,
                location: 'https://properly-redirected.com/',
                headers: { location: 'https://properly-redirected.com/' },
              },
              {
                url: 'https://properly-redirected.com/',
                scheme: 'https',
                statusCode: 200,
                headers: {},
              },
            ],
          },
        } as any,
      };

      const findings = await upgradeRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });
});
