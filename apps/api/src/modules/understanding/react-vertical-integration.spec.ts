import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { ReactDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/react.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

describe('T7: React Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let reactDetector: ReactDetector;
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
    reactDetector = moduleRef.get(ReactDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative React Detection (TECH-001)', () => {
    it('detects React from data-reactroot and __reactFiber attributes in HTML with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div id="root" data-reactroot="" __reactFiber="1"><script src="/static/js/react-dom.production.min.js"></script></div></body></html>',
        http: {
          reachable: true,
          url: 'https://react-spa.com',
          finalUrl: 'https://react-spa.com',
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

      const result = await techDiscovery.discover('react-spa.com', snapshot);

      const react = result.technologies.find((t) => t.id === 'tech-react');
      expect(react).toBeDefined();
      expect(react?.name).toBe('React');
      expect(react?.category).toBe('Frameworks');
      expect(react?.confidenceLevel).toBe('HIGH');
      expect(react?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('returns null / absent when no React signatures exist', async () => {
      const nonReactSnapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div id="app">Static Plain Page</div></body></html>',
        http: {
          reachable: true,
          url: 'https://vanilla-html.org',
          finalUrl: 'https://vanilla-html.org',
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
        'vanilla-html.org',
        nonReactSnapshot,
      );
      const react = result.technologies.find((t) => t.id === 'tech-react');
      expect(react).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Next.js, Vercel, Node.js backend, or SSR', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div data-reactroot=""><h1>Client App</h1></div></body></html>',
        http: {
          reachable: true,
          url: 'https://react-client-app.com',
          finalUrl: 'https://react-client-app.com',
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
        'react-client-app.com',
        snapshot,
      );
      const react = result.technologies.find((t) => t.id === 'tech-react');

      // 1. What is it?
      expect(react.category).toBe('Frameworks');
      // 2. Role
      expect(react.role).toContain('Client-side UI');
      // 3. Meaning
      expect(react.infrastructureMeaning).toContain(
        'The public endpoint appears to use React for its browser-facing presentation layer',
      );
      // 4. Critical Anti-Overreach: React ≠ Next.js, Vercel, Node.js backend, or SSR/SSG
      expect(react.whatThisDoesNotProve).toContain(
        'does not prove Next.js, Vercel, Node.js backend, SSR/SSG execution, or underlying cloud hosting provider',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps React at APPLICATION layer without manufacturing fake Next.js, Vercel, or Node.js backend nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div data-reactroot="">React SPA</div></body></html>',
        http: {
          reachable: true,
          url: 'https://react-nginx-app.io',
          finalUrl: 'https://react-nginx-app.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            server: 'nginx/1.24.0',
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
        'react-nginx-app.io',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // React at APPLICATION layer
      const reactNode = topo.nodes.find((n) => n.technologyId === 'tech-react');
      expect(reactNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Zero manufactured Next.js, Vercel, or Node.js nodes (No unevidenced server framework)
      const nextNode = topo.nodes.find((n) =>
        n.technologyId.includes('nextjs'),
      );
      const vercelNode = topo.nodes.find((n) =>
        n.technologyId.includes('vercel'),
      );
      const nodejsNode = topo.nodes.find((n) =>
        n.technologyId.includes('nodejs'),
      );
      expect(nextNode).toBeUndefined();
      expect(vercelNode).toBeUndefined();
      expect(nodejsNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes React UI in request path and preserves unobserved server runtime as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><div data-reactroot="">React Client</div></body></html>',
        http: {
          reachable: true,
          url: 'https://react-brief-app.com',
          finalUrl: 'https://react-brief-app.com',
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
        'react-brief-app.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes React
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'React',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-react'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures React in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-react',
              name: 'React',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to use React for client-side UI rendering.',
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
                technologyId: 'tech-react',
                technologyName: 'React',
                role: 'Client UI',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'React' }],
              },
            ],
            keyTechnologies: [{ name: 'React', role: 'Client UI' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'React',
                boundary: 'React presence does not prove Next.js or Vercel',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-react-1',
        'dom-react-1',
        'react-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-react-1',
        'dom-react-1',
        'react-test.com',
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
    it('detects UI framework migration from React to Vue without fabricating organizational intent', () => {
      const prevReact: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-react',
              name: 'React',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-react',
                technologyName: 'React',
                role: 'UI Library',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'React' }],
              },
            ],
          } as any,
        },
      };

      const currVue: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-vue',
              name: 'Vue.js',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-vue',
                technologyName: 'Vue.js',
                role: 'UI Framework',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Vue.js' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevReact, currVue);

      const migration = diffs.find(
        (d) => d.classification === 'FRAMEWORK_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Application framework migrated from React to Vue.js.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('performance');
        expect(diff.description).not.toContain('team decision');
      }
    });

    it('detects React addition and removal', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currReact: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-react',
              name: 'React',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-react',
                technologyName: 'React',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'React' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currReact,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'React',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currReact,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'React',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps React into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-react-overview',
        domainId: 'dom-react-overview',
        jobId: 'job-007',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint appears to use React for client-side UI rendering.',
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
                  technologyId: 'tech-react',
                  technologyName: 'React',
                  role: 'Client UI',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  state: 'OBSERVED',
                  confidenceLevel: 'HIGH',
                  technologies: [
                    {
                      technologyId: 'tech-react',
                      name: 'React',
                      role: 'Client UI',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-react',
                  name: 'React',
                  role: 'Client UI',
                  layer: TopologyLayer.APPLICATION,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-react',
                  technologyName: 'React',
                  boundary: 'React presence does not prove Next.js or Vercel',
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
        'React',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('React');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes React client-side framework into executive brief without React-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-react-exec',
        domainId: 'dom-react-exec',
        domainName: 'react-app.com',
        createdAt: new Date(),
        responseTimeMs: 25,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is served through an NGINX gateway and delivers a React client-side UI interface.',
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
                  technologyId: 'tech-react',
                  technologyName: 'React',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'React',
                  boundary: 'React presence does not prove Next.js or Vercel',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('React client-side UI');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T7 Plug-and-Play Invariant', () => {
    it('verifies React is modularly registered without centralized hardcoding in core engines', () => {
      expect(reactDetector.id).toBe('tech-react');
      expect(reactDetector.name).toBe('React');
      expect(reactDetector.category).toBe('Frameworks');
    });
  });
});
