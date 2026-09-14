import { PerimeterExposureAnalyzerService } from '../../../services/perimeter-exposure-analyzer.service';
import { GitRepositoryExposureRule } from './git-repository-exposure.rule';
import { EnvFileExposureRule } from './env-file-exposure.rule';
import { ManagementEndpointExposureRule } from './management-endpoint-exposure.rule';
import { FindingContext } from '../../../contracts/finding-context.interface';
import { Severity } from '../../../enums/severity.enum';

describe('Perimeter & Configuration Exposure Rules (S7)', () => {
  let perimeterAnalyzer: PerimeterExposureAnalyzerService;
  let gitRule: GitRepositoryExposureRule;
  let envRule: EnvFileExposureRule;
  let managementRule: ManagementEndpointExposureRule;

  beforeEach(() => {
    perimeterAnalyzer = new PerimeterExposureAnalyzerService();
    gitRule = new GitRepositoryExposureRule(perimeterAnalyzer);
    envRule = new EnvFileExposureRule(perimeterAnalyzer);
    managementRule = new ManagementEndpointExposureRule(perimeterAnalyzer);
  });

  describe('GitRepositoryExposureRule (security.git-repository-exposure)', () => {
    it('emits CRITICAL finding when .git/HEAD file is publicly readable', async () => {
      const context: FindingContext = {
        domainName: 'git-exposed.io',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            url: 'https://git-exposed.io/.git/HEAD',
            statusCode: 200,
            body: 'ref: refs/heads/master\n',
          },
        } as any,
      };

      const findings = await gitRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('security.git-repository-exposure');
      expect(findings[0].severity).toBe(Severity.CRITICAL);
      expect(findings[0].title).toContain('Exposed Git Repository Metadata');
    });

    it('returns empty when no git repository markers exist', async () => {
      const context: FindingContext = {
        domainName: 'clean-app.io',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            url: 'https://clean-app.io/',
            statusCode: 200,
            body: '<html>OK</html>',
          },
        } as any,
      };

      const findings = await gitRule.evaluate(context);
      expect(findings).toHaveLength(0);
    });
  });

  describe('EnvFileExposureRule (security.env-file-exposure)', () => {
    it('emits CRITICAL finding when .env secrets are exposed', async () => {
      const context: FindingContext = {
        domainName: 'env-exposed.io',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            url: 'https://env-exposed.io/.env',
            statusCode: 200,
            body: 'DATABASE_URL=postgres://user:secret@localhost:5432/prod\nJWT_SECRET=supersecret123\n',
          },
        } as any,
      };

      const findings = await envRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('security.env-file-exposure');
      expect(findings[0].severity).toBe(Severity.CRITICAL);
      expect(findings[0].title).toContain('.env');
    });
  });

  describe('ManagementEndpointExposureRule (security.management-endpoint-exposure)', () => {
    it('emits HIGH finding when Prometheus metrics endpoint is exposed', async () => {
      const context: FindingContext = {
        domainName: 'metrics-exposed.io',
        snapshot: {
          http: {
            reachable: true,
            queryStatus: 'SUCCESS',
            url: 'https://metrics-exposed.io/metrics',
            statusCode: 200,
            body: '# HELP http_requests_total The total number of HTTP requests.\n# TYPE http_requests_total counter\nhttp_requests_total 10542\n',
          },
        } as any,
      };

      const findings = await managementRule.evaluate(context);
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('security.management-endpoint-exposure');
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('Prometheus Metrics');
    });
  });
});
