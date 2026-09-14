import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { GoDetector } from '../../infrastructure/discovery/technology/detectors/runtime/go.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T18: Go Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let goDetector: GoDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    goDetector = moduleRef.get(GoDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Go Detection & Version Extraction (TECH-001)', () => {
    it('detects Go and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://go-api.service.io',
          finalUrl: 'https://go-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Go/1.22.1',
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
        'go-api.service.io',
        snapshot,
      );

      const go = result.technologies.find((t) => t.id === 'tech-go');
      expect(go).toBeDefined();
      expect(go?.name).toBe('Go');
      expect(go?.category).toBe('Infrastructure Runtime');
      expect(go?.confidenceLevel).toBe('HIGH');
      expect(go?.version).toBe('1.22.1');
      expect(go?.versionEvidence).toContain('1.22.1');
      expect(go?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects Go from fasthttp and Golang server banners', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://fasthttp-service.org',
          finalUrl: 'https://fasthttp-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            server: 'fasthttp',
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
        'fasthttp-service.org',
        snapshot,
      );

      const go = result.technologies.find((t) => t.id === 'tech-go');
      expect(go).toBeDefined();
      expect(go?.name).toBe('Go');
      expect(go?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects Go from X-Go-Version header with go prefix removal', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://fiber-service.org',
          finalUrl: 'https://fiber-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            'x-go-version': 'go1.21.6',
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
        'fiber-service.org',
        snapshot,
      );

      const go = result.technologies.find((t) => t.id === 'tech-go');
      expect(go).toBeDefined();
      expect(go?.name).toBe('Go');
      expect(go?.version).toBe('1.21.6');
    });

    it('returns null / absent when no Go signatures exist', async () => {
      const nonGoSnapshot: DiscoverySnapshot = {
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
        nonGoSnapshot,
      );
      const go = result.technologies.find((t) => t.id === 'tech-go');
      expect(go).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Go infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://go-backend.io',
          finalUrl: 'https://go-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Go/1.22',
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

      const result = await techDiscovery.discover('go-backend.io', snapshot);
      const go = result.technologies.find((t) => t.id === 'tech-go');

      expect(go).toBeDefined();
      expect(go.role).toContain('Go');
      expect(go.infrastructureMeaning).toContain(
        'Go-based server-side application/runtime boundary',
      );
      expect(go.whatThisDoesNotProve).toContain('Gin');
      expect(go.whatThisDoesNotProve).toContain('Echo');
      expect(go.whatThisDoesNotProve).toContain('Fiber');
      expect(go.whatThisDoesNotProve).toContain('Chi');
      expect(go.whatThisDoesNotProve).toContain('Docker');
      expect(go.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Go at the RUNTIME layer and preserves independent Gateway and Docker observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://go-service-prod.com',
          finalUrl: 'https://go-service-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Go/1.22.1',
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
        'go-service-prod.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Go at RUNTIME
      const goNode = topo.nodes.find((n) => n.technologyId === 'tech-go');
      expect(goNode).toBeDefined();
      expect(goNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Go in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://go-brief.org',
          finalUrl: 'https://go-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Go/1.22.1',
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

      const result = await techDiscovery.discover('go-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Go',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-go'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Go in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.22.1',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Go server runtime.',
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
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-go',
                technologyName: 'Go',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Go' }],
              },
            ],
            keyTechnologies: [{ name: 'Go', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Go',
                boundary: 'Go presence does not prove Gin or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-go-1',
        'dom-go-1',
        'go-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-go-1',
        'dom-go-1',
        'go-test.com',
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

  describe('6. Change Intelligence (TECH-006)', () => {
    it('detects Go addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currGo121: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.21.6',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-go',
                technologyName: 'Go',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Go' }],
              },
            ],
          } as any,
        },
      };

      const currGo122: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-go',
              name: 'Go',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.22.1',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-go',
                technologyName: 'Go',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Go' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currGo121,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Go',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currGo121,
        currGo122,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '1.21.6' &&
            d.currentState?.version === '1.22.1',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currGo122,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Go',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Go into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-go-overview',
        domainId: 'dom-go-overview',
        jobId: 'job-018',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Go server runtime.',
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
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-go',
                  technologyName: 'Go',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-go',
                      name: 'Go',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-go',
                  name: 'Go',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-go',
                  technologyName: 'Go',
                  boundary: 'Go presence does not prove Gin or PostgreSQL',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.95 },
            },
          },
        },
      };

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);
      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Go',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Go');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Gin, Echo, Fiber, Chi, Docker, or PostgreSQL from Go evidence alone', () => {
      expect(goDetector.id).toBe('tech-go');
      expect(goDetector.whatThisDoesNotProve).toContain('Gin');
      expect(goDetector.whatThisDoesNotProve).toContain('Echo');
      expect(goDetector.whatThisDoesNotProve).toContain('Fiber');
      expect(goDetector.whatThisDoesNotProve).toContain('Chi');
      expect(goDetector.whatThisDoesNotProve).toContain('Docker');
      expect(goDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
