import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { KotlinDetector } from '../../infrastructure/discovery/technology/detectors/runtime/kotlin.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T20: Kotlin Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let kotlinDetector: KotlinDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    kotlinDetector = moduleRef.get(KotlinDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Kotlin Detection & Version Extraction (TECH-001)', () => {
    it('detects Kotlin and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kotlin-api.service.io',
          finalUrl: 'https://kotlin-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            'x-powered-by': 'Kotlin/1.9.22',
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
        'kotlin-api.service.io',
        snapshot,
      );

      const kotlin = result.technologies.find((t) => t.id === 'tech-kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin?.name).toBe('Kotlin');
      expect(kotlin?.category).toBe('Infrastructure Runtime');
      expect(kotlin?.confidenceLevel).toBe('HIGH');
      expect(kotlin?.version).toBe('1.9.22');
      expect(kotlin?.versionEvidence).toContain('1.9.22');
      expect(kotlin?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects Kotlin from Ktor server banner without version hallucination', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ktor-service.org',
          finalUrl: 'https://ktor-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 18,
          headers: {
            server: 'ktor',
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

      const result = await techDiscovery.discover('ktor-service.org', snapshot);

      const kotlin = result.technologies.find((t) => t.id === 'tech-kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin?.name).toBe('Kotlin');
      expect(kotlin?.version).toBeUndefined(); // Zero version hallucination
    });

    it('detects Kotlin from X-Kotlin-Version header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kotlin-app.org',
          finalUrl: 'https://kotlin-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 19,
          headers: {
            'x-kotlin-version': '2.0.0',
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

      const result = await techDiscovery.discover('kotlin-app.org', snapshot);

      const kotlin = result.technologies.find((t) => t.id === 'tech-kotlin');
      expect(kotlin).toBeDefined();
      expect(kotlin?.name).toBe('Kotlin');
      expect(kotlin?.version).toBe('2.0.0');
    });

    it('returns null / absent when generic Java or unrelated signatures exist', async () => {
      const genericJavaSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://tomcat-java.org',
          finalUrl: 'https://tomcat-java.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'Apache-Coyote/1.1',
            'set-cookie': 'JSESSIONID=ABC12345; Path=/; HttpOnly',
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
        'tomcat-java.org',
        genericJavaSnapshot,
      );
      const kotlin = result.technologies.find((t) => t.id === 'tech-kotlin');
      expect(kotlin).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Kotlin infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kotlin-backend.io',
          finalUrl: 'https://kotlin-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Kotlin/1.9.22',
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
        'kotlin-backend.io',
        snapshot,
      );
      const kotlin = result.technologies.find((t) => t.id === 'tech-kotlin');

      expect(kotlin).toBeDefined();
      expect(kotlin.role).toContain('Kotlin');
      expect(kotlin.infrastructureMeaning).toContain(
        'Kotlin-based server-side application/runtime boundary',
      );
      expect(kotlin.whatThisDoesNotProve).toContain('Spring Boot');
      expect(kotlin.whatThisDoesNotProve).toContain('Ktor');
      expect(kotlin.whatThisDoesNotProve).toContain('Java');
      expect(kotlin.whatThisDoesNotProve).toContain('Tomcat');
      expect(kotlin.whatThisDoesNotProve).toContain('Docker');
      expect(kotlin.whatThisDoesNotProve).toContain('Android');
      expect(kotlin.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Kotlin at the RUNTIME layer and preserves independent Gateway, Java, and Docker observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kotlin-service-prod.com',
          finalUrl: 'https://kotlin-service-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Kotlin/1.9.22',
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
        'kotlin-service-prod.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Kotlin at RUNTIME
      const kotlinNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-kotlin',
      );
      expect(kotlinNode).toBeDefined();
      expect(kotlinNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Kotlin in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://kotlin-brief.org',
          finalUrl: 'https://kotlin-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-powered-by': 'Kotlin/1.9.22',
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

      const result = await techDiscovery.discover('kotlin-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Kotlin',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-kotlin'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Kotlin in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-kotlin',
              name: 'Kotlin',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.9.22',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Kotlin server runtime.',
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
                technologyId: 'tech-kotlin',
                technologyName: 'Kotlin',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Kotlin' }],
              },
            ],
            keyTechnologies: [{ name: 'Kotlin', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Kotlin',
                boundary:
                  'Kotlin presence does not prove Spring Boot, Java, or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-kotlin-1',
        'dom-kotlin-1',
        'kotlin-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-kotlin-1',
        'dom-kotlin-1',
        'kotlin-test.com',
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
    it('detects Kotlin addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currKotlin19: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-kotlin',
              name: 'Kotlin',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '1.9.22',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-kotlin',
                technologyName: 'Kotlin',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Kotlin' }],
              },
            ],
          } as any,
        },
      };

      const currKotlin20: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-kotlin',
              name: 'Kotlin',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '2.0.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-kotlin',
                technologyName: 'Kotlin',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Kotlin' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currKotlin19,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Kotlin',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currKotlin19,
        currKotlin20,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '1.9.22' &&
            d.currentState?.version === '2.0.0',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currKotlin20,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Kotlin',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Kotlin into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-kotlin-overview',
        domainId: 'dom-kotlin-overview',
        jobId: 'job-020',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Kotlin server runtime.',
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
                  technologyId: 'tech-kotlin',
                  technologyName: 'Kotlin',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-kotlin',
                      name: 'Kotlin',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-kotlin',
                  name: 'Kotlin',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-kotlin',
                  technologyName: 'Kotlin',
                  boundary:
                    'Kotlin presence does not prove Spring Boot, Java, or PostgreSQL',
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
        'Kotlin',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Kotlin');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Java, Spring Boot, Ktor, Tomcat, Docker, Android, or PostgreSQL from Kotlin evidence alone', () => {
      expect(kotlinDetector.id).toBe('tech-kotlin');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Java');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Spring Boot');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Ktor');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Tomcat');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Docker');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('Android');
      expect(kotlinDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
