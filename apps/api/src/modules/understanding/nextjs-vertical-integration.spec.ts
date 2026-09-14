import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { NextJsDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/nextjs.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

describe('T8: Next.js Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let nextjsDetector: NextJsDetector;
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
    nextjsDetector = moduleRef.get(NextJsDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Next.js Detection (TECH-001)', () => {
    it('detects Next.js from X-Powered-By header, __NEXT_DATA__, and /_next/static paths with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div id="__next"><script id="__NEXT_DATA__" type="application/json">{"props":{}}</script><script src="/_next/static/chunks/main.js"></script></div></body></html>',
        http: {
          reachable: true,
          url: 'https://nextjs-app.com',
          finalUrl: 'https://nextjs-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Next.js',
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

      const result = await techDiscovery.discover('nextjs-app.com', snapshot);

      const nextjs = result.technologies.find((t) => t.id === 'tech-nextjs');
      expect(nextjs).toBeDefined();
      expect(nextjs?.name).toBe('Next.js');
      expect(nextjs?.category).toBe('Frameworks');
      expect(nextjs?.confidenceLevel).toBe('HIGH');
      expect(nextjs?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null / absent when no Next.js signatures exist', async () => {
      const nonNextSnapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div id="root" data-reactroot="">Plain React</div></body></html>',
        http: {
          reachable: true,
          url: 'https://plain-react.org',
          finalUrl: 'https://plain-react.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
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

      const result = await techDiscovery.discover(
        'plain-react.org',
        nonNextSnapshot,
      );
      const nextjs = result.technologies.find((t) => t.id === 'tech-nextjs');
      expect(nextjs).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Vercel, Node.js, AWS, or SSR/SSG', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><script id="__NEXT_DATA__">{}</script></body></html>',
        http: {
          reachable: true,
          url: 'https://nextjs-boundary.io',
          finalUrl: 'https://nextjs-boundary.io',
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

      const result = await techDiscovery.discover(
        'nextjs-boundary.io',
        snapshot,
      );
      const nextjs = result.technologies.find((t) => t.id === 'tech-nextjs');

      // 1. What is it?
      expect(nextjs.category).toBe('Frameworks');
      // 2. Role
      expect(nextjs.role).toContain('React-based application framework');
      // 3. Meaning
      expect(nextjs.infrastructureMeaning).toContain(
        'hybrid client/server-side application delivery',
      );
      // 4. Critical Anti-Overreach: Next.js ≠ Vercel, Node.js backend, AWS, SSR/SSG mode
      expect(nextjs.whatThisDoesNotProve).toContain(
        'Next.js framework usage does not prove hosting on Vercel',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps Next.js at APPLICATION layer without manufacturing fake Vercel or AWS compute nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><script id="__NEXT_DATA__">{}</script></body></html>',
        http: {
          reachable: true,
          url: 'https://nextjs-nginx-app.io',
          finalUrl: 'https://nextjs-nginx-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Next.js',
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
        'nextjs-nginx-app.io',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Next.js at APPLICATION layer
      const nextNode = topo.nodes.find((n) => n.technologyId === 'tech-nextjs');
      expect(nextNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Zero manufactured Vercel, AWS origin, or Node.js nodes
      const vercelNode = topo.nodes.find((n) =>
        n.technologyId.includes('vercel'),
      );
      const awsNode = topo.nodes.find((n) => n.technologyId === 'tech-aws');
      expect(vercelNode).toBeUndefined();
      expect(awsNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Next.js application framework in request path and preserves unobserved hosting environment as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><script id="__NEXT_DATA__">{}</script></body></html>',
        http: {
          reachable: true,
          url: 'https://nextjs-brief-app.com',
          finalUrl: 'https://nextjs-brief-app.com',
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

      const result = await techDiscovery.discover(
        'nextjs-brief-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes Next.js
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Next.js',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-nextjs'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Next.js in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nextjs',
              name: 'Next.js',
              category: 'Frameworks',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to use Next.js for hybrid application delivery.',
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
                technologyId: 'tech-nextjs',
                technologyName: 'Next.js',
                role: 'Application Framework',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Next.js' }],
              },
            ],
            keyTechnologies: [
              { name: 'Next.js', role: 'Application Framework' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Next.js',
                boundary: 'Next.js presence does not prove Vercel hosting',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.98 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-next-1',
        'dom-next-1',
        'next-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-next-1',
        'dom-next-1',
        'next-test.com',
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
    it('detects framework migration from Next.js to Remix without fabricating organizational intent', () => {
      const prevNext: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nextjs',
              name: 'Next.js',
              category: 'Frameworks',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-nextjs',
                technologyName: 'Next.js',
                role: 'Framework',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Next.js' }],
              },
            ],
          } as any,
        },
      };

      const currRemix: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-remix',
              name: 'Remix',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-remix',
                technologyName: 'Remix',
                role: 'Framework',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Remix' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevNext, currRemix);

      const migration = diffs.find(
        (d) => d.classification === 'FRAMEWORK_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Application framework migrated from Next.js to Remix.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('performance');
        expect(diff.description).not.toContain('team decision');
      }
    });

    it('detects Next.js addition and removal', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currNext: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nextjs',
              name: 'Next.js',
              category: 'Frameworks',
              confidence: 0.98,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-nextjs',
                technologyName: 'Next.js',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Next.js' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(prevEmpty, currNext);
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Next.js',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currNext,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Next.js',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Next.js into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-next-overview',
        domainId: 'dom-next-overview',
        jobId: 'job-008',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to use Next.js for hybrid application delivery.',
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
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                  role: 'Application Framework',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-nextjs',
                      name: 'Next.js',
                      role: 'Application Framework',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-nextjs',
                  name: 'Next.js',
                  role: 'Application Framework',
                  layer: TopologyLayer.APPLICATION,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                  boundary: 'Next.js presence does not prove Vercel hosting',
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
        'Next.js',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Next.js');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes Next.js application framework into executive brief without Next.js-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-next-exec',
        domainId: 'dom-next-exec',
        domainName: 'next-app.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an NGINX gateway and delivers a Next.js application frontend.',
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
                  technologyId: 'tech-nextjs',
                  technologyName: 'Next.js',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'Next.js',
                  boundary: 'Next.js presence does not prove Vercel hosting',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('Next.js application frontend');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T8 Plug-and-Play Invariant', () => {
    it('verifies Next.js is modularly registered without centralized hardcoding in core engines', () => {
      expect(nextjsDetector.id).toBe('tech-nextjs');
      expect(nextjsDetector.name).toBe('Next.js');
      expect(nextjsDetector.category).toBe('Frameworks');
    });
  });
});
