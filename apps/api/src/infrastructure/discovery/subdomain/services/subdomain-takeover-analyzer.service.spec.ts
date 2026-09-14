import { SubdomainTakeoverAnalyzerService } from './subdomain-takeover-analyzer.service';

describe('SubdomainTakeoverAnalyzerService', () => {
  let service: SubdomainTakeoverAnalyzerService;

  beforeEach(() => {
    service = new SubdomainTakeoverAnalyzerService();
  });

  describe('1. Takeover Risk Analysis', () => {
    it('detects CRITICAL risk when unclaimed fingerprint is in HTTP response for AWS S3', () => {
      const result = service.evaluateTakeoverRisk({
        hostname: 'assets.example.com',
        cnameTargets: ['my-bucket.s3.amazonaws.com'],
        ipAddresses: ['52.218.1.1'],
        httpResponseBody:
          '<Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message>',
      });

      expect(result.risk).toBe('CRITICAL');
      expect(result.matchedProvider).toBe('AWS S3');
      expect(result.reason).toContain('NoSuchBucket');
      expect(result.remediation).toBeDefined();
    });

    it('detects CRITICAL risk when GitHub Pages returns 404 project not found', () => {
      const result = service.evaluateTakeoverRisk({
        hostname: 'docs.example.com',
        cnameTargets: ['org.github.io'],
        ipAddresses: ['185.199.108.153'],
        httpResponseBody: "404 There isn't a GitHub Pages site here",
      });

      expect(result.risk).toBe('CRITICAL');
      expect(result.matchedProvider).toBe('GitHub Pages');
    });

    it('detects HIGH risk when pointing to cloud provider with zero active IPs (dangling pointer)', () => {
      const result = service.evaluateTakeoverRisk({
        hostname: 'app.example.com',
        cnameTargets: ['my-app.azurewebsites.net'],
        ipAddresses: [],
      });

      expect(result.risk).toBe('HIGH');
      expect(result.matchedProvider).toBe('Azure App Service');
      expect(result.reason).toContain('Dangling CNAME');
    });

    it('detects LOW risk when pointing to active cloud provider with healthy IPs', () => {
      const result = service.evaluateTakeoverRisk({
        hostname: 'cdn.example.com',
        cnameTargets: ['dualstack.fastly.net'],
        ipAddresses: ['151.101.1.1'],
      });

      expect(result.risk).toBe('LOW');
      expect(result.matchedProvider).toBe('Fastly');
    });

    it('returns NONE when no CNAME targets exist', () => {
      const result = service.evaluateTakeoverRisk({
        hostname: 'api.example.com',
        cnameTargets: [],
        ipAddresses: ['104.16.1.1'],
      });

      expect(result.risk).toBe('NONE');
    });
  });

  describe('2. Environment Classification', () => {
    it('classifies development environments correctly', () => {
      expect(service.classifyEnvironment('dev')).toBe('DEVELOPMENT');
      expect(service.classifyEnvironment('sandbox')).toBe('DEVELOPMENT');
      expect(service.classifyEnvironment('api-dev')).toBe('DEVELOPMENT');
    });

    it('classifies staging environments correctly', () => {
      expect(service.classifyEnvironment('staging')).toBe('STAGING');
      expect(service.classifyEnvironment('stage')).toBe('STAGING');
      expect(service.classifyEnvironment('qa')).toBe('STAGING');
      expect(service.classifyEnvironment('uat')).toBe('STAGING');
      expect(service.classifyEnvironment('preview')).toBe('STAGING');
    });

    it('classifies internal environments correctly', () => {
      expect(service.classifyEnvironment('internal')).toBe('INTERNAL');
      expect(service.classifyEnvironment('corp')).toBe('INTERNAL');
      expect(service.classifyEnvironment('vpn')).toBe('INTERNAL');
      expect(service.classifyEnvironment('admin')).toBe('INTERNAL');
      expect(service.classifyEnvironment('grafana')).toBe('INTERNAL');
    });

    it('classifies production environments correctly', () => {
      expect(service.classifyEnvironment('api')).toBe('PRODUCTION');
      expect(service.classifyEnvironment('app')).toBe('PRODUCTION');
      expect(service.classifyEnvironment('auth')).toBe('PRODUCTION');
      expect(service.classifyEnvironment('www')).toBe('PRODUCTION');
      expect(service.classifyEnvironment('mail')).toBe('PRODUCTION');
    });

    it('classifies deprecated environments correctly', () => {
      expect(service.classifyEnvironment('legacy')).toBe('DEPRECATED');
      expect(service.classifyEnvironment('old')).toBe('DEPRECATED');
    });
  });
});
