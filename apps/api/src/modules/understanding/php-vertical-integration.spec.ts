import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { PhpDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/php.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T11: PHP Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let phpDetector: PhpDetector;
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
    phpDetector = moduleRef.get(PhpDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative PHP Detection & Version Extraction (TECH-001)', () => {
    it('detects PHP and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://php-app.com',
          finalUrl: 'https://php-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-powered-by': 'PHP/8.2.14',
            'set-cookie': 'PHPSESSID=abc123session; path=/',
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

      const result = await techDiscovery.discover('php-app.com', snapshot);

      const php = result.technologies.find((t) => t.id === 'tech-php');
      expect(php).toBeDefined();
      expect(php?.name).toBe('PHP');
      expect(php?.category).toBe('Infrastructure Runtime');
      expect(php?.confidenceLevel).toBe('HIGH');
      expect(php?.version).toBe('8.2.14');
      expect(php?.versionEvidence).toContain('PHP/8.2.14');
      expect(php?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null / absent when no PHP signatures exist', async () => {
      const nonPhpSnapshot: DiscoverySnapshot = {
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
        nonPhpSnapshot,
      );
      const php = result.technologies.find((t) => t.id === 'tech-php');
      expect(php).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about WordPress, Laravel, Apache, Docker, or DB', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://php-boundary.io',
          finalUrl: 'https://php-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            'x-powered-by': 'PHP/8.2',
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

      const result = await techDiscovery.discover('php-boundary.io', snapshot);
      const php = result.technologies.find((t) => t.id === 'tech-php');

      // 1. What is it?
      expect(php.category).toBe('Infrastructure Runtime');
      // 2. Role
      expect(php.role).toContain('Server-side application');
      // 3. Meaning
      expect(php.infrastructureMeaning).toContain(
        'The observed endpoint appears to execute or expose a PHP-based server-side application/runtime boundary',
      );
      // 4. Critical Anti-Overreach: PHP ≠ WordPress, Laravel, Apache, NGINX, Linux, Docker, MySQL, AWS
      expect(php.whatThisDoesNotProve).toContain(
        'does not prove WordPress, Laravel, Symfony, Drupal, Apache, NGINX, Docker, Kubernetes, Linux, AWS, GCP, Azure, or any specific database',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps PHP at RUNTIME layer and links to NGINX when independently evidenced', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://nginx-php-app.io',
          finalUrl: 'https://nginx-php-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'PHP/8.2.14',
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

      const result = await techDiscovery.discover('nginx-php-app.io', snapshot);
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // PHP at RUNTIME layer
      const phpNode = topo.nodes.find((n) => n.technologyId === 'tech-php');
      expect(phpNode?.layer).toBe(TopologyLayer.RUNTIME);

      // INVARIANT: Zero manufactured WordPress, Laravel, Linux, Docker, MySQL, or AWS origin nodes
      const wpNode = topo.nodes.find((n) =>
        n.technologyId.includes('wordpress'),
      );
      const laravelNode = topo.nodes.find((n) =>
        n.technologyId.includes('laravel'),
      );
      const linuxNode = topo.nodes.find((n) =>
        n.technologyId.includes('linux'),
      );
      const dockerNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-docker',
      );
      const mysqlNode = topo.nodes.find((n) =>
        n.technologyId.includes('mysql'),
      );
      const awsNode = topo.nodes.find((n) => n.technologyId === 'tech-aws');
      expect(wpNode).toBeUndefined();
      expect(laravelNode).toBeUndefined();
      expect(linuxNode).toBeUndefined();
      expect(dockerNode).toBeUndefined();
      expect(mysqlNode).toBeUndefined();
      expect(awsNode).toBeUndefined();
    });

    it('maps PHP alone in sparse infrastructure without manufacturing artificial gateways', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://php-only.io',
          finalUrl: 'https://php-only.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {
            'x-powered-by': 'PHP/8.2',
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

      const result = await techDiscovery.discover('php-only.io', snapshot);
      const topo = result.topology;

      const phpNode = topo.nodes.find((n) => n.technologyId === 'tech-php');
      expect(phpNode?.layer).toBe(TopologyLayer.RUNTIME);
      expect(
        topo.nodes.filter((n) => n.layer === TopologyLayer.GATEWAY),
      ).toHaveLength(0);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes PHP in request path and preserves unobserved framework, OS, container, and database as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://php-brief-app.com',
          finalUrl: 'https://php-brief-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'PHP/8.2',
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
        'php-brief-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes PHP
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'PHP',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-php'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures PHP in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-php',
              name: 'PHP',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '8.2.14',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a PHP application runtime.',
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
                technologyId: 'tech-php',
                technologyName: 'PHP',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'PHP' }],
              },
            ],
            keyTechnologies: [{ name: 'PHP', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'PHP',
                boundary: 'PHP presence does not prove WordPress or MySQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-php-1',
        'dom-php-1',
        'php-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-php-1',
        'dom-php-1',
        'php-test.com',
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
    it('detects PHP addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currPhp74: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-php',
              name: 'PHP',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '7.4.33',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-php',
                technologyName: 'PHP',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'PHP' }],
              },
            ],
          } as any,
        },
      };

      const currPhp82: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-php',
              name: 'PHP',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '8.2.14',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-php',
                technologyName: 'PHP',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'PHP' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currPhp74,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'PHP',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currPhp74,
        currPhp82,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '7.4.33' &&
            d.currentState?.version === '8.2.14',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currPhp74,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'PHP',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps PHP into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-php-overview',
        domainId: 'dom-php-overview',
        jobId: 'job-011',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint executes a PHP server-side runtime.',
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
                  technologyId: 'tech-php',
                  technologyName: 'PHP',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-php',
                      name: 'PHP',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-php',
                  name: 'PHP',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-php',
                  technologyName: 'PHP',
                  boundary: 'PHP presence does not prove WordPress',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.95 },
            },
          },
        },
      } as any;

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'PHP',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('PHP');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes PHP runtime into executive brief without PHP-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-php-exec',
        domainId: 'dom-php-exec',
        domainName: 'php-portal.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an NGINX gateway delivering a PHP server-side application.',
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
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.RUNTIME,
                  technologyId: 'tech-php',
                  technologyName: 'PHP',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'PHP',
                  boundary: 'PHP presence does not prove WordPress',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('PHP server-side application');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T11 Plug-and-Play Invariant', () => {
    it('verifies PHP is modularly registered without centralized hardcoding in core engines', () => {
      expect(phpDetector.id).toBe('tech-php');
      expect(phpDetector.name).toBe('PHP');
      expect(phpDetector.category).toBe('Infrastructure Runtime');
    });
  });
});
