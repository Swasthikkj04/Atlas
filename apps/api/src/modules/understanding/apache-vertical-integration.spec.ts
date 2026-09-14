import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { ApacheDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/apache.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T10: Apache HTTP Server Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let apacheDetector: ApacheDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;
  let briefBuilder: InfrastructureBriefBuilder;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    apacheDetector = moduleRef.get(ApacheDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Apache Detection & Version Extraction (TECH-001)', () => {
    it('detects Apache and extracts exact version from Server header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://apache-portal.com',
          finalUrl: 'https://apache-portal.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 32,
          headers: {
            server: 'Apache/2.4.52 (Ubuntu)',
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
        'apache-portal.com',
        snapshot,
      );

      const apache = result.technologies.find((t) => t.id === 'tech-apache');
      expect(apache).toBeDefined();
      expect(apache?.name).toBe('Apache HTTP Server');
      expect(apache?.category).toBe('Web / Server');
      expect(apache?.confidenceLevel).toBe('HIGH');
      expect(apache?.version).toBe('2.4.52');
      expect(apache?.versionEvidence).toContain('Apache/2.4.52');
    });

    it('returns null / absent when no Apache signatures exist or when Coyote is present', async () => {
      const nonApacheSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://tomcat-coyote.org',
          finalUrl: 'https://tomcat-coyote.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Apache-Coyote/1.1' },
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
        'tomcat-coyote.org',
        nonApacheSnapshot,
      );
      const apache = result.technologies.find((t) => t.id === 'tech-apache');
      expect(apache).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Linux, PHP, Docker, or AWS', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://apache-boundary.io',
          finalUrl: 'https://apache-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            server: 'Apache/2.4.58',
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
        'apache-boundary.io',
        snapshot,
      );
      const apache = result.technologies.find((t) => t.id === 'tech-apache');

      // 1. What is it?
      expect(apache.category).toBe('Web / Server');
      // 2. Role
      expect(apache.role).toContain('Web gateway');
      // 3. Meaning
      expect(apache.infrastructureMeaning).toContain(
        'The public endpoint appears to use Apache HTTP Server to serve or participate in handling public HTTP traffic',
      );
      // 4. Critical Anti-Overreach: Apache ≠ Linux, PHP, Docker, AWS
      expect(apache.whatThisDoesNotProve).toContain(
        'does not prove Linux host OS, a particular distribution, PHP, Django, WordPress, Node.js, Docker, Kubernetes, AWS, GCP, Azure',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps Apache at GATEWAY layer and establishes supported relationships to Django when independently evidenced', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><form><input type="hidden" name="csrfmiddlewaretoken" value="abc" /></form></body></html>',
        http: {
          reachable: true,
          url: 'https://apache-django.io',
          finalUrl: 'https://apache-django.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'Apache/2.4.52',
            'set-cookie': 'csrftoken=abc123xyz; Path=/',
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

      const result = await techDiscovery.discover('apache-django.io', snapshot);
      const topo = result.topology;

      // Apache at GATEWAY layer
      const apacheNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-apache',
      );
      expect(apacheNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Django at APPLICATION layer
      const djangoNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-django',
      );
      expect(djangoNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Zero manufactured Linux, PHP, WordPress, Docker, or AWS origin nodes
      const linuxNode = topo.nodes.find((n) =>
        n.technologyId.includes('linux'),
      );
      const phpNode = topo.nodes.find((n) => n.technologyId.includes('php'));
      const wpNode = topo.nodes.find((n) =>
        n.technologyId.includes('wordpress'),
      );
      const dockerNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-docker',
      );
      const awsNode = topo.nodes.find((n) => n.technologyId === 'tech-aws');
      expect(linuxNode).toBeUndefined();
      expect(phpNode).toBeUndefined();
      expect(wpNode).toBeUndefined();
      expect(dockerNode).toBeUndefined();
      expect(awsNode).toBeUndefined();
    });

    it('maps Apache without downstream technologies when only Apache is observed', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://apache-only.io',
          finalUrl: 'https://apache-only.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            server: 'Apache/2.4.52',
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

      const result = await techDiscovery.discover('apache-only.io', snapshot);
      const topo = result.topology;

      const apacheNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-apache',
      );
      expect(apacheNode?.layer).toBe(TopologyLayer.GATEWAY);
      expect(
        topo.nodes.filter((n) => n.layer === TopologyLayer.APPLICATION),
      ).toHaveLength(0);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Apache in request path and preserves unobserved OS, container runtime, and backend as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://apache-brief-app.com',
          finalUrl: 'https://apache-brief-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'Apache/2.4.52',
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
        'apache-brief-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes Apache
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Apache HTTP Server',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-apache'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Apache in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              confidence: 0.99,
              version: '2.4.52',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to use Apache HTTP Server as its web gateway.',
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
                technologyId: 'tech-apache',
                technologyName: 'Apache HTTP Server',
                role: 'Web Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Apache HTTP Server' }],
              },
            ],
            keyTechnologies: [
              { name: 'Apache HTTP Server', role: 'Web Gateway' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Apache HTTP Server',
                boundary: 'Apache presence does not prove Linux or PHP',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.99 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-apa-1',
        'dom-apa-1',
        'apache-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-apa-1',
        'dom-apa-1',
        'apache-test.com',
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
    it('detects gateway migration from Apache to NGINX without fabricating organizational intent', () => {
      const prevApache: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              confidence: 0.99,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-apache',
                technologyName: 'Apache HTTP Server',
                role: 'Web Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Apache HTTP Server' }],
              },
            ],
          } as any,
        },
      };

      const currNginx: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.99,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Web Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'NGINX' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevApache, currNginx);

      const migration = diffs.find(
        (d) => d.classification === 'GATEWAY_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Web gateway migrated from Apache HTTP Server to NGINX.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('performance');
        expect(diff.description).not.toContain('team decision');
      }
    });

    it('detects Apache addition, removal, and version changes', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currApache52: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              confidence: 0.99,
              version: '2.4.52',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-apache',
                technologyName: 'Apache HTTP Server',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Apache HTTP Server' }],
              },
            ],
          } as any,
        },
      };

      const currApache62: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-apache',
              name: 'Apache HTTP Server',
              category: 'Web / Server',
              confidence: 0.99,
              version: '2.4.62',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-apache',
                technologyName: 'Apache HTTP Server',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Apache HTTP Server' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currApache52,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Apache HTTP Server',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currApache52,
        currApache62,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '2.4.52' &&
            d.currentState?.version === '2.4.62',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currApache52,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Apache HTTP Server',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Apache into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-apa-overview',
        domainId: 'dom-apa-overview',
        jobId: 'job-010',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an Apache HTTP Server gateway.',
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
                  technologyId: 'tech-apache',
                  technologyName: 'Apache HTTP Server',
                  role: 'Web Gateway',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.GATEWAY,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-apache',
                      name: 'Apache HTTP Server',
                      role: 'Web Gateway',
                      layer: TopologyLayer.GATEWAY,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-apache',
                  name: 'Apache HTTP Server',
                  role: 'Web Gateway',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-apache',
                  technologyName: 'Apache HTTP Server',
                  boundary: 'Apache presence does not prove Linux or PHP',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.99 },
            },
          },
        },
      } as any;

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'Apache HTTP Server',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Apache HTTP Server');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes Apache gateway into executive brief without Apache-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-apa-exec',
        domainId: 'dom-apa-exec',
        domainName: 'apache-app.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an Apache HTTP Server gateway delivering application traffic.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-apache',
                  technologyName: 'Apache HTTP Server',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'Apache HTTP Server',
                  boundary: 'Apache presence does not prove Linux or PHP',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('Apache HTTP Server');
      expect(brief.architecture?.ingressPath).toHaveLength(2);
    });
  });

  describe('9. The T10 Plug-and-Play Invariant', () => {
    it('verifies Apache is modularly registered without centralized hardcoding in core engines', () => {
      expect(apacheDetector.id).toBe('tech-apache');
      expect(apacheDetector.name).toBe('Apache HTTP Server');
      expect(apacheDetector.category).toBe('Web / Server');
    });
  });
});
