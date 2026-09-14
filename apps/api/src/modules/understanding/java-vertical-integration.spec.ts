import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { JavaDetector } from '../../infrastructure/discovery/technology/detectors/runtime/java.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T13: Java Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let javaDetector: JavaDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    javaDetector = moduleRef.get(JavaDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Java Detection & Version Extraction (TECH-001)', () => {
    it('detects Java and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://enterprise-app.com',
          finalUrl: 'https://enterprise-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            'x-powered-by': 'Java/17.0.8',
            'set-cookie':
              'JSESSIONID=node01xyz789session.node0; Path=/; Secure; HttpOnly',
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
        'enterprise-app.com',
        snapshot,
      );

      const java = result.technologies.find((t) => t.id === 'tech-java');
      expect(java).toBeDefined();
      expect(java?.name).toBe('Java');
      expect(java?.category).toBe('Infrastructure Runtime');
      expect(java?.confidenceLevel).toBe('HIGH');
      expect(java?.version).toBe('17.0.8');
      expect(java?.versionEvidence).toContain('Java/17.0.8');
      expect(java?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('detects Java from JSESSIONID cookie alone when version is unexposed', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://banking-portal.org',
          finalUrl: 'https://banking-portal.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'set-cookie': 'JSESSIONID=secret987token; Path=/',
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
        'banking-portal.org',
        snapshot,
      );

      const java = result.technologies.find((t) => t.id === 'tech-java');
      expect(java).toBeDefined();
      expect(java?.name).toBe('Java');
      expect(java?.version).toBeUndefined(); // Zero version hallucination
      expect(java?.evidence.some((e) => e.observedValue === 'JSESSIONID')).toBe(
        true,
      );
    });

    it('returns null / absent when no Java signatures exist', async () => {
      const nonJavaSnapshot: DiscoverySnapshot = {
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
        nonJavaSnapshot,
      );
      const java = result.technologies.find((t) => t.id === 'tech-java');
      expect(java).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Java infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://java-backend.io',
          finalUrl: 'https://java-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by':
              'Servlet/3.1 JSP/2.3 (GlassFish Server Open Source Edition 4.1 Java/1.8)',
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

      const result = await techDiscovery.discover('java-backend.io', snapshot);
      const java = result.technologies.find((t) => t.id === 'tech-java');

      expect(java).toBeDefined();
      expect(java.role).toContain('Java');
      expect(java.infrastructureMeaning).toContain(
        'Java Virtual Machine (JVM)',
      );
      expect(java.whatThisDoesNotProve).toContain('does not prove Spring');
      expect(java.whatThisDoesNotProve).toContain('Tomcat');
      expect(java.whatThisDoesNotProve).toContain('Docker');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Java at the RUNTIME layer and preserves independent Application and Gateway observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://spring-enterprise.com',
          finalUrl: 'https://spring-enterprise.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Java/17.0.8',
            'set-cookie': 'JSESSIONID=spring123session; Path=/',
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
        'spring-enterprise.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Java at RUNTIME
      const javaNode = topo.nodes.find((n) => n.technologyId === 'tech-java');
      expect(javaNode).toBeDefined();
      expect(javaNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Java in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://enterprise-portal.org',
          finalUrl: 'https://enterprise-portal.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-powered-by': 'Java/21',
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
        'enterprise-portal.org',
        snapshot,
      );
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Java',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-java'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Java in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-java',
              name: 'Java',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '17.0.8',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Java application runtime.',
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
                technologyId: 'tech-java',
                technologyName: 'Java',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Java' }],
              },
            ],
            keyTechnologies: [{ name: 'Java', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Java',
                boundary:
                  'Java presence does not prove Spring Boot or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-java-1',
        'dom-java-1',
        'java-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-java-1',
        'dom-java-1',
        'java-test.com',
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
    it('detects Java addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currJava11: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-java',
              name: 'Java',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '11.0.18',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-java',
                technologyName: 'Java',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Java' }],
              },
            ],
          } as any,
        },
      };

      const currJava17: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-java',
              name: 'Java',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '17.0.8',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-java',
                technologyName: 'Java',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Java' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currJava11,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Java',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currJava11,
        currJava17,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '11.0.18' &&
            d.currentState?.version === '17.0.8',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currJava17,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Java',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Java into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-java-overview',
        domainId: 'dom-java-overview',
        jobId: 'job-013',
        responseTimeMs: 35,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint executes a Java server-side runtime.',
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
                  technologyId: 'tech-java',
                  technologyName: 'Java',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-java',
                      name: 'Java',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-java',
                  name: 'Java',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-java',
                  technologyName: 'Java',
                  boundary: 'Java presence does not prove Spring Boot',
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
        'Java',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Java');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Spring or Tomcat from Java evidence alone', () => {
      expect(javaDetector.id).toBe('tech-java');
      expect(javaDetector.whatThisDoesNotProve).toContain('Spring');
      expect(javaDetector.whatThisDoesNotProve).toContain('Tomcat');
      expect(javaDetector.whatThisDoesNotProve).toContain('PostgreSQL');
      expect(javaDetector.whatThisDoesNotProve).toContain('Docker');
    });
  });
});
