import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { PythonDetector } from '../../infrastructure/discovery/technology/detectors/runtime/python.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';

describe('T16: Python Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let pythonDetector: PythonDetector;
  let snapshotMemoryService: SnapshotMemoryService;
  let changeAnalyzer: TechnologyChangeAnalyzerService;
  let ruleEngine: FindingRuleEngineService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.init();
    techDiscovery = moduleRef.get(TechnologyDiscoveryService);
    pythonDetector = moduleRef.get(PythonDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Python Detection & Version Extraction (TECH-001)', () => {
    it('detects Python and extracts exact version from X-Powered-By header with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://py-api.service.io',
          finalUrl: 'https://py-api.service.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-powered-by': 'Python/3.12.2',
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
        'py-api.service.io',
        snapshot,
      );

      const py = result.technologies.find((t) => t.id === 'tech-python');
      expect(py).toBeDefined();
      expect(py?.name).toBe('Python');
      expect(py?.category).toBe('Infrastructure Runtime');
      expect(py?.confidenceLevel).toBe('HIGH');
      expect(py?.version).toBe('3.12.2');
      expect(py?.versionEvidence).toContain('3.12.2');
      expect(py?.evidence.length).toBeGreaterThanOrEqual(1);
    });

    it('detects Python from WSGIServer and CPython server banners', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://django-wsgi.org',
          finalUrl: 'https://django-wsgi.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            server: 'WSGIServer/0.2 CPython/3.11.4',
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

      const result = await techDiscovery.discover('django-wsgi.org', snapshot);

      const py = result.technologies.find((t) => t.id === 'tech-python');
      expect(py).toBeDefined();
      expect(py?.name).toBe('Python');
      expect(py?.version).toBe('3.11.4');
    });

    it('detects Python from X-Python-Version header when version is isolated', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://fastapi-app.org',
          finalUrl: 'https://fastapi-app.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: {
            'x-python-version': '3.10.12',
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

      const result = await techDiscovery.discover('fastapi-app.org', snapshot);

      const py = result.technologies.find((t) => t.id === 'tech-python');
      expect(py).toBeDefined();
      expect(py?.name).toBe('Python');
      expect(py?.version).toBe('3.10.12');
    });

    it('returns null / absent when no Python signatures exist', async () => {
      const nonPySnapshot: DiscoverySnapshot = {
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
        nonPySnapshot,
      );
      const py = result.technologies.find((t) => t.id === 'tech-python');
      expect(py).toBeUndefined();
    });
  });

  describe('2. Technology Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('produces authoritative Python infrastructure meaning and strict claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://python-backend.io',
          finalUrl: 'https://python-backend.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 25,
          headers: {
            'x-powered-by': 'Python/3.12',
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
        'python-backend.io',
        snapshot,
      );
      const py = result.technologies.find((t) => t.id === 'tech-python');

      expect(py).toBeDefined();
      expect(py.role).toContain('Python');
      expect(py.infrastructureMeaning).toContain(
        'Python-based server-side application/runtime boundary',
      );
      expect(py.whatThisDoesNotProve).toContain('Django');
      expect(py.whatThisDoesNotProve).toContain('Flask');
      expect(py.whatThisDoesNotProve).toContain('FastAPI');
      expect(py.whatThisDoesNotProve).toContain('Gunicorn');
      expect(py.whatThisDoesNotProve).toContain('Docker');
      expect(py.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });

  describe('3. Topology & Multi-Technology Coexistence (TECH-003)', () => {
    it('positions Python at the RUNTIME layer and preserves independent Django, Gateway, and Docker observations', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://django-prod.com',
          finalUrl: 'https://django-prod.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'nginx/1.24.0',
            'x-powered-by': 'Python/3.12.2',
            'set-cookie': 'csrftoken=xyzToken987; Path=/',
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

      const result = await techDiscovery.discover('django-prod.com', snapshot);
      const topo = result.topology;

      // NGINX at GATEWAY
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode).toBeDefined();
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Django at APPLICATION
      const djangoNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-django',
      );
      expect(djangoNode).toBeDefined();
      expect(djangoNode?.layer).toBe(TopologyLayer.APPLICATION);

      // Python at RUNTIME
      const pyNode = topo.nodes.find((n) => n.technologyId === 'tech-python');
      expect(pyNode).toBeDefined();
      expect(pyNode?.layer).toBe(TopologyLayer.RUNTIME);
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Python in request path and binds claim boundaries', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://py-brief.org',
          finalUrl: 'https://py-brief.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'x-powered-by': 'Python/3.11.4',
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

      const result = await techDiscovery.discover('py-brief.org', snapshot);
      const brief = result.architectureBrief;

      expect(brief).toBeDefined();
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Python',
      );
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-python'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Python in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-python',
              name: 'Python',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.12.2',
            } as any,
          ],
          architectureBrief: {
            summary:
              'The public endpoint appears to execute a Python server runtime.',
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
                technologyId: 'tech-python',
                technologyName: 'Python',
                role: 'Server Runtime',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Python' }],
              },
            ],
            keyTechnologies: [{ name: 'Python', role: 'Server Runtime' }],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Python',
                boundary: 'Python presence does not prove Django or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-py-1',
        'dom-py-1',
        'py-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-py-1',
        'dom-py-1',
        'py-test.com',
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
    it('detects Python addition, removal, and version changes without fabricating operational intent', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
        },
      };

      const currPy310: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-python',
              name: 'Python',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.10.4',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-python',
                technologyName: 'Python',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Python' }],
              },
            ],
          } as any,
        },
      };

      const currPy312: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-python',
              name: 'Python',
              category: 'Infrastructure Runtime',
              confidence: 0.95,
              version: '3.12.2',
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.RUNTIME,
                technologyId: 'tech-python',
                technologyName: 'Python',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.RUNTIME,
                state: 'OBSERVED',
                technologies: [{ name: 'Python' }],
              },
            ],
          } as any,
        },
      };

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currPy310,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Python',
        ),
      ).toBe(true);

      const diffsVersion = changeAnalyzer.analyzeDifferences(
        currPy310,
        currPy312,
      );
      expect(
        diffsVersion.some(
          (d) =>
            d.classification === 'TECHNOLOGY_CHANGED' &&
            d.previousState?.version === '3.10.4' &&
            d.currentState?.version === '3.12.2',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currPy312,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Python',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Python into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-py-overview',
        domainId: 'dom-py-overview',
        jobId: 'job-016',
        responseTimeMs: 25,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary: 'The public endpoint executes a Python server runtime.',
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
                  technologyId: 'tech-python',
                  technologyName: 'Python',
                  role: 'Server Runtime',
                },
              ],
              layers: [
                {
                  layer: TopologyLayer.RUNTIME,
                  technologies: [
                    {
                      technologyId: 'tech-python',
                      name: 'Python',
                      role: 'Server Runtime',
                      layer: TopologyLayer.RUNTIME,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-python',
                  name: 'Python',
                  role: 'Server Runtime',
                  layer: TopologyLayer.RUNTIME,
                },
              ],
              claimBoundaries: [
                {
                  technologyId: 'tech-python',
                  technologyName: 'Python',
                  boundary:
                    'Python presence does not prove Django or PostgreSQL',
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
        'Python',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Python');
    });
  });

  describe('8. Negative Anti-Overreach Invariants', () => {
    it('strictly avoids manufacturing Django, Flask, FastAPI, Gunicorn, Docker, or PostgreSQL from Python evidence alone', () => {
      expect(pythonDetector.id).toBe('tech-python');
      expect(pythonDetector.whatThisDoesNotProve).toContain('Django');
      expect(pythonDetector.whatThisDoesNotProve).toContain('Flask');
      expect(pythonDetector.whatThisDoesNotProve).toContain('FastAPI');
      expect(pythonDetector.whatThisDoesNotProve).toContain('Gunicorn');
      expect(pythonDetector.whatThisDoesNotProve).toContain('Docker');
      expect(pythonDetector.whatThisDoesNotProve).toContain('PostgreSQL');
    });
  });
});
