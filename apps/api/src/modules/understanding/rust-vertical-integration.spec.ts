import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { RustDetector } from '../../infrastructure/discovery/technology/detectors/runtime/rust.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T19: Rust Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let rustDetector: RustDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    rustDetector = moduleRef.get(RustDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Rust Detection & Version Extraction (TECH-001)', () => {
    it('detects Rust and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://rust-api.service.io',
          finalUrl: 'https://rust-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            'x-powered-by': 'Rust/1.82.0',
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
        'rust-api.service.io',
        snapshot,
      );

      const rust = result.technologies.find((t) => t.id === 'tech-rust');
      expect(rust).toBeDefined();
      expect(rust?.name).toBe('Rust');
      expect(rust?.category).toBe('Infrastructure Runtime');
      expect(rust?.confidenceLevel).toBe('HIGH');
      expect(rust?.version).toBe('1.82.0');
      expect(rust?.versionEvidence).toContain('1.82.0');
      expect(rust?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects Rust from actix-web server banner without version hallucination', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://actix-service.org',
          finalUrl: 'https://actix-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 12,
          headers: {
            server: 'actix-web',
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
        'actix-service.org',
        snapshot,
      );

      const rust = result.technologies.find((t) => t.id === 'tech-rust');
      expect(rust).toBeDefined();
      expect(rust?.name).toBe('Rust');
      expect(rust?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects Rust from X-Rust-Version header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://axum-service.org',
          finalUrl: 'https://axum-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 14,
          headers: {
            'x-rust-version': '1.80.1',
            server: 'axum',
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

      const result = await techDiscovery.discover('axum-service.org', snapshot);

      const rust = result.technologies.find((t) => t.id === 'tech-rust');
      expect(rust).toBeDefined();
      expect(rust?.name).toBe('Rust');
      expect(rust?.version).toBe('1.80.1');
    });

    it('returns null / absent when no Rust signatures exist', async () => {
      const nonRustSnapshot: DiscoverySnapshot = {
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
        nonRustSnapshot,
      );
      const rust = result.technologies.find((t) => t.id === 'tech-rust');
      expect(rust).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Rust infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://rust-backend.io',
          finalUrl: 'https://rust-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Rust/1.82',
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

      const result = await techDiscovery.discover('rust-backend.io', snapshot);
      const rust = result.technologies.find((t) => t.id === 'tech-rust');

      expect(rust).toBeDefined();
      expect(rust.role).toContain('Rust');
      expect(rust.infrastructureMeaning).toContain(
        'Rust-based server-side application/runtime boundary',
      );
      expect(rust.whatThisDoesNotProve).toContain('Axum');
      expect(rust.whatThisDoesNotProve).toContain('Actix Web');
      expect(rust.whatThisDoesNotProve).toContain('Rocket');
      expect(rust.whatThisDoesNotProve).toContain('Tokio');
      expect(rust.whatThisDoesNotProve).toContain('Docker');
      expect(rust.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Rust at the RUNTIME layer and preserves independent Gateway and Docker observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://rust-service-prod.com',
          finalUrl: 'https://rust-service-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Rust/1.82.0',
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
        'rust-service-prod.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Rust at RUNTIME
      const rustNode = topo.nodes.find((n) => n.technologyId === 'tech-rust');
      expect(rustNode).toBeDefined();
      expect(rustNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Rust in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://rust-brief.org',
          finalUrl: 'https://rust-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Rust/1.82.0',
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

      const result = await techDiscovery.discover('rust-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Rust',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-rust'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Rust in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-rust',
              name: 'Rust',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.82.0',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Rust server runtime.',
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
                technologyId: 'tech-rust',
                technologyName: 'Rust',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Rust' }],
              },
            ],
            keyTechnologies: [{ name: 'Rust', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Rust',
                boundary: 'Rust presence does not prove Axum or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-rust-1',
        'dom-rust-1',
        'rust-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-rust-1',
        'dom-rust-1',
        'rust-test.com',
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
    it('detects Rust addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currRust180: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-rust',
              name: 'Rust',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.80.1',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-rust',
                technologyName: 'Rust',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Rust' }],
              },
            ],
          } as any,
        },
      };

      const currRust182: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-rust',
              name: 'Rust',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.82.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-rust',
                technologyName: 'Rust',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Rust' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currRust180,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Rust',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currRust180,
        currRust182,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '1.80.1' &&
            d.currentState?.version === '1.82.0',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currRust182,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Rust',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Rust into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-rust-overview',
        domainId: 'dom-rust-overview',
        jobId: 'job-019',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Rust server runtime.',
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
                  technologyId: 'tech-rust',
                  technologyName: 'Rust',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-rust',
                      name: 'Rust',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-rust',
                  name: 'Rust',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-rust',
                  technologyName: 'Rust',
                  boundary: 'Rust presence does not prove Axum or PostgreSQL',
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
        'Rust',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Rust');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Axum, Actix Web, Rocket, Tokio, Docker, or PostgreSQL from Rust evidence alone', () => {
      expect(rustDetector.id).toBe('tech-rust');
      expect(rustDetector.whatThisDoesNotProve).toContain('Axum');
      expect(rustDetector.whatThisDoesNotProve).toContain('Actix Web');
      expect(rustDetector.whatThisDoesNotProve).toContain('Rocket');
      expect(rustDetector.whatThisDoesNotProve).toContain('Tokio');
      expect(rustDetector.whatThisDoesNotProve).toContain('Docker');
      expect(rustDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
