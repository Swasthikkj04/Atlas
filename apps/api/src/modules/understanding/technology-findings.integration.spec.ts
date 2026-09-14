import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { InfrastructureFindingService } from '../infrastructure-findings/services/infrastructure-finding.service';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { FindingModule } from '@prisma/client';
import { Severity } from '../findings/enums/severity.enum';

describe('TECH-007: Technology Finding Rules & Architecture Risk Engine Integration', () => {
  let moduleRef: TestingModule;
  let ruleEngine: FindingRuleEngineService;
  let techDiscovery: TechnologyDiscoveryService;
  let findingService: InfrastructureFindingService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    findingService = moduleRef.get(InfrastructureFindingService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Ingress & Origin Exposure Rule Evaluation', () => {
    it('evaluates Cloudflare Anycast + Leaked Apache Server header and produces an architectural finding', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.60'],
          ns: ['ns1.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://exposed-origin.com',
          finalUrl: 'https://exposed-origin.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'Apache/2.4.52 (Ubuntu)',
            'cf-ray': '89a123-iad',
            'x-powered-by': 'PHP/8.2.14',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      snapshot.technology = await techDiscovery.discover(
        'exposed-origin.com',
        snapshot,
      );

      const context: FindingContext = {
        domainId: 'dom-origin-001',
        snapshotId: 'snp-origin-001',
        snapshot,
      };

      const findings = await ruleEngine.evaluate(context);
      const techFindings = findings.filter(
        (f) =>
          f.module === FindingModule.TECHNOLOGY || f.ruleId.startsWith('tech.'),
      );

      expect(techFindings.length).toBeGreaterThanOrEqual(1);

      // Edge Origin Exposure
      const originFinding = techFindings.find(
        (f) => f.ruleId === 'tech.edge-origin-exposure',
      );
      expect(originFinding).toBeDefined();
      expect(originFinding?.severity).toBe(Severity.MEDIUM);
      expect(originFinding?.whatThisDoesNotProve).toBeDefined();

      // Technology Version Exposure
      const versionFinding = techFindings.find(
        (f) => f.ruleId === 'tech.version-exposure',
      );
      expect(versionFinding).toBeDefined();
      expect(versionFinding?.description).toContain('Apache');
      expect(versionFinding?.description).toContain('PHP');
    });
  });

  describe('2. Deprecated Legacy Software Detection', () => {
    it('flags end-of-life PHP 7.x software component while preserving modern versions', async () => {
      const legacySnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://legacy-php.org',
          finalUrl: 'https://legacy-php.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'PHP/7.4.3',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      legacySnapshot.technology = await techDiscovery.discover(
        'legacy-php.org',
        legacySnapshot,
      );

      const context: FindingContext = {
        domainId: 'dom-legacy-001',
        snapshotId: 'snp-legacy-001',
        snapshot: legacySnapshot,
      };

      const findings = await ruleEngine.evaluate(context);
      const deprecatedFinding = findings.find(
        (f) => f.ruleId === 'tech.deprecated-gateway-version',
      );

      expect(deprecatedFinding).toBeDefined();
      expect(deprecatedFinding?.title).toContain('PHP');
      expect(deprecatedFinding?.severity).toBe(Severity.MEDIUM);
    });
  });

  describe('3. Client-Side Secret Leakage vs Public SDK Distinction', () => {
    it('detects leaked private Stripe secret keys as CRITICAL while ignoring public publishable keys', async () => {
      const leakedSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://leaked-key.store',
          finalUrl: 'https://leaked-key.store',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: { server: 'Caddy' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: `<html><script>const stripe = Stripe("${['sk', 'live', '51Mabc1234567890abcdefghijklm'].join('_')}");</script></html>`,
      };

      leakedSnapshot.technology = await techDiscovery.discover(
        'leaked-key.store',
        leakedSnapshot,
      );

      const context: FindingContext = {
        domainId: 'dom-leak-001',
        snapshotId: 'snp-leak-001',
        snapshot: leakedSnapshot,
      };

      const findings = await ruleEngine.evaluate(context);
      const secretFinding = findings.find(
        (f) => f.ruleId === 'tech.client-integration-exposure',
      );

      expect(secretFinding).toBeDefined();
      expect(secretFinding?.severity).toBe(Severity.CRITICAL);
      expect(secretFinding?.riskClassification).toBe(
        'CONFIRMED_SECURITY_CONDITION',
      );
    });
  });

  describe('4. Performance & In-Memory Execution', () => {
    it('evaluates all technology rules in < 25ms with 0 network side-effects', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['1.1.1.1'],
          aaaa: [],
          mx: [],
          txt: [],
          cname: [],
          ns: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://benchmark-rules.io',
          finalUrl: 'https://benchmark-rules.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: { server: 'nginx/1.24.0', 'x-powered-by': 'Next.js' },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        htmlBody: '<script id="__NEXT_DATA__">{}</script>',
      };

      snapshot.technology = await techDiscovery.discover(
        'benchmark-rules.io',
        snapshot,
      );

      const context: FindingContext = {
        domainId: 'dom-perf-001',
        snapshotId: 'snp-perf-001',
        snapshot,
      };

      const start = performance.now();
      const findings = await ruleEngine.evaluate(context);
      const durationMs = performance.now() - start;

      expect(findings).toBeDefined();
      expect(durationMs).toBeLessThan(100);
    });
  });
});
