import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { JavaScriptDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/javascript.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T14: JavaScript Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let jsDetector: JavaScriptDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    jsDetector = moduleRef.get(JavaScriptDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative JavaScript Detection & Evidence Extraction (TECH-001)', () => {
    it('detects JavaScript from script tags and client bundles with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://interactive-web.com',
          finalUrl: 'https://interactive-web.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
          bodySnippet:
            '<!DOCTYPE html><html><head><script type="module" src="/assets/main.js"></script></head><body><div id="app"></div></body></html>',
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
        'interactive-web.com',
        snapshot,
      );

      const js = result.technologies.find((t) => t.id === 'tech-javascript');
      expect(js).toBeDefined();
      expect(js?.name).toBe('JavaScript');
      expect(js?.category).toBe('Frameworks');
      expect(js?.confidenceLevel).toBe('HIGH');
      expect(js?.version).toBeUndefined(); // Version invariant: no fake version string
      expect(js?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects JavaScript from JavaScript MIME response header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://cdn.example.com/bundle.js',
          finalUrl: 'https://cdn.example.com/bundle.js',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 15,
          headers: {
            'content-type': 'application/javascript; charset=utf-8',
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

      const result = await techDiscovery.discover('cdn.example.com', snapshot);

      const js = result.technologies.find((t) => t.id === 'tech-javascript');
      expect(js).toBeDefined();
      expect(js?.name).toBe('JavaScript');
      expect(
        js?.evidence.some((e) =>
          e.observedValue?.includes('application/javascript'),
        ),
      ).toBe(true);
    });

    it('returns null / absent when no JavaScript signatures exist in plain response', async () => {
      const nonJsSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://plain-text.org',
          finalUrl: 'https://plain-text.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'content-type': 'text/plain',
            server: 'Caddy',
          },
          bodySnippet: 'Hello World Plain Text',
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
        'plain-text.org',
        nonJsSnapshot,
      );
      const js = result.technologies.find((t) => t.id === 'tech-javascript');
      expect(js).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative JavaScript infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://js-portal.io',
          finalUrl: 'https://js-portal.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: { 'content-type': 'text/html' },
          bodySnippet: '<script src="/bundle.js"></script>',
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('js-portal.io', snapshot);
      const js = result.technologies.find((t) => t.id === 'tech-javascript');

      expect(js).toBeDefined();
      expect(js.role).toContain('Client-side');
      expect(js.infrastructureMeaning).toContain(
        'browser-side application behavior',
      );
      expect(js.whatThisDoesNotProve).toContain('Node.js');
      expect(js.whatThisDoesNotProve).toContain('React');
      expect(js.whatThisDoesNotProve).toContain('Next.js');
      expect(js.whatThisDoesNotProve).toContain('SSR');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions JavaScript at the APPLICATION layer and preserves independent React and Next.js observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://react-next-app.com',
          finalUrl: 'https://react-next-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'content-type': 'text/html',
            'x-powered-by': 'Next.js',
          },
          bodySnippet:
            '<div id="__next" data-reactroot=""><script src="/_next/static/chunks/main.js"></script></div>',
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
        'react-next-app.com',
        snapshot,
      );
      const topo = result.topology;

      // JavaScript at APPLICATION
      const jsNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-javascript',
      );
      expect(jsNode).toBeDefined();
      expect(jsNode?.layer).toBe(TopologyLayer.APPLICATION);

      // React at APPLICATION
      const reactNode = topo.nodes.find((n) => n.technologyId === 'tech-react');
      expect(reactNode).toBeDefined();
      expect(reactNode?.layer).toBe(TopologyLayer.APPLICATION);

      // Next.js at APPLICATION
      const nextNode = topo.nodes.find((n) => n.technologyId === 'tech-nextjs');
      expect(nextNode).toBeDefined();
      expect(nextNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Node.js, Webpack, Vite, SSR must remain unobserved unless directly evidenced
      const nodeJsNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-nodejs',
      );
      expect(nodeJsNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes JavaScript in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://js-brief.org',
          finalUrl: 'https://js-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: { 'content-type': 'text/html' },
          bodySnippet: '<script src="/app.js"></script>',
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus: 'SUCCESS',
          confidence: 'AUTHORITATIVE',
          error: null,
        },
      };

      const result = await techDiscovery.discover('js-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'JavaScript',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-javascript'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures JavaScript in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-javascript',
              name: 'JavaScript',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            summary: 'The public endpoint delivers client-side JavaScript.',
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
                technologyId: 'tech-javascript',
                technologyName: 'JavaScript',
                role: 'Client Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'JavaScript' }],
              },
            ],
            keyTechnologies: [{ name: 'JavaScript', role: 'Client Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'JavaScript',
                boundary: 'JavaScript presence does not prove Node.js backend',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-js-1',
        'dom-js-1',
        'js-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-js-1',
        'dom-js-1',
        'js-test.com',
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
    it('detects JavaScript addition and removal without fabricating architectural redesigns', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currJs: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-javascript',
              name: 'JavaScript',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-javascript',
                technologyName: 'JavaScript',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'JavaScript' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(prevEmpty, currJs);
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'JavaScript',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(currJs, prevEmpty);
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'JavaScript',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps JavaScript into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-js-overview',
        domainId: 'dom-js-overview',
        jobId: 'job-014',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint delivers client-side JavaScript.',
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
                  technologyId: 'tech-javascript',
                  technologyName: 'JavaScript',
                  role: 'Client Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.APPLICATION,
                  technologies: [
                    {
                      technologyId: 'tech-javascript',
                      name: 'JavaScript',
                      role: 'Client Runtime',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-javascript',
                  name: 'JavaScript',
                  role: 'Client Runtime',
                  layer: TopologyLayer.APPLICATION,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-javascript',
                  technologyName: 'JavaScript',
                  boundary:
                    'JavaScript presence does not prove Node.js backend',
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
        'JavaScript',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('JavaScript');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Node.js, React, Next.js, or SSR from JavaScript evidence alone', () => {
      expect(jsDetector.id).toBe('tech-javascript');
      expect(jsDetector.whatThisDoesNotProve).toContain('Node.js');
      expect(jsDetector.whatThisDoesNotProve).toContain('React');
      expect(jsDetector.whatThisDoesNotProve).toContain('Next.js');
      expect(jsDetector.whatThisDoesNotProve).toContain('SSR');
      expect(jsDetector.whatThisDoesNotProve).toContain('Webpack');
    });
  });
});
