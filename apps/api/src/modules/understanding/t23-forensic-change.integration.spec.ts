import { Test, TestingModule } from '@nestjs/testing';
import { DiscoverySnapshot } from '../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../infrastructure/discovery/technology/contracts';
import { TemporalDeltaEngineService } from './services/temporal-delta-engine.service';
import { UnderstandingModule } from './understanding.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('T23 — Infrastructure Drift & Change Forensics (End-to-End Integration)', () => {
  let module: TestingModule;
  let temporalDeltaEngine: TemporalDeltaEngineService;

  const mockPrismaService = {
    changeHistory: {
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    domain: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    infrastructureSnapshot: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [UnderstandingModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    temporalDeltaEngine = module.get<TemporalDeltaEngineService>(
      TemporalDeltaEngineService,
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Invariant 1: Re-understanding & Calm Experience', () => {
    it('produces calm quiet state when consecutive understandings observe unchanged infrastructure', () => {
      const baseline: DiscoverySnapshot = {
        domain: 'atlas-cloud.io',
        timestamp: '2026-08-28T10:00:00Z',
        http: {
          statusCode: 200,
          headers: {
            server: 'nginx/1.24.0',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
          },
        },
        ssl: {
          authorized: true,
          certificate: { issuer: "Let's Encrypt Authority X3" },
        },
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web Server',
            },
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              version: '20.11.1',
              category: 'Runtime',
            },
          ],
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'atlas-cloud.io',
        timestamp: '2026-08-28T12:00:00Z',
        http: {
          statusCode: 200,
          headers: {
            server: 'nginx/1.24.0',
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            date: 'Fri, 28 Aug 2026 12:00:00 GMT',
            'cf-ray': '993883712-IAD',
            'x-request-id': 'req-987-xyz',
          },
        },
        ssl: {
          authorized: true,
          certificate: { issuer: "Let's Encrypt Authority X3" },
        },
        technology: {
          technologies: [
            {
              id: 'tech-nginx',
              name: 'NGINX',
              version: '1.24.0',
              category: 'Web Server',
            },
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              version: '20.11.1',
              category: 'Runtime',
            },
          ],
        },
      } as any;

      const delta = temporalDeltaEngine.computeTemporalDelta(
        'domain-atlas',
        baseline,
        current,
        'snap-baseline',
        'snap-current',
      );

      expect(delta.hasMeaningfulChanges).toBe(false);
      expect(delta.totalChangesCount).toBe(0);
      expect(delta.events).toHaveLength(0);
      expect(delta.suppressedNoiseCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Invariant 2: Multi-Layer Correlated Grouping & Blast Radius', () => {
    it('correlates gateway shift + TLS certificate authority change into a single coherent forensic event', () => {
      const baseline: DiscoverySnapshot = {
        domain: 'api.enterprise.com',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        },
        ssl: {
          authorized: true,
          certificate: { issuer: "Let's Encrypt Authority X3" },
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'api.enterprise.com',
        http: {
          headers: {
            server: 'cloudflare',
          },
        },
        ssl: {
          authorized: true,
          certificate: { issuer: 'Cloudflare Inc ECC CA-3' },
        },
      } as any;

      const delta = temporalDeltaEngine.computeTemporalDelta(
        'domain-enterprise',
        baseline,
        current,
        'snap-base',
        'snap-curr',
      );

      expect(delta.hasMeaningfulChanges).toBe(true);
      expect(delta.events).toHaveLength(1);

      const event = delta.events[0];
      expect(event.title).toBe('Gateway & TLS configuration changed');
      expect(event.blastRadiusLayers).toContain(TopologyLayer.GATEWAY);
      expect(event.blastRadiusLayers).toContain(TopologyLayer.EDGE);
      expect(event.significance).toBe('IMPORTANT');
      expect(event.explanation.whatItMeans).toContain(
        'ingress delivery pipeline underwent coordinated configuration',
      );
    });
  });

  describe('Invariant 3: Anti-Overreach Language & Factual Boundaries', () => {
    it('strictly expresses unobserved technologies with conservative anti-overreach language', () => {
      const baseline: DiscoverySnapshot = {
        domain: 'app.service.com',
        technology: {
          technologies: [
            { id: 'tech-express', name: 'Express', category: 'Framework' },
          ],
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'app.service.com',
        technology: {
          technologies: [],
        },
      };

      const delta = temporalDeltaEngine.computeTemporalDelta(
        'domain-app',
        baseline,
        current,
        'snap-1',
        'snap-2',
      );

      expect(delta.hasMeaningfulChanges).toBe(true);
      const event = delta.events[0];
      expect(event.state).toBe('REMOVED');
      expect(event.summary).toContain(
        'is no longer observable from current public telemetry',
      );
      expect(event.summary).not.toContain('was removed');
      expect(event.summary).not.toContain('was deleted');
      expect(event.explanation.whatWeCannotConclude).toContain(
        'does not prove the technology was deleted internally',
      );
    });
  });

  describe('Invariant 4: Critical Security Regressions & Actionability', () => {
    it('flags HSTS removal as CRITICAL requiring explicit user attention', () => {
      const baseline: DiscoverySnapshot = {
        domain: 'bank.secure.com',
        http: {
          headers: {
            'strict-transport-security':
              'max-age=63072000; includeSubDomains; preload',
          },
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'bank.secure.com',
        http: {
          headers: {},
        },
      } as any;

      const delta = temporalDeltaEngine.computeTemporalDelta(
        'domain-bank',
        baseline,
        current,
        'snap-1',
        'snap-2',
      );

      expect(delta.hasMeaningfulChanges).toBe(true);
      expect(delta.changesBySignificance.critical).toBe(1);
      expect(delta.attentionRequiredCount).toBe(1);

      const event = delta.events[0];
      expect(event.significance).toBe('CRITICAL');
      expect(event.explanation.attentionRequired).toBe(true);
      expect(event.explanation.attention).toContain('Action required:');
      expect(event.explanation.impact).toContain(
        'Critical security regression',
      );
    });
  });
});
