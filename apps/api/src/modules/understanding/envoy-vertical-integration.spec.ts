import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { EnvoyDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/envoy.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';
import { createTechnologyDetectionContext } from '../../infrastructure/discovery/technology/context/technology-detection-context.impl';

describe('T25: Envoy Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let envoyDetector: EnvoyDetector;
  let behavioralEngine: DeepBehavioralFingerprintingEngine;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    envoyDetector = moduleRef.get(EnvoyDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Evidence-Grounded Envoy Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Authoritative Envoy Detection & Version Extraction (TECH-001)', () => {
    it('detects Envoy and extracts exact version from Server: envoy/1.28.0', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.envoy-ingress.io',
          finalUrl: 'https://api.envoy-ingress.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            server: 'envoy/1.28.0',
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
        'api.envoy-ingress.io',
        snapshot,
      );

      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      expect(envoy).toBeDefined();
      expect(envoy?.name).toBe('Envoy');
      expect(envoy?.category).toBe('Web / Server');
      expect(envoy?.confidenceLevel).toBe('HIGH');
      expect(envoy?.version).toBe('1.28.0');
      expect(envoy?.versionEvidence).toContain('1.28.0');
    });

    it('detects Envoy from Server: envoy banner without version hallucination (no Version: Unknown)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://envoy-plain.service.io',
          finalUrl: 'https://envoy-plain.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            server: 'envoy',
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
        'envoy-plain.service.io',
        snapshot,
      );

      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      expect(envoy).toBeDefined();
      expect(envoy?.name).toBe('Envoy');
      expect(envoy?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects Envoy from x-envoy-upstream-service-time telemetry header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://envoy-telemetry.corp.io',
          finalUrl: 'https://envoy-telemetry.corp.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            'x-envoy-upstream-service-time': '8',
            'x-envoy-decorator-operation': 'api-v1-users',
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
        'envoy-telemetry.corp.io',
        snapshot,
      );

      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      expect(envoy).toBeDefined();
      expect(envoy?.name).toBe('Envoy');
      expect(
        envoy?.evidence.some((e) =>
          e.source.includes('x-envoy-upstream-service-time'),
        ),
      ).toBe(true);
    });

    it('returns null / absent when generic web server or unrelated headers exist', async () => {
      const genericSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://static-html.org',
          finalUrl: 'https://static-html.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Caddy' },
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
        'static-html.org',
        genericSnapshot,
      );
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');
      expect(envoy).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Semantic Meaning & Anti-Overreach Claim Boundaries (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Envoy infrastructure meaning and conservative claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://envoy-mesh-node.io',
          finalUrl: 'https://envoy-mesh-node.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 14,
          headers: {
            server: 'envoy',
            'x-envoy-upstream-service-time': '15',
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
        'envoy-mesh-node.io',
        snapshot,
      );
      const envoy = result.technologies.find((t) => t.id === 'tech-envoy');

      expect(envoy).toBeDefined();
      expect(envoy.role).toBe('Reverse Proxy / Service Proxy');
      expect(envoy.infrastructureMeaning).toContain(
        'The observed endpoint appears to expose Envoy as a gateway or proxy boundary.',
      );
      expect(envoy.whatThisDoesNotProve).toContain('Kubernetes');
      expect(envoy.whatThisDoesNotProve).toContain('Istio');
      expect(envoy.whatThisDoesNotProve).toContain('Docker');
      expect(envoy.whatThisDoesNotProve).toContain('Linux');
      expect(envoy.whatThisDoesNotProve).toContain('service mesh');
      expect(envoy.whatThisDoesNotProve).toContain('sidecar deployment');
      expect(envoy.whatThisDoesNotProve).toContain('ingress gateway');
      expect(envoy.whatThisDoesNotProve).toContain('API gateway');
      expect(envoy.whatThisDoesNotProve).toContain('microservices');
      expect(envoy.whatThisDoesNotProve).toContain('cloud load balancer');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Topology & Multi-Technology Coexistence (TECH-003)
  // ---------------------------------------------------------------------------
  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Envoy at GATEWAY layer and coexists independently with Cloudflare (EDGE), NGINX (GATEWAY), and Node.js (RUNTIME)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://multi-tier-app.io',
          finalUrl: 'https://multi-tier-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'cf-ray': '89b234567-iad',
            server: 'cloudflare',
            'x-envoy-upstream-service-time': '12',
            'x-powered-by': 'Express',
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
        'multi-tier-app.io',
        snapshot,
      );
      const topo = result.topology;

      // Cloudflare at EDGE
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudflare',
      );
      expect(cfNode).toBeDefined();
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // Envoy at GATEWAY
      const envoyNode = topo.nodes.find((n) => n.technologyId === 'tech-envoy');
      expect(envoyNode).toBeDefined();
      expect(envoyNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Node.js at RUNTIME
      const nodeNode = topo.nodes.find((n) => n.technologyId === 'tech-nodejs');
      expect(nodeNode).toBeDefined();
      expect(nodeNode?.layer).toBe(TopologyLayer.RUNTIME);
    });

    it('does NOT collapse into "Envoy Stack" or "Kubernetes/Envoy architecture"', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://pure-envoy.io',
          finalUrl: 'https://pure-envoy.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 12,
          headers: {
            server: 'envoy/1.28.0',
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

      const result = await techDiscovery.discover('pure-envoy.io', snapshot);
      const techNames = result.technologies.map((t) => t.name);

      expect(techNames).toContain('Envoy');
      expect(techNames).not.toContain('Kubernetes');
      expect(techNames).not.toContain('Istio');
      expect(techNames).not.toContain('Docker');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. T22 Behavioral Corroboration (TECH-001 / TECH-004)
  // ---------------------------------------------------------------------------
  describe('4. T22 Behavioral Corroboration & Fusion Posture', () => {
    it('corroborates direct Envoy detection when wire telemetry headers are present (CORROBORATED posture)', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy-fused.io',
        http: {
          statusCode: 200,
          headers: {
            server: 'envoy',
            'x-envoy-upstream-service-time': '20',
          },
        } as any,
      });

      const directResult = envoyDetector.detect(context);
      expect(directResult).not.toBeNull();

      const { results, behavioralResult } = behavioralEngine.analyze(context, [
        directResult,
      ]);
      expect(behavioralResult.posturesByTechnology['tech-envoy']).toBe(
        'CORROBORATED',
      );
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('treats behavioral-only error pattern as CONSISTENT rather than deterministic identification', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'envoy-behavior-only.io',
        htmlBody:
          'upstream connect error or disconnect/reset before headers. reset reason: connection failure',
        http: {
          statusCode: 503,
          headers: {
            server: 'generic-proxy',
          },
        } as any,
      });

      const { results, behavioralResult } = behavioralEngine.analyze(
        context,
        [],
      );
      const envoyBehavior = results.find((r) => r.id === 'tech-envoy');

      expect(envoyBehavior).toBeDefined();
      expect(behavioralResult.posturesByTechnology['tech-envoy']).toBe(
        'CONSISTENT',
      );
      expect(envoyBehavior?.confidenceLevel).toBe('MEDIUM');
      expect(envoyBehavior?.whatThisDoesNotProve).toContain(
        'absence of direct explicit banners',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Architecture Brief & Known Unknowns (TECH-004)
  // ---------------------------------------------------------------------------
  describe('5. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Envoy in request path with explicit claim boundaries and unobserved backend', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://envoy-brief.org',
          finalUrl: 'https://envoy-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'envoy/1.28.0',
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

      const result = await techDiscovery.discover('envoy-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(
        brief.architecturePath.some((p) => p.technologyName === 'Envoy'),
      ).toBe(true);
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-envoy'),
      ).toBe(true);
      expect(
        brief.knownUnknowns.some((u) =>
          u.dimension.toLowerCase().includes('database'),
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Snapshot Memory & Determinism (TECH-005)
  // ---------------------------------------------------------------------------
  describe('6. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Envoy in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '1.28.0',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint is fronted by an Envoy service proxy.',
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'public-endpoint',
                technologyName: 'Public Endpoint',
                role: 'Ingress',
              },
              {
                hop: 1,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-envoy',
                technologyName: 'Envoy',
                role: 'Reverse Proxy / Service Proxy',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Envoy' }],
              },
            ],
            keyTechnologies: [
              { name: 'Envoy', role: 'Reverse Proxy / Service Proxy' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Envoy',
                boundary:
                  'Envoy presence does not prove Kubernetes, Istio, Docker, or Linux',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-envoy-1',
        'dom-envoy-1',
        'envoy-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-envoy-1',
        'dom-envoy-1',
        'envoy-test.com',
        snapshot,
      );

      expect(memory1.fingerprints.technologyFingerprint).toBe(
        memory2.fingerprints.technologyFingerprint,
      );
      expect(memory1.fingerprints.overallFingerprint).toBe(
        memory2.fingerprints.overallFingerprint,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Change Intelligence (TECH-006)
  // ---------------------------------------------------------------------------
  describe('7. Change Intelligence (TECH-006)', () => {
    it('detects Envoy addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currEnvoy126: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '1.26.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-envoy',
                technologyName: 'Envoy',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Envoy' }],
              },
            ],
          } as any,
        },
      };

      const currEnvoy128: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-envoy',
              name: 'Envoy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '1.28.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-envoy',
                technologyName: 'Envoy',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Envoy' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currEnvoy126,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Envoy',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currEnvoy126,
        currEnvoy128,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '1.26.0' &&
            d.currentState?.version === '1.28.0',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currEnvoy128,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Envoy',
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Domain Overview API Convergence (TECH-008)
  // ---------------------------------------------------------------------------
  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Envoy into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-envoy-overview',
        domainId: 'dom-envoy-overview',
        jobId: 'job-025',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is fronted by an Envoy service proxy.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                  role: 'Ingress',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-envoy',
                  technologyName: 'Envoy',
                  role: 'Reverse Proxy / Service Proxy',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.GATEWAY,
                  technologies: [
                    {
                      technologyId: 'tech-envoy',
                      name: 'Envoy',
                      role: 'Reverse Proxy / Service Proxy',
                      layer: TopologyLayer.GATEWAY,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-envoy',
                  name: 'Envoy',
                  role: 'Reverse Proxy / Service Proxy',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-envoy',
                  technologyName: 'Envoy',
                  boundary:
                    'Envoy presence does not prove Kubernetes, Istio, Docker, or Linux',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Envoy',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Envoy');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('9. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Kubernetes, Istio, Docker, Linux, service mesh, or cloud load balancers from Envoy evidence', () => {
      expect(envoyDetector.id).toBe('tech-envoy');
      expect(envoyDetector.whatThisDoesNotProve).toContain('Kubernetes');
      expect(envoyDetector.whatThisDoesNotProve).toContain('Istio');
      expect(envoyDetector.whatThisDoesNotProve).toContain('Docker');
      expect(envoyDetector.whatThisDoesNotProve).toContain('Linux');
      expect(envoyDetector.whatThisDoesNotProve).toContain('service mesh');
      expect(envoyDetector.whatThisDoesNotProve).toContain(
        'sidecar deployment',
      );
      expect(envoyDetector.whatThisDoesNotProve).toContain('ingress gateway');
      expect(envoyDetector.whatThisDoesNotProve).toContain('API gateway');
      expect(envoyDetector.whatThisDoesNotProve).toContain('microservices');
      expect(envoyDetector.whatThisDoesNotProve).toContain(
        'cloud load balancer',
      );
    });
  });
});
