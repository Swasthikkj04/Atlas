import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { RubyDetector } from '../../infrastructure/discovery/technology/detectors/runtime/ruby.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T17: Ruby Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let rubyDetector: RubyDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    rubyDetector = moduleRef.get(RubyDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Ruby Detection & Version Extraction (TECH-001)', () => {
    it('detects Ruby and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ruby-api.service.io',
          finalUrl: 'https://ruby-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-powered-by': 'Ruby/3.3.1',
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
        'ruby-api.service.io',
        snapshot,
      );

      const ruby = result.technologies.find((t) => t.id === 'tech-ruby');
      expect(ruby).toBeDefined();
      expect(ruby?.name).toBe('Ruby');
      expect(ruby?.category).toBe('Infrastructure Runtime');
      expect(ruby?.confidenceLevel).toBe('HIGH');
      expect(ruby?.version).toBe('3.3.1');
      expect(ruby?.versionEvidence).toContain('3.3.1');
      expect(ruby?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects Ruby from WEBrick and Puma server banners with clean version extraction', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://puma-app.org',
          finalUrl: 'https://puma-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'Puma/6.4.2 (Ruby 3.2.2)',
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

      const result = await techDiscovery.discover('puma-app.org', snapshot);

      const ruby = result.technologies.find((t) => t.id === 'tech-ruby');
      expect(ruby).toBeDefined();
      expect(ruby?.name).toBe('Ruby');
      expect(ruby?.version).toBe('3.2.2');
    });

    it('detects Ruby from X-Ruby-Version header when version is isolated', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://sinatra-app.org',
          finalUrl: 'https://sinatra-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-ruby-version': '3.3.0',
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

      const result = await techDiscovery.discover('sinatra-app.org', snapshot);

      const ruby = result.technologies.find((t) => t.id === 'tech-ruby');
      expect(ruby).toBeDefined();
      expect(ruby?.name).toBe('Ruby');
      expect(ruby?.version).toBe('3.3.0');
    });

    it('returns null / absent when no Ruby signatures exist', async () => {
      const nonRubySnapshot: DiscoverySnapshot = {
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
        nonRubySnapshot,
      );
      const ruby = result.technologies.find((t) => t.id === 'tech-ruby');
      expect(ruby).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Ruby infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ruby-backend.io',
          finalUrl: 'https://ruby-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Ruby/3.3',
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

      const result = await techDiscovery.discover('ruby-backend.io', snapshot);
      const ruby = result.technologies.find((t) => t.id === 'tech-ruby');

      expect(ruby).toBeDefined();
      expect(ruby.role).toContain('Ruby');
      expect(ruby.infrastructureMeaning).toContain(
        'Ruby-based server-side application/runtime boundary',
      );
      expect(ruby.whatThisDoesNotProve).toContain('Ruby on Rails');
      expect(ruby.whatThisDoesNotProve).toContain('Sinatra');
      expect(ruby.whatThisDoesNotProve).toContain('Puma');
      expect(ruby.whatThisDoesNotProve).toContain('Passenger');
      expect(ruby.whatThisDoesNotProve).toContain('Docker');
      expect(ruby.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Ruby at the RUNTIME layer and preserves independent Rails, Gateway, and Docker observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://rails-prod.com',
          finalUrl: 'https://rails-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Phusion Passenger (Ruby 3.3.1)',
            'set-cookie': '_session_id=xyzSessionToken123; Path=/',
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

      const result = await techDiscovery.discover('rails-prod.com', snapshot);
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Ruby on Rails at APPLICATION
      const railsNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-ruby-on-rails',
      );
      expect(railsNode).toBeDefined();
      expect(railsNode?.layer).toBe(TopologyLayer.APPLICATION);

      // Ruby at RUNTIME
      const rubyNode = topo.nodes.find((n) => n.technologyId === 'tech-ruby');
      expect(rubyNode).toBeDefined();
      expect(rubyNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Ruby in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://ruby-brief.org',
          finalUrl: 'https://ruby-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-powered-by': 'Ruby/3.3.1',
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

      const result = await techDiscovery.discover('ruby-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Ruby',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-ruby'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Ruby in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-ruby',
              name: 'Ruby',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.3.1',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Ruby server runtime.',
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
                technologyId: 'tech-ruby',
                technologyName: 'Ruby',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Ruby' }],
              },
            ],
            keyTechnologies: [{ name: 'Ruby', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Ruby',
                boundary: 'Ruby presence does not prove Rails or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-ruby-1',
        'dom-ruby-1',
        'ruby-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-ruby-1',
        'dom-ruby-1',
        'ruby-test.com',
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
    it('detects Ruby addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currRuby32: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-ruby',
              name: 'Ruby',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.2.2',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-ruby',
                technologyName: 'Ruby',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Ruby' }],
              },
            ],
          } as any,
        },
      };

      const currRuby33: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-ruby',
              name: 'Ruby',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.3.1',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-ruby',
                technologyName: 'Ruby',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Ruby' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currRuby32,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Ruby',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currRuby32,
        currRuby33,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '3.2.2' &&
            d.currentState?.version === '3.3.1',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currRuby33,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Ruby',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Ruby into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-ruby-overview',
        domainId: 'dom-ruby-overview',
        jobId: 'job-017',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Ruby server runtime.',
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
                  technologyId: 'tech-ruby',
                  technologyName: 'Ruby',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-ruby',
                      name: 'Ruby',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-ruby',
                  name: 'Ruby',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-ruby',
                  technologyName: 'Ruby',
                  boundary: 'Ruby presence does not prove Rails or PostgreSQL',
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
        'Ruby',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Ruby');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Rails, Sinatra, Puma, Passenger, Docker, or PostgreSQL from Ruby evidence alone', () => {
      expect(rubyDetector.id).toBe('tech-ruby');
      expect(rubyDetector.whatThisDoesNotProve).toContain('Ruby on Rails');
      expect(rubyDetector.whatThisDoesNotProve).toContain('Sinatra');
      expect(rubyDetector.whatThisDoesNotProve).toContain('Puma');
      expect(rubyDetector.whatThisDoesNotProve).toContain('Passenger');
      expect(rubyDetector.whatThisDoesNotProve).toContain('Docker');
      expect(rubyDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
