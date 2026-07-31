import { HttpDiscoveryService } from '../discovery/http/http-discovery.service';
import { HttpNormalizerService } from '../normalization/normalizers/http-normalizer.service';
import { HttpDiscoveryPlugin } from './plugins/http-discovery.plugin';
import { HttpIntelligencePlugin } from './plugins/http-intelligence.plugin';
import { HttpKnowledgePlugin } from './plugins/http-knowledge.plugin';
import { DiscoveryRegistry } from './registries/discovery.registry';
import { IntelligenceRegistry } from './registries/intelligence.registry';
import { KnowledgeRegistry } from './registries/knowledge.registry';
import { PlatformRegistryManager } from './registries/platform-registry.manager';

describe('Platform Plugin Architecture & Registries', () => {
  let discoveryRegistry: DiscoveryRegistry;
  let knowledgeRegistry: KnowledgeRegistry;
  let intelligenceRegistry: IntelligenceRegistry;
  let manager: PlatformRegistryManager;

  let httpDiscoveryService: jest.Mocked<HttpDiscoveryService>;
  let httpNormalizerService: HttpNormalizerService;

  beforeEach(() => {
    discoveryRegistry = new DiscoveryRegistry();
    knowledgeRegistry = new KnowledgeRegistry();
    intelligenceRegistry = new IntelligenceRegistry();
    manager = new PlatformRegistryManager(
      discoveryRegistry,
      knowledgeRegistry,
      intelligenceRegistry,
    );

    httpDiscoveryService = {
      collectEvidence: jest.fn().mockResolvedValue({
        metadata: { collectorName: 'http', status: 'SUCCESS' },
        observations: {},
      }),
    } as any;

    httpNormalizerService = new HttpNormalizerService();
  });

  it('should register and execute Discovery Plugin via DiscoveryRegistry', async () => {
    const plugin = new HttpDiscoveryPlugin(httpDiscoveryService);
    discoveryRegistry.register(plugin);
    await discoveryRegistry.initializePlugin('http');

    expect(plugin.state).toBe('INITIALIZED');

    const registered = discoveryRegistry.getPlugin('http');
    expect(registered?.manifest.name).toBe('HTTP Discovery Plugin');

    const result = await registered?.collectEvidence('example.com');
    expect(result?.metadata.collectorName).toBe('http');
    expect(httpDiscoveryService.collectEvidence).toHaveBeenCalledWith(
      'example.com',
    );
  });

  it('should register and execute Knowledge Plugin via KnowledgeRegistry', async () => {
    const plugin = new HttpKnowledgePlugin(httpNormalizerService);
    knowledgeRegistry.register(plugin);
    await knowledgeRegistry.initializePlugin('http-knowledge');

    const registered = knowledgeRegistry.getPlugin('http-knowledge');
    const result = registered?.normalize('domain-1', 'ev-1', {
      headers: { 'strict-transport-security': 'max-age=31536000' },
    });

    expect(result?.observations.strictTransportSecurity.observation.state).toBe(
      'OBSERVED',
    );
  });

  it('should register and execute Intelligence Plugin via IntelligenceRegistry', async () => {
    const plugin = new HttpIntelligencePlugin();
    intelligenceRegistry.register(plugin);
    await intelligenceRegistry.initializePlugin('http-intelligence');

    const registered = intelligenceRegistry.getPlugin('http-intelligence');
    const results = registered?.evaluate({
      strictTransportSecurity: {
        lineage: { evidenceId: 'ev-1' },
        observation: { state: 'MISSING' },
      },
    });

    expect(results).toHaveLength(1);
    expect(results?.[0].ruleId).toBe('http.missing-hsts');
  });

  it('should expose all registered manifests via PlatformRegistryManager', async () => {
    const p1 = new HttpDiscoveryPlugin(httpDiscoveryService);
    const p2 = new HttpKnowledgePlugin(httpNormalizerService);
    const p3 = new HttpIntelligencePlugin();

    discoveryRegistry.register(p1);
    knowledgeRegistry.register(p2);
    intelligenceRegistry.register(p3);

    const manifests = manager.getAllManifests();
    expect(manifests.discovery).toHaveLength(1);
    expect(manifests.knowledge).toHaveLength(1);
    expect(manifests.intelligence).toHaveLength(1);
    expect(manifests.discovery[0].id).toBe('http');
  });
});
