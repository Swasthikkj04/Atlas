import { PerimeterExposureAnalyzerService } from './perimeter-exposure-analyzer.service';

describe('PerimeterExposureAnalyzerService (S7 — Well-Known Perimeter Exposure)', () => {
  let service: PerimeterExposureAnalyzerService;

  beforeEach(() => {
    service = new PerimeterExposureAnalyzerService();
  });

  describe('Git Repository Exposure Evaluation', () => {
    it('detects exposed .git/HEAD file containing ref pointer', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://vulnerable.corp/.git/HEAD',
          statusCode: 200,
          body: 'ref: refs/heads/main\n',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.gitAudit.isGitRepoExposed).toBe(true);
      expect(report.gitAudit.refDetected).toBe('ref: refs/heads/main');
      expect(report.hasCriticalPerimeterExposure).toBe(true);
    });

    it('does not flag git exposure if git path is not exposed or returns 404', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://clean-site.corp/',
          statusCode: 200,
          body: '<html><body>Clean Site</body></html>',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.gitAudit.isGitRepoExposed).toBe(false);
    });
  });

  describe('Environment Config File Exposure Evaluation', () => {
    it('detects exposed .env secrets with DB_PASSWORD and AWS credentials', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://vulnerable.corp/.env',
          statusCode: 200,
          body: 'DB_PASSWORD=supersecret_pass123\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\nAPP_KEY=base64:abcd1234efgh\n',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.envAudit.isEnvFileExposed).toBe(true);
      expect(report.envAudit.sensitiveKeysDetected).toContain('DB_PASSWORD');
      expect(report.envAudit.sensitiveKeysDetected).toContain(
        'AWS_SECRET_ACCESS_KEY',
      );
      expect(report.envAudit.evidenceSnippet).toContain(
        '[REDACTED_SECRET_VALUE]',
      );
      expect(report.hasCriticalPerimeterExposure).toBe(true);
    });
  });

  describe('Management & Diagnostic Endpoint Exposure Evaluation', () => {
    it('detects exposed Prometheus metrics endpoint', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://vulnerable.corp/metrics',
          statusCode: 200,
          body: '# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.\n# TYPE process_cpu_seconds_total counter\nprocess_cpu_seconds_total 1234.56\n',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.managementAudit.isMetricsExposed).toBe(true);
      expect(report.managementAudit.exposedServices).toContain(
        'Prometheus Metrics (/metrics)',
      );
    });

    it('detects exposed Spring Boot Actuator endpoint', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://vulnerable.corp/actuator',
          statusCode: 200,
          body: '{"_links":{"self":{"href":"https://vulnerable.corp/actuator","templated":false},"health":{"href":"https://vulnerable.corp/actuator/health","templated":false},"heapdump":{"href":"https://vulnerable.corp/actuator/heapdump","templated":false}}}',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.managementAudit.isActuatorExposed).toBe(true);
      expect(report.managementAudit.exposedServices).toContain(
        'Spring Boot Actuator (/actuator)',
      );
    });

    it('detects GraphQL schema introspection response', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          url: 'https://vulnerable.corp/graphql',
          statusCode: 200,
          body: '{"data":{"__schema":{"queryType":{"name":"Query"},"mutationType":{"name":"Mutation"},"types":[{"kind":"OBJECT","name":"User"}]}}}',
        },
      };

      const report = service.analyzePerimeter(snapshot);
      expect(report.managementAudit.isGraphqlIntrospectionExposed).toBe(true);
      expect(report.managementAudit.exposedServices).toContain(
        'GraphQL Introspection Query',
      );
    });
  });
});
