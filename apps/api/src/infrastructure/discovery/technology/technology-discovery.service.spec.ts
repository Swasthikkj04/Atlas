import { TechnologyDiscoveryService } from './technology-discovery.service';
import { TechnologyFingerprintingEngine } from './engine/technology-fingerprinting.engine';
import { DeepBehavioralFingerprintingEngine } from './engine/deep-behavioral-fingerprinting.engine';
import { TechnologyMeaningEngine } from './engine/technology-meaning.engine';
import { InfrastructureRelationshipEngine } from './engine/infrastructure-relationship.engine';
import { InfrastructureArchitectureSynthesisEngine } from './engine/infrastructure-architecture-synthesis.engine';
import { TechnologyDetectorRegistryService } from './registry/technology-detector-registry.service';
import { TechnologyRelationshipRegistryService } from './registry/technology-relationship-registry.service';
import { CloudflareDetector } from './detectors/cloud/cloudflare.detector';
import { NginxDetector } from './detectors/web-servers/nginx.detector';
import { NextJsDetector } from './detectors/frameworks/nextjs.detector';
import { DiscoverySnapshot } from '../contracts/discovery-snapshot.interface';

describe('TechnologyDiscoveryService', () => {
  let service: TechnologyDiscoveryService;
  let registry: TechnologyDetectorRegistryService;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let meaningEngine: TechnologyMeaningEngine;
  let relRegistry: TechnologyRelationshipRegistryService;
  let relEngine: InfrastructureRelationshipEngine;
  let synthesisEngine: InfrastructureArchitectureSynthesisEngine;
  let engine: TechnologyFingerprintingEngine;

  beforeEach(() => {
    registry = new TechnologyDetectorRegistryService();
    registry.register(new CloudflareDetector());
    registry.register(new NginxDetector());
    registry.register(new NextJsDetector());

    behavioralEngine = new DeepBehavioralFingerprintingEngine();
    meaningEngine = new TechnologyMeaningEngine(registry);
    relRegistry = new TechnologyRelationshipRegistryService();
    relEngine = new InfrastructureRelationshipEngine(relRegistry);
    synthesisEngine = new InfrastructureArchitectureSynthesisEngine();
    engine = new TechnologyFingerprintingEngine(
      registry,
      behavioralEngine,
      meaningEngine,
      relEngine,
      synthesisEngine,
    );
    service = new TechnologyDiscoveryService(engine);
  });

  it('correctly discovers technologies by consuming existing snapshot observations without extra network requests', async () => {
    const existingSnapshot: Partial<DiscoverySnapshot> = {
      http: {
        reachable: true,
        url: 'https://mysite.com',
        finalUrl: 'https://mysite.com',
        protocol: 'https',
        statusCode: 200,
        responseTimeMs: 80,
        headers: {
          server: 'cloudflare',
          'cf-ray': '89a123bc-iad',
          'x-powered-by': 'Next.js',
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

    const result = await service.discover('mysite.com', existingSnapshot);

    expect(result.technologies).toHaveLength(2);
    const techNames = result.technologies.map((t) => t.name);
    expect(techNames).toContain('Cloudflare');
    expect(techNames).toContain('Next.js');

    const cf = result.technologies.find((t) => t.name === 'Cloudflare');
    expect(cf.confidence).toBeGreaterThanOrEqual(0.9);
    expect(cf.role).toContain('Global edge network');
    expect(cf.infrastructureMeaning).toContain('Cloudflare');
    expect(cf.whyDetected).toBeDefined();
    expect(cf.whyDetected.length).toBeGreaterThan(0);
    expect(cf.whatThisDoesNotProve).toBeDefined();
    expect(cf.evidence.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty technologies array when snapshot exhibits no matching signatures', async () => {
    const existingSnapshot: Partial<DiscoverySnapshot> = {
      http: {
        reachable: true,
        url: 'https://unknown.com',
        finalUrl: 'https://unknown.com',
        protocol: 'https',
        statusCode: 200,
        responseTimeMs: 120,
        headers: {
          server: 'custom-internal-server',
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

    const result = await service.discover('unknown.com', existingSnapshot);
    expect(result.technologies).toHaveLength(0);
    expect(result.totalDetected).toBe(0);
  });
});
