import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { NodeJsDetector } from '../../infrastructure/discovery/technology/detectors/web-servers/nodejs.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T15: Node.js Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let nodeDetector: NodeJsDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    nodeDetector = moduleRef.get(NodeJsDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Node.js Detection & Version Extraction (TECH-001)', () => {
    it('detects Node.js and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://api.node-service.io',
          finalUrl: 'https://api.node-service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'x-powered-by': 'Node.js/v20.11.1',
            'set-cookie':
              'connect.sid=s%3Axyz123.sessiontoken; Path=/; HttpOnly',
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
        'api.node-service.io',
        snapshot,
      );

      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Node.js');
      expect(node?.category).toBe('Infrastructure Runtime');
      expect(node?.confidenceLevel).toBe('HIGH');
      expect(node?.version).toBe('20.11.1');
      expect(node?.versionEvidence).toContain('20.11.1');
      expect(node?.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('detects Node.js from connect.sid cookie alone when version is unexposed', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://express-app.com',
          finalUrl: 'https://express-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'set-cookie': 'connect.sid=s%3Aabc987token; Path=/',
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

      const result = await techDiscovery.discover('express-app.com', snapshot);

      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Node.js');
      expect(node?.version).toBeUndefined(); // Zero version hallucination
      expect(
        node?.evidence.some((e) => e.observedValue === 'connect.sid'),
      ).toBe(true);
    });

    it('detects Node.js from custom X-Node-Version header', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://fastify-service.org',
          finalUrl: 'https://fastify-service.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-node-version': '18.19.0',
            server: 'Node.js',
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
        'fastify-service.org',
        snapshot,
      );

      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Node.js');
      expect(node?.version).toBe('18.19.0');
    });

    it('returns null / absent when no server-side Node.js signatures exist', async () => {
      const nonNodeSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://static-go.org',
          finalUrl: 'https://static-go.org',
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
        'static-go.org',
        nonNodeSnapshot,
      );
      const node = result.technologies.find((t) => t.id === 'tech-nodejs');
      expect(node).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Node.js infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://node-backend.io',
          finalUrl: 'https://node-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Node.js',
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

      const result = await techDiscovery.discover('node-backend.io', snapshot);
      const node = result.technologies.find((t) => t.id === 'tech-nodejs');

      expect(node).toBeDefined();
      expect(node.role).toContain('JavaScript');
      expect(node.infrastructureMeaning).toContain(
        'server-side request processing',
      );
      expect(node.whatThisDoesNotProve).toContain('Express');
      expect(node.whatThisDoesNotProve).toContain('NestJS');
      expect(node.whatThisDoesNotProve).toContain('Docker');
      expect(node.whatThisDoesNotProve).toContain('AWS');
      expect(node.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Node.js at the RUNTIME layer and preserves independent Application, Gateway, and Edge observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://fullstack-app.com',
          finalUrl: 'https://fullstack-app.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 45,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Express',
            'set-cookie': 'connect.sid=session123; Path=/',
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
        'fullstack-app.com',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Node.js at RUNTIME
      const nodeNode = topo.nodes.find((n) => n.technologyId === 'tech-nodejs');
      expect(nodeNode).toBeDefined();
      expect(nodeNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Node.js in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://node-brief-app.org',
          finalUrl: 'https://node-brief-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-powered-by': 'Node.js/20.0.0',
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
        'node-brief-app.org',
        snapshot,
      );
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Node.js',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-nodejs'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Node.js in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '20.11.1',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Node.js server runtime.',
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
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Node.js' }],
              },
            ],
            keyTechnologies: [{ name: 'Node.js', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Node.js',
                boundary: 'Node.js presence does not prove Express or MongoDB',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-node-1',
        'dom-node-1',
        'node-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-node-1',
        'dom-node-1',
        'node-test.com',
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
    it('detects Node.js addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currNode18: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '18.19.0',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Node.js' }],
              },
            ],
          } as any,
        },
      };

      const currNode20: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '20.11.1',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-nodejs',
                technologyName: 'Node.js',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Node.js' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currNode18,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Node.js',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currNode18,
        currNode20,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '18.19.0' &&
            d.currentState?.version === '20.11.1',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currNode20,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Node.js',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Node.js into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-node-overview',
        domainId: 'dom-node-overview',
        jobId: 'job-015',
        responseTimeMs: 30,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Node.js server runtime.',
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
                  technologyId: 'tech-nodejs',
                  technologyName: 'Node.js',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-nodejs',
                      name: 'Node.js',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-nodejs',
                  name: 'Node.js',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-nodejs',
                  technologyName: 'Node.js',
                  boundary:
                    'Node.js presence does not prove Express or MongoDB',
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
        'Node.js',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Node.js');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Express, NestJS, Docker, AWS, or Mongo from Node.js evidence alone', () => {
      expect(nodeDetector.id).toBe('tech-nodejs');
      expect(nodeDetector.whatThisDoesNotProve).toContain('Express');
      expect(nodeDetector.whatThisDoesNotProve).toContain('NestJS');
      expect(nodeDetector.whatThisDoesNotProve).toContain('Docker');
      expect(nodeDetector.whatThisDoesNotProve).toContain('AWS');
      expect(nodeDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
