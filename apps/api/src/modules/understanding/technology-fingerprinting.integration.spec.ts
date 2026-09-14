import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDetectorRegistryService } from '../../infrastructure/discovery/technology/registry/technology-detector-registry.service';
import { TechnologyFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/technology-fingerprinting.engine';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { BaseTechnologyDetector } from '../../infrastructure/discovery/technology/base/base-technology.detector';
import {
  TechnologyCategory,
  TechnologyDetectionContext,
  TechnologyDetectionResult,
} from '../../infrastructure/discovery/technology/contracts';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('AT-TECH-001: Plug-and-Play Technology Fingerprinting Integration', () => {
  let moduleRef: TestingModule;
  let registry: TechnologyDetectorRegistryService;
  let engine: TechnologyFingerprintingEngine;
  let techDiscovery: TechnologyDiscoveryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();

    registry = moduleRef.get(TechnologyDetectorRegistryService);
    engine = moduleRef.get(TechnologyFingerprintingEngine);
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Standard Plug-and-Play Detection Lifecycle', () => {
    it('executes full suite of registered detectors against discovery snapshot observations', async () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.10'],
          cname: ['cname.vercel-dns.com'],
          ns: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          url: 'https://demo-app.vercel.app',
          finalUrl: 'https://demo-app.vercel.app',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 65,
          headers: {
            server: 'cloudflare',
            'cf-ray': '89a123bc-iad',
            'x-vercel-id': 'iad1::iad1::xyz',
            'x-powered-by': 'Next.js',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
          },
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
        ssl: {
          reachable: true,
          supported: true,
          responseTimeMs: 30,
          authorized: true,
          certificate: {
            subject: 'CN=demo-app.vercel.app',
            issuer: "Let's Encrypt",
            validFrom: '2026-01-01',
            validTo: '2027-01-01',
            serialNumber: '12345',
            subjectAltName: 'DNS:demo-app.vercel.app, DNS:vercel.app',
          },
          error: null,
        },
      };

      const result = await techDiscovery.discover(
        'demo-app.vercel.app',
        snapshot,
      );

      expect(result.technologies.length).toBeGreaterThanOrEqual(4);

      const techNames = result.technologies.map((t) => t.name);
      expect(techNames).toContain('Cloudflare');
      expect(techNames).toContain('Vercel');
      expect(techNames).toContain('Next.js');
      expect(techNames).toContain('HTTP Strict Transport Security (HSTS)');

      // Verify each detected technology retains rich evidence lineage and infrastructure meaning
      for (const tech of result.technologies) {
        expect(tech.status).toBe('DETECTED');
        expect(tech.confidence).toBeGreaterThan(0.8);
        expect(tech.confidenceLevel).toBe('HIGH');
        expect(typeof tech.role).toBe('string');
        expect(tech.role.length).toBeGreaterThan(0);
        expect(typeof tech.infrastructureMeaning).toBe('string');
        expect(tech.infrastructureMeaning.length).toBeGreaterThan(0);
        expect(tech.evidence.length).toBeGreaterThanOrEqual(1);
        expect(tech.signals.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('2. Plug-and-Play Extensibility (Zero Core-Engine Modification)', () => {
    it('allows registering a new technology detector at runtime and immediately observing its detections', async () => {
      // Define brand-new technology detector
      class CustomPaaSDetector extends BaseTechnologyDetector {
        readonly id = 'tech-custom-paas';
        readonly name = 'Custom Enterprise PaaS';
        readonly category = TechnologyCategory.CLOUD_INFRASTRUCTURE;
        readonly description = 'Custom Enterprise PaaS platform';
        readonly role = 'Enterprise Cloud Platform';
        readonly infrastructureMeaning =
          'The public endpoint runs on Custom Enterprise PaaS infrastructure.';
        readonly detectionSignals = ['x-custom-paas-cluster header'];
        readonly confidenceRules =
          'HIGH confidence if x-custom-paas-cluster is present.';

        detect(
          context: TechnologyDetectionContext,
        ): TechnologyDetectionResult | null {
          const header = context.getHeader('x-custom-paas-cluster');
          if (!header) return null;

          return this.createResult({
            confidence: 0.99,
            confidenceLevel: 'HIGH',
            evidence: [
              {
                sourceType: 'HTTP',
                source: 'Response Header: x-custom-paas-cluster',
                indicator: `Cluster ID: ${header}`,
                observedValue: header,
                confidence: 'HIGH',
              },
            ],
            signals: [
              {
                name: 'PaaS Cluster Header',
                type: 'HEADER',
                indicator: 'x-custom-paas-cluster',
                matched: true,
                weight: 10,
              },
            ],
            role: `Enterprise Cloud Platform running ${context.domainName}`,
          });
        }
      }

      const customDetector = new CustomPaaSDetector();

      // 1. Register detector dynamically
      registry.register(customDetector);
      expect(registry.has('tech-custom-paas')).toBe(true);

      // 2. Execute discovery against telemetry containing the new signature
      const snapshotWithCustomTech: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://enterprise.corp',
          finalUrl: 'https://enterprise.corp',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 50,
          headers: {
            'x-custom-paas-cluster': 'us-east-1-prod-09',
            server: 'nginx/1.24.0',
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

      const result = await techDiscovery.discover(
        'enterprise.corp',
        snapshotWithCustomTech,
      );

      const customTech = result.technologies.find(
        (t) => t.id === 'tech-custom-paas',
      );
      expect(customTech).toBeDefined();
      expect(customTech?.name).toBe('Custom Enterprise PaaS');
      expect(customTech?.confidence).toBe(0.99);
      expect(customTech?.role).toBe(
        'Enterprise Cloud Platform running enterprise.corp',
      );
      expect(customTech?.evidence[0].observedValue).toBe('us-east-1-prod-09');

      // 3. Clean up / Unregister
      registry.unregister('tech-custom-paas');
      expect(registry.has('tech-custom-paas')).toBe(false);
    });
  });

  describe('3. Downstream Compatibility & Invariants', () => {
    it('seamlessly integrates with InfrastructureOverviewMapper and produces valid overview DTO', () => {
      const snapshotRecord: any = {
        id: 'snp-100',
        domainId: 'dom-100',
        httpStatus: 200,
        responseTimeMs: 85,
        payload: {
          technology: {
            technologies: [
              {
                id: 'tech-cloudflare',
                name: 'Cloudflare',
                category: 'CDN / Edge',
                confidence: 0.99,
                confidenceLevel: 'HIGH',
                role: 'Edge / CDN',
                infrastructureMeaning: 'Protected by Cloudflare',
                evidence: [],
                signals: [],
                evidenceCount: 1,
              },
              {
                id: 'tech-nextjs',
                name: 'Next.js',
                category: 'Frameworks',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                role: 'Frontend Framework',
                infrastructureMeaning: 'Rendered with Next.js',
                evidence: [],
                signals: [],
                evidenceCount: 1,
              },
            ],
          },
        },
      };

      const dto = InfrastructureOverviewMapper.fromSnapshot(snapshotRecord);
      expect(dto.technologies).toEqual(['Cloudflare', 'Next.js']);
    });
  });
});
