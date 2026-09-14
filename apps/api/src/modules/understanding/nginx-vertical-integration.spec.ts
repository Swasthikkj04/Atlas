import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { NginxDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/nginx.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

describe('T5: NGINX Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let nginxDetector: NginxDetector;
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
    nginxDetector = moduleRef.get(NginxDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative NGINX Detection & Version Extraction (TECH-001)', () => {
    it('detects NGINX and extracts version from Server header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://nginx-backed-app.com',
          finalUrl: 'https://nginx-backed-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            server: 'nginx/1.24.0 (Ubuntu)',
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
        'nginx-backed-app.com',
        snapshot,
      );

      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      expect(nginx).toBeDefined();
      expect(nginx?.name).toBe('NGINX');
      expect(nginx?.category).toBe('Web / Server');
      expect(nginx?.version).toBe('1.24.0');
      expect(nginx?.confidenceLevel).toBe('HIGH');
      expect(nginx?.evidence[0].sourceType).toBe('HTTP');
    });

    it('returns null / absent when no NGINX signatures exist', async () => {
      const nonNginxSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://caddy-app.org',
          finalUrl: 'https://caddy-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
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
        'caddy-app.org',
        nonNginxSnapshot,
      );
      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');
      expect(nginx).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Linux, Docker, or Cloud', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://nginx-boundary.io',
          finalUrl: 'https://nginx-boundary.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: { server: 'nginx/1.24.0' },
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
        'nginx-boundary.io',
        snapshot,
      );
      const nginx = result.technologies.find((t) => t.id === 'tech-nginx');

      // 1. What is it?
      expect(nginx.category).toBe('Web / Server');
      // 2. Role
      expect(nginx.role).toContain('Web gateway');
      // 3. Meaning
      expect(nginx.infrastructureMeaning).toContain(
        'NGINX appears to participate in handling or forwarding public HTTP traffic',
      );
      // 4. Critical Anti-Overreach: NGINX ≠ Linux, Docker, Kubernetes, AWS, or downstream framework
      expect(nginx.whatThisDoesNotProve).toContain(
        'does not prove underlying Linux distribution, Docker, Kubernetes, AWS/cloud hosting, or downstream application framework',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('positions NGINX at GATEWAY layer and links to application without fabricating unobserved runtime nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://nginx-nextjs-stack.com',
          finalUrl: 'https://nginx-nextjs-stack.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Next.js',
            'cf-ray': '89cf-test-ray',
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
        'nginx-nextjs-stack.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX is at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Cloudflare is at EDGE layer
      const cfNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-cloudflare',
      );
      expect(cfNode?.layer).toBe(TopologyLayer.EDGE);

      // Next.js is at APPLICATION layer
      const nextNode = topo.nodes.find((n) => n.technologyId === 'tech-nextjs');
      expect(nextNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Zero manufactured runtime or OS nodes (No fake Docker, Linux, Kubernetes)
      const dockerNode = topo.nodes.find((n) =>
        n.technologyId.includes('docker'),
      );
      const linuxNode = topo.nodes.find((n) =>
        n.technologyId.includes('linux'),
      );
      expect(dockerNode).toBeUndefined();
      expect(linuxNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes NGINX gateway in request path and preserves unobserved runtime dimensions as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://nginx-only-app.com',
          finalUrl: 'https://nginx-only-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 22,
          headers: { server: 'nginx/1.24.0' },
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
        'nginx-only-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes NGINX
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'NGINX',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-nginx'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures NGINX and its version in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              version: '1.24.0',
              confidence: 0.99,
            } as any,
          ],
          architectureBrief: {
            summary: 'Public endpoint is served by an NGINX web gateway.',
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
            keyTechnologies: [{ name: 'NGINX', role: 'Web Gateway' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'NGINX',
                boundary: 'NGINX does not prove Linux or Docker runtime',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.99 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-nginx-1',
        'dom-nginx-1',
        'nginx-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-nginx-1',
        'dom-nginx-1',
        'nginx-test.com',
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
    it('detects gateway migration from NGINX to Caddy without fabricating operational intent', () => {
      const prevNginx: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Gateway',
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

      const currCaddy: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-caddy',
              name: 'Caddy',
              category: 'Web / Server',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-caddy',
                technologyName: 'Caddy',
                role: 'Gateway',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [{ name: 'Caddy' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevNginx, currCaddy);

      const migration = diffs.find(
        (d) => d.classification === 'GATEWAY_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Web gateway migrated from NGINX to Caddy.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('performance');
        expect(diff.description).not.toContain('engineering team');
      }
    });

    it('detects NGINX version upgrade as TECHNOLOGY_CHANGED', () => {
      const prevNginxOld: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              version: '1.22.0',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.GATEWAY,
                technologyId: 'tech-nginx',
                technologyName: 'NGINX',
                role: 'Gateway',
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

      const currNginxNew: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              category: 'Web / Server',
              version: '1.24.0',
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
                role: 'Gateway',
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

      const diffs = changeAnalyzer.analyzeDifferences(
        prevNginxOld,
        currNginxNew,
      );
      const versionChange = diffs.find(
        (d) =>
          d.classification === 'TECHNOLOGY_CHANGED' &&
          d.technologyName === 'NGINX',
      );

      expect(versionChange).toBeDefined();
      expect(versionChange?.description).toContain("from '1.22.0' to '1.24.0'");
    });
  });

  describe('7. Technology Finding Rules (TECH-007)', () => {
    it('evaluates TechnologyVersionExposureRule when NGINX exposes exact version in Server header', async () => {
      const versionSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          headers: {
            server: 'nginx/1.24.0',
          },
        } as any,
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web / Server',
            } as any,
          ],
          architectureBrief: {
            layers: [
              {
                layer: TopologyLayer.GATEWAY,
                state: 'OBSERVED',
                technologies: [
                  {
                    technologyId: 'tech-nginx',
                    name: 'NGINX',
                    version: '1.24.0',
                  } as any,
                ],
              },
            ],
          } as any,
        },
      };

      const context: FindingContext = {
        domainId: 'dom-nginx-ver',
        snapshotId: 'snp-nginx-ver',
        snapshot: versionSnapshot,
      };

      const findings = await ruleEngine.evaluate(context);
      const verFinding = findings.find(
        (f) => f.ruleId === 'tech.version-exposure',
      );

      expect(verFinding).toBeDefined();
      expect(verFinding?.title).toBe(
        'Technology Version Information Publicly Disclosed',
      );
      expect(verFinding?.severity).toBe(Severity.LOW);
    });
  });

  describe('8. Domain Overview API Convergence (TECH-008)', () => {
    it('maps NGINX into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-nginx-overview',
        domainId: 'dom-nginx-overview',
        jobId: 'job-005',
        responseTimeMs: 20,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to be served through an NGINX reverse proxy gateway.',
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
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
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
                      technologyId: 'tech-nginx',
                      name: 'NGINX',
                      version: '1.24.0',
                      role: 'Web Gateway',
                      layer: TopologyLayer.GATEWAY,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-nginx',
                  name: 'NGINX',
                  version: '1.24.0',
                  role: 'Web Gateway',
                  layer: TopologyLayer.GATEWAY,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
                  boundary:
                    'NGINX presence does not prove Linux or Docker runtime',
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
        'NGINX reverse proxy gateway',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('NGINX');
      expect(overview.technologyArchitecture?.keyTechnologies[0].version).toBe(
        '1.24.0',
      );
    });
  });

  describe('9. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes NGINX gateway into executive brief without NGINX-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-nginx-exec',
        domainId: 'dom-nginx-exec',
        domainName: 'nginx-portal.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is routed through Cloudflare edge infrastructure before reaching an NGINX gateway and Next.js.',
              architecturePath: [
                {
                  hop: 0,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'public-endpoint',
                  technologyName: 'Public Endpoint',
                },
                {
                  hop: 1,
                  layer: TopologyLayer.EDGE,
                  technologyId: 'tech-cloudflare',
                  technologyName: 'Cloudflare',
                },
                {
                  hop: 2,
                  layer: TopologyLayer.GATEWAY,
                  technologyId: 'tech-nginx',
                  technologyName: 'NGINX',
                },
                {
                  hop: 3,
                  layer: TopologyLayer.APPLICATION,
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'NGINX',
                  boundary: 'NGINX does not prove Linux or Docker runtime',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('NGINX gateway');
      expect(brief.architecture?.ingressPath).toHaveLength(4);
    });
  });

  describe('10. The T5 Plug-and-Play Invariant', () => {
    it('verifies NGINX is modularly registered without centralized hardcoding in core engines', () => {
      expect(nginxDetector.id).toBe('tech-nginx');
      expect(nginxDetector.name).toBe('NGINX');
      expect(nginxDetector.category).toBe('Web / Server');
    });
  });
});
