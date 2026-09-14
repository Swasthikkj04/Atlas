import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { HAProxyDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/haproxy.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { DeepBehavioralFingerprintingEngine } from '../../infrastructure/discovery/technology/engine/deep-behavioral-fingerprinting.engine';
import { createTechnologyDetectionContext } from '../../infrastructure/discovery/technology/context/technology-detection-context.impl';

describe('T25: HAProxy Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let haproxyDetector: HAProxyDetector;
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
    haproxyDetector = moduleRef.get(HAProxyDetector);
    behavioralEngine = moduleRef.get(DeepBehavioralFingerprintingEngine);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Evidence-Grounded HAProxy Detection (TECH-001)
  // ---------------------------------------------------------------------------
  describe('1. Authoritative HAProxy Detection & Version Extraction (TECH-001)', () => {
    it('detects HAProxy and extracts exact version from Server: HAProxy/2.8.5', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://lb.infra-edge.net',
          finalUrl: 'https://lb.infra-edge.net',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            server: 'HAProxy/2.8.5',
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
        'lb.infra-edge.net',
        snapshot,
      );

      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeDefined();
      expect(haproxy?.name).toBe('HAProxy');
      expect(haproxy?.category).toBe('Web / Server');
      expect(haproxy?.confidenceLevel).toBe('HIGH');
      expect(haproxy?.version).toBe('2.8.5');
      expect(haproxy?.versionEvidence).toContain('2.8.5');
    });

    it('detects HAProxy from Server: HAProxy banner without version hallucination (no Version: Unknown)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://gateway.unversioned.io',
          finalUrl: 'https://gateway.unversioned.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            server: 'HAProxy',
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
        'gateway.unversioned.io',
        snapshot,
      );

      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeDefined();
      expect(haproxy?.name).toBe('HAProxy');
      expect(haproxy?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects HAProxy from x-haproxy-id and x-haproxy-server response headers', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.haproxy-routed.io',
          finalUrl: 'https://api.haproxy-routed.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            'x-haproxy-id': 'req-98f23a8b',
            'x-haproxy-server': 'node-backend-01',
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
        'api.haproxy-routed.io',
        snapshot,
      );

      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeDefined();
      expect(haproxy?.name).toBe('HAProxy');
      expect(
        haproxy?.evidence.some((e) => e.source.includes('x-haproxy-id')),
      ).toBe(true);
    });

    it('detects HAProxy from session persistence cookie (SERVERID=srv1)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://sticky.cluster.org',
          finalUrl: 'https://sticky.cluster.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'set-cookie': 'SERVERID=srv-node-02; Path=/',
          },
          cookies: {
            SERVERID: 'srv-node-02',
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
        'sticky.cluster.org',
        snapshot,
      );

      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeDefined();
      expect(haproxy?.name).toBe('HAProxy');
      expect(
        haproxy?.evidence.some((e) => e.source.includes('Set-Cookie')),
      ).toBe(true);
    });

    it('detects HAProxy from canonical 503 error template signature (No server is available to handle this request)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://maintenance.haproxy.io',
          finalUrl: 'https://maintenance.haproxy.io',
          protocol: 'https',
          statusCode: 503,
          responseTimeMs: 35,
          headers: {
            'content-type': 'text/html',
          },
          body: '<html><body><h1>503 Service Unavailable</h1>\nNo server is available to handle this request.\n</body></html>',
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
        'maintenance.haproxy.io',
        snapshot,
      );

      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeDefined();
      expect(haproxy?.name).toBe('HAProxy');
      expect(
        haproxy?.evidence.some((e) => e.source.includes('HAProxy Error Page')),
      ).toBe(true);
    });

    it('returns null / absent when generic web server or unrelated headers exist', async () => {
      const genericSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://generic-caddy.org',
          finalUrl: 'https://generic-caddy.org',
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
        'generic-caddy.org',
        genericSnapshot,
      );
      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');
      expect(haproxy).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Semantic Meaning & Anti-Overreach Claim Boundaries (TECH-002)
  // ---------------------------------------------------------------------------
  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative HAProxy infrastructure meaning and conservative claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://proxy.gateway-app.io',
          finalUrl: 'https://proxy.gateway-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 14,
          headers: {
            server: 'HAProxy/2.8.5',
            'x-haproxy-id': 'conn-0912',
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
        'proxy.gateway-app.io',
        snapshot,
      );
      const haproxy = result.technologies.find((t) => t.id === 'tech-haproxy');

      expect(haproxy).toBeDefined();
      expect(haproxy.role).toBe('Reverse Proxy / Load Balancer');
      expect(haproxy.infrastructureMeaning).toContain(
        'The observed endpoint appears to expose HAProxy as a gateway or load-balancing boundary.',
      );
      expect(haproxy.whatThisDoesNotProve).toContain('Kubernetes');
      expect(haproxy.whatThisDoesNotProve).toContain('Docker');
      expect(haproxy.whatThisDoesNotProve).toContain('Linux');
      expect(haproxy.whatThisDoesNotProve).toContain('cloud provider');
      expect(haproxy.whatThisDoesNotProve).toContain('service mesh');
      expect(haproxy.whatThisDoesNotProve).toContain('microservices');
      expect(haproxy.whatThisDoesNotProve).toContain('backend runtime');
      expect(haproxy.whatThisDoesNotProve).toContain('database');
      expect(haproxy.whatThisDoesNotProve).toContain(
        'internal load-balancing targets',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Topology & Multi-Technology Coexistence (TECH-003)
  // ---------------------------------------------------------------------------
  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions HAProxy at GATEWAY layer and coexists independently with Cloudflare (EDGE), NGINX (GATEWAY), and Go (RUNTIME)', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://enterprise-traffic.io',
          finalUrl: 'https://enterprise-traffic.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'cf-ray': '89b234567-iad',
            server: 'cloudflare',
            via: '1.1 haproxy, 1.1 nginx',
            'x-powered-by': 'Go',
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
        'enterprise-traffic.io',
        snapshot,
      );
      const topo = result.topology;

      // Cloudflare at EDGE
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudflare',
      );
      expect(cfNode).toBeDefined();
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // HAProxy at GATEWAY
      const haproxyNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-haproxy',
      );
      expect(haproxyNode).toBeDefined();
      expect(haproxyNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Go at RUNTIME
      const goNode = topo.nodes.find((n) => n.technologyId === 'tech-go');
      expect(goNode).toBeDefined();
      expect(goNode?.layer).toBe(TopologyLayer.RUNTIME);
    });

    it('does NOT infer or manufacture Kubernetes, Docker, or MySQL from HAProxy gateway presence alone', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://pure-haproxy.io',
          finalUrl: 'https://pure-haproxy.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 12,
          headers: {
            server: 'HAProxy/2.8.5',
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

      const result = await techDiscovery.discover('pure-haproxy.io', snapshot);
      const techNames = result.technologies.map((t) => t.name);

      expect(techNames).toContain('HAProxy');
      expect(techNames).not.toContain('Kubernetes');
      expect(techNames).not.toContain('Docker');
      expect(techNames).not.toContain('MySQL');
      expect(techNames).not.toContain('PostgreSQL');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. T22 Behavioral Corroboration & Fusion Posture
  // ---------------------------------------------------------------------------
  describe('4. T22 Behavioral Corroboration & Fusion Posture', () => {
    it('corroborates direct HAProxy detection when wire routing headers and error signatures are present (CORROBORATED posture)', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'haproxy-fused.io',
        http: {
          statusCode: 200,
          headers: {
            server: 'HAProxy',
            'x-haproxy-id': 'req-fused-881',
          },
        } as any,
      });

      const directResult = haproxyDetector.detect(context);
      expect(directResult).not.toBeNull();

      const { results, behavioralResult } = behavioralEngine.analyze(context, [
        directResult,
      ]);
      expect(behavioralResult.posturesByTechnology['tech-haproxy']).toBe(
        'CORROBORATED',
      );
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('treats behavioral-only error pattern as CONSISTENT rather than deterministic identification', () => {
      const context = createTechnologyDetectionContext({
        domainName: 'haproxy-behavior-only.io',
        htmlBody:
          '<html><body><h1>503 Service Unavailable</h1>\nNo server is available to handle this request.\n</body></html>',
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
      const haproxyBehavior = results.find((r) => r.id === 'tech-haproxy');

      expect(haproxyBehavior).toBeDefined();
      expect(behavioralResult.posturesByTechnology['tech-haproxy']).toBe(
        'CONSISTENT',
      );
      expect(haproxyBehavior?.confidenceLevel).toBe('MEDIUM');
      expect(haproxyBehavior?.whatThisDoesNotProve).toContain(
        'absence of direct explicit banners',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Architecture Brief & Known Unknowns (TECH-004)
  // ---------------------------------------------------------------------------
  describe('5. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes HAProxy in request path with explicit claim boundaries and unobserved backend', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://haproxy-brief.org',
          finalUrl: 'https://haproxy-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'HAProxy/2.8.5',
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
        'haproxy-brief.org',
        snapshot,
      );
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(
        brief.architecturePath.some((p) => p.technologyName === 'HAProxy'),
      ).toBe(true);
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-haproxy'),
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
    it('captures HAProxy in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-haproxy',
              name: 'HAProxy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '2.8.5',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint is fronted by an HAProxy load-balancing gateway.',
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
                technologyId: 'tech-haproxy',
                technologyName: 'HAProxy',
                role: 'Reverse Proxy / Load Balancer',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'HAProxy' }],
              },
            ],
            keyTechnologies: [
              { name: 'HAProxy', role: 'Reverse Proxy / Load Balancer' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'HAProxy',
                boundary:
                  'HAProxy presence does not prove Kubernetes, Docker, or Linux',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-haproxy-1',
        'dom-haproxy-1',
        'haproxy-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-haproxy-1',
        'dom-haproxy-1',
        'haproxy-test.com',
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
    it('detects gateway replacement from NGINX to HAProxy without fabricating application migration', () => {
      const prevNginx: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
              version: '1.24.0',
            } as any,
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Runtime',
              confidence: 0.9,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
              },
              {
                hop: 1,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'NGINX' }],
              },
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Node.js' }],
              },
            ],
          } as any,
        },
      };

      const currHAProxy: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-haproxy',
              name: 'HAProxy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '2.8.5',
            } as any,
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Runtime',
              confidence: 0.9,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-haproxy',
                technologyName: 'HAProxy',
              },
              {
                hop: 1,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'HAProxy' }],
              },
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Node.js' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevNginx, currHAProxy);

      const addedHAProxy = diffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_ADDED' &&
          d.technologyName === 'HAProxy',
      );
      const removedNginx = diffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_REMOVED' &&
          d.technologyName === 'NGINX',
      );

      expect(addedHAProxy).toBeDefined();
      expect(removedNginx).toBeDefined();

      // Node.js is stable, confirming application layer didn't change
      const nodeChange = diffs.find((d) => d.technologyName === 'Node.js');
      expect(nodeChange).toBeUndefined();
    });

    it('detects HAProxy version upgrade (2.6.0 -> 2.8.5)', () => {
      const prevHAProxy: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-haproxy',
              name: 'HAProxy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '2.6.0',
            } as any,
          ],
        },
      };

      const currHAProxy: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-haproxy',
              name: 'HAProxy',
              category: 'Web / Server',
              confidence: 0.98,
              version: '2.8.5',
            } as any,
          ],
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevHAProxy, currHAProxy);
      expect(
        diffs.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '2.6.0' &&
            d.currentState?.version === '2.8.5',
        ),
      ).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Domain Overview API Convergence (TECH-008)
  // ---------------------------------------------------------------------------
  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps HAProxy into canonical webServer and technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-haproxy-overview',
        domainId: 'dom-haproxy-overview',
        jobId: 'job-025',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          http: {
            headers: {
              server: 'HAProxy/2.8.5',
            },
          },
          technology: {
            technologies: [
              {
                id: 'tech-haproxy',
                name: 'HAProxy',
                category: 'Web / Server',
                version: '2.8.5',
              },
            ],
            architectureBrief: {
              summary:
                'The public endpoint is fronted by an HAProxy load-balancing gateway.',
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
                  technologyId: 'tech-haproxy',
                  technologyName: 'HAProxy',
                  role: 'Reverse Proxy / Load Balancer',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.GATEWAY,
                  technologies: [
                    {
                      technologyId: 'tech-haproxy',
                      name: 'HAProxy',
                      role: 'Reverse Proxy / Load Balancer',
                      layer: TopologyLayer.GATEWAY,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-haproxy',
                  name: 'HAProxy',
                  role: 'Reverse Proxy / Load Balancer',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-haproxy',
                  technologyName: 'HAProxy',
                  boundary:
                    'HAProxy presence does not prove Kubernetes, Docker, or Linux',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.webServer).toBe('HAProxy/2.8.5');
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'HAProxy',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('HAProxy');
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Negative Anti-Overreach Invariants
  // ---------------------------------------------------------------------------
  describe('9. Negative Anti-Overreach Invariants', () => {
    it('strictly disclaims Kubernetes, Docker, Linux, cloud provider, service mesh, microservices, backend runtimes, and databases', () => {
      expect(haproxyDetector.id).toBe('tech-haproxy');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('Kubernetes');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('Docker');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('Linux');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('cloud provider');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('service mesh');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('microservices');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('backend runtime');
      expect(haproxyDetector.whatThisDoesNotProve).toContain('database');
      expect(haproxyDetector.whatThisDoesNotProve).toContain(
        'internal load-balancing targets',
      );
    });
  });
});
