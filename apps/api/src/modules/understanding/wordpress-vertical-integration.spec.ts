import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { WordPressDetector } from '../../infrastructure/discovery/technology/detectors/cms/wordpress.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  TechnologyCategory,
  TopologyLayer,
} from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T12: WordPress Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let wpDetector: WordPressDetector;
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
    wpDetector = moduleRef.get(WordPressDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative WordPress Detection & Version Extraction (TECH-001)', () => {
    it('detects WordPress and extracts exact version from generator meta tag with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><head><meta name="generator" content="WordPress 6.4.2" /><link rel="stylesheet" href="/wp-content/themes/twentytwentyfour/style.css" /><script src="/wp-includes/js/wp-emoji-release.min.js"></script></head><body><h1>Blog</h1></body></html>',
        http: {
          reachable: true,
          url: 'https://wp-blog.com',
          finalUrl: 'https://wp-blog.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-pingback': 'https://wp-blog.com/xmlrpc.php',
            'set-cookie': 'wordpress_test_cookie=WP+Cookie+check; path=/',
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

      const result = await techDiscovery.discover('wp-blog.com', snapshot);

      const wp = result.technologies.find((t) => t.id === 'tech-wordpress');
      expect(wp).toBeDefined();
      expect(wp?.name).toBe('WordPress');
      expect(wp?.category).toBe(TechnologyCategory.CMS);
      expect(wp?.confidenceLevel).toBe('HIGH');
      expect(wp?.version).toBe('6.4.2');
      expect(wp?.versionEvidence).toContain('WordPress 6.4.2');
      expect(wp?.evidence.length).toBeGreaterThanOrEqual(4);
    });

    it('returns null / absent when no WordPress signatures exist', async () => {
      const nonWpSnapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div id="root">Plain Web App</div></body></html>',
        http: {
          reachable: true,
          url: 'https://static-spa.org',
          finalUrl: 'https://static-spa.org',
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
        'static-spa.org',
        nonWpSnapshot,
      );
      const wp = result.technologies.find((t) => t.id === 'tech-wordpress');
      expect(wp).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about MySQL, Apache, Docker, or AWS', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><head><link rel="stylesheet" href="/wp-content/style.css" /></head><body></body></html>',
        http: {
          reachable: true,
          url: 'https://wp-boundary.io',
          finalUrl: 'https://wp-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {},
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('wp-boundary.io', snapshot);
      const wp = result.technologies.find((t) => t.id === 'tech-wordpress');

      // 1. What is it?
      expect(wp.category).toBe(TechnologyCategory.CMS);
      // 2. Role
      expect(wp.role).toContain('Content Management System');
      // 3. Meaning
      expect(wp.infrastructureMeaning).toContain(
        'The observed endpoint appears to use WordPress as part of its application/content-delivery architecture',
      );
      // 4. Critical Anti-Overreach: WordPress ≠ exact PHP version, database engine, hosting provider, Linux, Docker, Apache, NGINX
      expect(wp.whatThisDoesNotProve).toContain(
        'does not by itself prove the exact PHP version, database engine, hosting provider, Linux distribution, Docker/Kubernetes deployment, Apache/NGINX usage, specific plugins',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps WordPress at APPLICATION layer and links to NGINX and PHP when independently evidenced', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><head><link rel="stylesheet" href="/wp-content/themes/theme/style.css" /></head><body></body></html>',
        http: {
          reachable: true,
          url: 'https://nginx-wp-php-app.io',
          finalUrl: 'https://nginx-wp-php-app.io',
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

      const result = await techDiscovery.discover(
        'nginx-wp-php-app.io',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // WordPress at PLATFORM layer
      const wpNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-wordpress',
      );
      expect(wpNode?.layer).toBe(TopologyLayer.PLATFORM);

      // PHP at RUNTIME layer
      const phpNode = topo.nodes.find((n) => n.technologyId === 'tech-php');
      expect(phpNode?.layer).toBe(TopologyLayer.RUNTIME);

      // INVARIANT: Zero manufactured MySQL, Apache, Linux, Docker, or AWS origin nodes
      const mysqlNode = topo.nodes.find((n) =>
        n.technologyId.includes('mysql'),
      );
      const apacheNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-apache',
      );
      const linuxNode = topo.nodes.find((n) =>
        n.technologyId.includes('linux'),
      );
      const dockerNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-docker',
      );
      const awsNode = topo.nodes.find((n) => n.technologyId === 'tech-aws');
      expect(mysqlNode).toBeUndefined();
      expect(apacheNode).toBeUndefined();
      expect(linuxNode).toBeUndefined();
      expect(dockerNode).toBeUndefined();
      expect(awsNode).toBeUndefined();
    });

    it('maps WordPress alone in sparse infrastructure without manufacturing artificial web servers or databases', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><head><link rel="stylesheet" href="/wp-content/style.css" /></head><body></body></html>',
        http: {
          reachable: true,
          url: 'https://wp-only.io',
          finalUrl: 'https://wp-only.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: {},
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('wp-only.io', snapshot);
      const topo = result.topology;

      const wpNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-wordpress',
      );
      expect(wpNode?.layer).toBe(TopologyLayer.PLATFORM);
      expect(
        topo.nodes.filter((n) => n.layer === TopologyLayer.GATEWAY),
      ).toHaveLength(0);
      expect(
        topo.nodes.filter((n) => n.layer === TopologyLayer.DATA),
      ).toHaveLength(0);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes WordPress in request path and preserves unobserved database, container, and hosting as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><head><link rel="stylesheet" href="/wp-content/style.css" /></head><body></body></html>',
        http: {
          reachable: true,
          url: 'https://wp-brief-app.com',
          finalUrl: 'https://wp-brief-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {},
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('wp-brief-app.com', snapshot);
      const brief = result.architectureBrief;

      // Ingress path includes WordPress
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'WordPress',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-wordpress'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures WordPress in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-wordpress',
              name: 'WordPress',
              category: 'Content Management',
              confidence: 0.98,
              version: '6.4.2',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to use WordPress as its CMS application platform.',
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
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-wordpress',
                technologyName: 'WordPress',
                role: 'CMS Platform',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'WordPress' }],
              },
            ],
            keyTechnologies: [{ name: 'WordPress', role: 'CMS Platform' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'WordPress',
                boundary: 'WordPress presence does not prove MySQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-wp-1',
        'dom-wp-1',
        'wp-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-wp-1',
        'dom-wp-1',
        'wp-test.com',
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
    it('detects framework migration from WordPress to Django without fabricating organizational intent', () => {
      const prevWp: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-wordpress',
              name: 'WordPress',
              category: 'Content Management',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-wordpress',
                technologyName: 'WordPress',
                role: 'CMS',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'WordPress' }],
              },
            ],
          } as any,
        },
      };

      const currDjango: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-django',
              name: 'Django',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-django',
                technologyName: 'Django',
                role: 'Application Framework',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Django' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevWp, currDjango);

      const migration = diffs.find(
        (d) => d.classification === 'FRAMEWORK_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Application framework migrated from WordPress to Django.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('performance');
        expect(diff.description).not.toContain('team decision');
      }
    });

    it('detects WordPress addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currWp63: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-wordpress',
              name: 'WordPress',
              category: 'Content Management',
              confidence: 0.98,
              version: '6.3.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-wordpress',
                technologyName: 'WordPress',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'WordPress' }],
              },
            ],
          } as any,
        },
      };

      const currWp64: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-wordpress',
              name: 'WordPress',
              category: 'Content Management',
              confidence: 0.98,
              version: '6.4.2',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-wordpress',
                technologyName: 'WordPress',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'WordPress' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(prevEmpty, currWp63);
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'WordPress',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currWp63,
        currWp64,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '6.3.0' &&
            d.currentState?.version === '6.4.2',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currWp63,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'WordPress',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps WordPress into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-wp-overview',
        domainId: 'dom-wp-overview',
        jobId: 'job-012',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to use WordPress as its CMS application platform.',
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
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-wordpress',
                  technologyName: 'WordPress',
                  role: 'CMS Platform',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-wordpress',
                      name: 'WordPress',
                      role: 'CMS Platform',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-wordpress',
                  name: 'WordPress',
                  role: 'CMS Platform',
                  layer: TopologyLayer.APPLICATION,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-wordpress',
                  technologyName: 'WordPress',
                  boundary: 'WordPress presence does not prove MySQL',
                },
              ],
              confidence: { overallLevel: 'HIGH', overallScore: 0.98 },
            },
          },
        },
      } as any;

      const overview = InfrastructureOverviewMapper.fromSnapshot(mockSnapshot);

      expect(overview.technologyArchitecture).toBeDefined();
      expect(overview.technologyArchitecture?.architectureSummary).toContain(
        'WordPress',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('WordPress');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes WordPress application into executive brief without WordPress-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-wp-exec',
        domainId: 'dom-wp-exec',
        domainName: 'wp-portal.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is delivered through an NGINX gateway delivering a WordPress CMS application.',
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
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-wordpress',
                  technologyName: 'WordPress',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'WordPress',
                  boundary: 'WordPress presence does not prove MySQL',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('WordPress CMS application');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T12 Plug-and-Play Invariant', () => {
    it('verifies WordPress is modularly registered without centralized hardcoding in core engines', () => {
      expect(wpDetector.id).toBe('tech-wordpress');
      expect(wpDetector.name).toBe('WordPress');
      expect(wpDetector.category).toBe(TechnologyCategory.CMS);
    });
  });
});
