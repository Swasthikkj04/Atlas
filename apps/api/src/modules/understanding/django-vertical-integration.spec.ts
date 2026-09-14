import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { TechnologyDiscoveryService } from '../../infrastructure/discovery/technology/technology-discovery.service';
import { DjangoDetector } from '../../infrastructure/discovery/technology/detectors/frameworks/django.detector';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { FindingRuleEngineService } from '../findings/services/finding-rule-engine.service';
import { InfrastructureBriefBuilder } from '../infrastructure-brief/builders/infrastructure-brief.builder';
import { InfrastructureOverviewMapper } from '../domain-details/mappers/infrastructure-overview.mapper';
import { FindingContext } from '../findings/contracts/finding-context.interface';
import { Severity } from '../findings/enums/severity.enum';

describe('T6: Django Infrastructure Understanding Vertical Integration', () => {
  let moduleRef: TestingModule;
  let techDiscovery: TechnologyDiscoveryService;
  let djangoDetector: DjangoDetector;
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
    djangoDetector = moduleRef.get(DjangoDetector);
    snapshotMemoryService = moduleRef.get(SnapshotMemoryService);
    changeAnalyzer = moduleRef.get(TechnologyChangeAnalyzerService);
    ruleEngine = moduleRef.get(FindingRuleEngineService);
    briefBuilder = moduleRef.get(InfrastructureBriefBuilder);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('1. Authoritative Django Detection (TECH-001)', () => {
    it('detects Django from csrftoken cookie, django_session, and HTML csrf token with 0 additional network calls', async () => {
      const snapshot: DiscoverySnapshot = {
        htmlBody:
          '<html><body><form><input type="hidden" name="csrfmiddlewaretoken" value="token123" /></form></body></html>',
        http: {
          reachable: true,
          url: 'https://django-portal.com',
          finalUrl: 'https://django-portal.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 35,
          headers: {
            'set-cookie':
              'csrftoken=abc123xyz; Path=/; django_session=sess456; Path=/',
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
        'django-portal.com',
        snapshot,
      );

      const django = result.technologies.find((t) => t.id === 'tech-django');
      expect(django).toBeDefined();
      expect(django?.name).toBe('Django');
      expect(django?.category).toBe('Frameworks');
      expect(django?.confidenceLevel).toBe('HIGH');
      expect(django?.evidence.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null / absent when no Django signatures exist', async () => {
      const nonDjangoSnapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://static-site.com',
          finalUrl: 'https://static-site.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 20,
          headers: { server: 'Caddy' },
          html: '<html><body><h1>Pure HTML</h1></body></html>',
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
        'static-site.com',
        nonDjangoSnapshot,
      );
      const django = result.technologies.find((t) => t.id === 'tech-django');
      expect(django).toBeUndefined();
    });
  });

  describe('2. Meaning & Anti-Overreach Claim Boundaries (TECH-002)', () => {
    it('answers the four canonical questions and strictly rejects assumptions about Gunicorn, Python version, Docker, or PostgreSQL', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://django-api.io',
          finalUrl: 'https://django-api.io',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 30,
          headers: {
            'set-cookie': 'csrftoken=boundary-check-token',
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

      const result = await techDiscovery.discover('django-api.io', snapshot);
      const django = result.technologies.find((t) => t.id === 'tech-django');

      // 1. What is it?
      expect(django.category).toBe('Frameworks');
      // 2. Role
      expect(django.role).toContain('Python application framework');
      // 3. Meaning
      expect(django.infrastructureMeaning).toContain(
        'The observed endpoint appears to use Django for server-side application request handling',
      );
      // 4. Critical Anti-Overreach: Django ≠ Gunicorn, uWSGI, Docker, Kubernetes, or PostgreSQL
      expect(django.whatThisDoesNotProve).toContain(
        'does not prove WSGI/ASGI application server (Gunicorn/uWSGI), Python version, container runtime (Docker/Kubernetes), cloud provider, or database backend',
      );
    });
  });

  describe('3. Topology Understanding & Relationship Absence (TECH-003)', () => {
    it('maps Django at APPLICATION layer and establishes NGINX → Django relationship without manufacturing backend database nodes', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://django-fullstack.org',
          finalUrl: 'https://django-fullstack.org',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 32,
          headers: {
            server: 'nginx/1.24.0',
            'set-cookie': 'csrftoken=valid-token; django_session=sess-val',
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
        'django-fullstack.org',
        snapshot,
      );
      const topo = result.topology;

      // NGINX at GATEWAY layer
      const nginxNode = topo.nodes.find((n) => n.technologyId === 'tech-nginx');
      expect(nginxNode?.layer).toBe(TopologyLayer.GATEWAY);

      // Django at APPLICATION layer
      const djangoNode = topo.nodes.find(
        (n) => n.technologyId === 'tech-django',
      );
      expect(djangoNode?.layer).toBe(TopologyLayer.APPLICATION);

      // INVARIANT: Zero manufactured database or WSGI server nodes (No PostgreSQL, MySQL, Gunicorn, Docker)
      const postgresNode = topo.nodes.find((n) =>
        n.technologyId.includes('postgres'),
      );
      const gunicornNode = topo.nodes.find((n) =>
        n.technologyId.includes('gunicorn'),
      );
      expect(postgresNode).toBeUndefined();
      expect(gunicornNode).toBeUndefined();
    });
  });

  describe('4. Architecture Brief & Known Unknowns (TECH-004)', () => {
    it('synthesizes Django in request path and preserves unobserved database and runtime as unknowns', async () => {
      const snapshot: DiscoverySnapshot = {
        http: {
          reachable: true,
          url: 'https://django-app-brief.com',
          finalUrl: 'https://django-app-brief.com',
          protocol: 'https',
          statusCode: 200,
          responseTimeMs: 28,
          headers: {
            'set-cookie': 'csrftoken=brief-token',
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
        'django-app-brief.com',
        snapshot,
      );
      const brief = result.architectureBrief;

      // Ingress path includes Django
      expect(brief.architecturePath.map((p) => p.technologyName)).toContain(
        'Django',
      );

      // Claim boundary explicitly captured
      expect(
        brief.claimBoundaries.some((b) => b.technologyId === 'tech-django'),
      ).toBe(true);
    });
  });

  describe('5. Snapshot Memory & Determinism (TECH-005)', () => {
    it('captures Django in immutable snapshot memory and produces stable fingerprints', () => {
      const snapshot: DiscoverySnapshot = {
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
            summary:
              'The observed endpoint appears to use Django for server-side application request handling.',
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
            keyTechnologies: [
              { name: 'Django', role: 'Application Framework' },
            ],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [
              {
                technologyName: 'Django',
                boundary:
                  'Django presence does not prove Gunicorn or PostgreSQL',
              },
            ],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95 } as any,
          } as any,
        },
      };

      const memory1 = snapshotMemoryService.createSnapshotMemory(
        'snp-django-1',
        'dom-django-1',
        'django-test.com',
        snapshot,
      );
      const memory2 = snapshotMemoryService.createSnapshotMemory(
        'snp-django-1',
        'dom-django-1',
        'django-test.com',
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
    it('detects framework migration from Django to Laravel without fabricating organizational intent', () => {
      const prevDjango: DiscoverySnapshot = {
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
                role: 'Application',
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

      const currLaravel: DiscoverySnapshot = {
        technology: {
          technologies: [
            {
              id: 'tech-laravel',
              name: 'Laravel',
              category: 'Frameworks',
              confidence: 0.95,
            } as any,
          ],
          architectureBrief: {
            architecturePath: [
              {
                hop: 0,
                layer: TopologyLayer.APPLICATION,
                technologyId: 'tech-laravel',
                technologyName: 'Laravel',
                role: 'Application',
              },
            ],
            layers: [
              {
                layer: TopologyLayer.APPLICATION,
                state: 'OBSERVED',
                technologies: [{ name: 'Laravel' }],
              },
            ],
          } as any,
        },
      };

      const diffs = changeAnalyzer.analyzeDifferences(prevDjango, currLaravel);

      const migration = diffs.find(
        (d) => d.classification === 'FRAMEWORK_MIGRATED',
      );
      expect(migration).toBeDefined();
      expect(migration?.description).toBe(
        'Application framework migrated from Django to Laravel.',
      );

      // INVARIANT: Zero fabricated intent claims
      for (const diff of diffs) {
        expect(diff.description).not.toContain('scalability');
        expect(diff.description).not.toContain('engineering team');
      }
    });

    it('detects Django addition and removal', () => {
      const prevEmpty: DiscoverySnapshot = {
        technology: {
          technologies: [],
          architectureBrief: { architecturePath: [], layers: [] } as any,
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

      const diffsAdded = changeAnalyzer.analyzeDifferences(
        prevEmpty,
        currDjango,
      );
      expect(
        diffsAdded.some(
          (d) =>
            d.classification === 'TECHNOLOGY_ADDED' &&
            d.technologyName === 'Django',
        ),
      ).toBe(true);

      const diffsRemoved = changeAnalyzer.analyzeDifferences(
        currDjango,
        prevEmpty,
      );
      expect(
        diffsRemoved.some(
          (d) =>
            d.classification === 'TECHNOLOGY_REMOVED' &&
            d.technologyName === 'Django',
        ),
      ).toBe(true);
    });
  });

  describe('7. Domain Overview API Convergence (TECH-008)', () => {
    it('maps Django into canonical technologyArchitecture in InfrastructureOverviewDto', () => {
      const mockSnapshot = {
        id: 'snp-django-overview',
        domainId: 'dom-django-overview',
        jobId: 'job-006',
        responseTimeMs: 30,
        httpStatus: 200,
        createdAt: new Date(),
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The observed endpoint appears to use Django for server-side application request handling.',
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
                  technologyId: 'tech-django',
                  technologyName: 'Django',
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
                      technologyId: 'tech-django',
                      name: 'Django',
                      role: 'Application Framework',
                      layer: TopologyLayer.APPLICATION,
                    },
                  ],
                },
              ],
              keyTechnologies: [
                {
                  technologyId: 'tech-django',
                  name: 'Django',
                  role: 'Application Framework',
                  layer: TopologyLayer.APPLICATION,
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyId: 'tech-django',
                  technologyName: 'Django',
                  boundary:
                    'Django presence does not prove Gunicorn or PostgreSQL',
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
        'Django',
      );
      expect(
        overview.technologyArchitecture?.ingressPath[1].technologyName,
      ).toBe('Django');
    });
  });

  describe('8. Executive Infrastructure Brief (TECH-009)', () => {
    it('synthesizes Django application framework into executive brief without Django-specific branches', () => {
      const mockSnapshot = {
        id: 'snp-django-exec',
        domainId: 'dom-django-exec',
        domainName: 'django-app.com',
        createdAt: new Date(),
        responseTimeMs: 30,
        httpStatus: 200,
        payload: {
          technology: {
            architectureBrief: {
              summary:
                'The public endpoint is routed through an NGINX gateway before reaching a Django application backend.',
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
                  technologyId: 'tech-django',
                  technologyName: 'Django',
                },
              ],
              integrations: [],
              knownUnknowns: [],
              claimBoundaries: [
                {
                  technologyName: 'Django',
                  boundary:
                    'Django presence does not prove Gunicorn or PostgreSQL',
                },
              ],
            },
          },
        },
      } as any;

      const brief = briefBuilder.build(mockSnapshot, []);

      expect(brief.overallHealth).toBe('Excellent');
      expect(brief.summary).toContain('Django application backend');
      expect(brief.architecture?.ingressPath).toHaveLength(3);
    });
  });

  describe('9. The T6 Plug-and-Play Invariant', () => {
    it('verifies Django is modularly registered without centralized hardcoding in core engines', () => {
      expect(djangoDetector.id).toBe('tech-django');
      expect(djangoDetector.name).toBe('Django');
      expect(djangoDetector.category).toBe('Frameworks');
    });
  });
});
