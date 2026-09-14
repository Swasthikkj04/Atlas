import { Test, TestingModule } from '@nestjs/testing';
import { TemporalDeltaEngineService } from './temporal-delta-engine.service';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { TopologyLayer } from '../../../infrastructure/discovery/technology/contracts';

describe('TemporalDeltaEngineService (T23 — Infrastructure Drift & Change Forensics)', () => {
  let service: TemporalDeltaEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporalDeltaEngineService],
    }).compile();

    service = module.get<TemporalDeltaEngineService>(
      TemporalDeltaEngineService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('T23.1 & T23.10: Re-understanding & Baseline Boundaries', () => {
    it('returns calm zero-change quiet state when no previous snapshot exists', () => {
      const current: DiscoverySnapshot = {
        domain: 'example.com',
        timestamp: new Date().toISOString(),
        dns: {
          a: ['93.184.216.34'],
          aaaa: [],
          mx: [],
          txt: [],
          ns: [],
          cname: [],
        },
        http: { statusCode: 200, headers: { server: 'nginx/1.24.0' } },
        ssl: { authorized: true, certificate: { issuer: "Let's Encrypt" } },
      } as any;

      const result = service.computeTemporalDelta('domain-1', null, current);

      expect(result.hasMeaningfulChanges).toBe(false);
      expect(result.totalChangesCount).toBe(0);
      expect(result.events).toHaveLength(0);
      expect(result.attentionRequiredCount).toBe(0);
    });

    it('returns calm quiet state when re-understanding domain without meaningful changes', () => {
      const previous: DiscoverySnapshot = {
        domain: 'example.com',
        timestamp: '2026-08-27T10:00:00Z',
        dns: {
          a: ['93.184.216.34'],
          aaaa: [],
          mx: [],
          txt: [],
          ns: [],
          cname: [],
        },
        http: { statusCode: 200, headers: { server: 'nginx/1.24.0' } },
        ssl: { authorized: true, certificate: { issuer: "Let's Encrypt" } },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'example.com',
        timestamp: '2026-08-28T10:00:00Z',
        dns: {
          a: ['93.184.216.34'],
          aaaa: [],
          mx: [],
          txt: [],
          ns: [],
          cname: [],
        },
        http: { statusCode: 200, headers: { server: 'nginx/1.24.0' } },
        ssl: { authorized: true, certificate: { issuer: "Let's Encrypt" } },
      } as any;

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(false);
      expect(result.totalChangesCount).toBe(0);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('T23.3: Ephemeral Noise Suppression', () => {
    it('suppresses Date, CF-Ray, X-Request-ID, and ETag fluctuations without generating changes', () => {
      const previous: DiscoverySnapshot = {
        domain: 'example.com',
        timestamp: '2026-08-27T10:00:00Z',
        http: {
          statusCode: 200,
          headers: {
            date: 'Thu, 27 Aug 2026 10:00:00 GMT',
            'cf-ray': '890123456-IAD',
            'x-request-id': 'req-abc-123',
            etag: 'W/"123456"',
            server: 'cloudflare',
          },
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'example.com',
        timestamp: '2026-08-28T10:00:00Z',
        http: {
          statusCode: 200,
          headers: {
            date: 'Fri, 28 Aug 2026 10:00:00 GMT',
            'cf-ray': '990765432-SJC',
            'x-request-id': 'req-xyz-789',
            etag: 'W/"654321"',
            server: 'cloudflare',
          },
        },
      } as any;

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(false);
      expect(result.totalChangesCount).toBe(0);
      expect(result.suppressedNoiseCount).toBe(4);
    });
  });

  describe('T23.2 & T23.5: Technology Lifecycle & Forensic Explanation', () => {
    it('detects runtime version update (MODIFIED) with 6-part forensic explanation', () => {
      const previous: DiscoverySnapshot = {
        domain: 'app.example.com',
        technology: {
          technologies: [
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
        domain: 'app.example.com',
        technology: {
          technologies: [
            {
              id: 'tech-nodejs',
              name: 'Node.js',
              version: '22.14.0',
              category: 'Runtime',
            },
          ],
        },
      } as any;

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(true);
      expect(result.totalChangesCount).toBe(1);

      const event = result.events[0];
      expect(event.state).toBe('MODIFIED');
      expect(event.significance).toBe('NOTABLE');
      expect(event.title).toBe('Node.js runtime changed: 20.11.1 → 22.14.0');

      // T23.5 Forensic Explanation Structure
      expect(event.explanation.whatChanged).toContain(
        'Node.js runtime changed: 20.11.1 → 22.14.0',
      );
      expect(event.explanation.whyWeBelieveIt).toContain(
        'Current telemetry exposes Node.js 22.14.0',
      );
      expect(event.explanation.whatItMeans).toContain(
        'server-side runtime boundary changed',
      );
      expect(event.explanation.whatWeCannotConclude).toContain(
        'does not establish why the upgrade occurred',
      );
      expect(event.explanation.impact).toContain(
        'No architectural regression observed',
      );
      expect(event.explanation.attention).toBe('No action required.');
      expect(event.explanation.attentionRequired).toBe(false);
    });

    it('detects unobserved technology (REMOVED) with anti-overreach language', () => {
      const previous: DiscoverySnapshot = {
        domain: 'app.example.com',
        technology: {
          technologies: [
            { id: 'tech-apache', name: 'Apache', category: 'Web Server' },
          ],
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'app.example.com',
        technology: {
          technologies: [],
        },
      };

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(true);
      const event = result.events[0];
      expect(event.state).toBe('REMOVED');
      expect(event.title).toBe('Technology no longer observed: Apache');
      expect(event.summary).toBe(
        'Apache is no longer observable from current public telemetry.',
      );
      expect(event.explanation.whatWeCannotConclude).toContain(
        'does not prove the technology was deleted',
      );
    });
  });

  describe('T23.4: Significance Engine & Security Regressions', () => {
    it('classifies HSTS header removal as CRITICAL with attention required', () => {
      const previous: DiscoverySnapshot = {
        domain: 'secure.example.com',
        http: {
          headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
          },
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'secure.example.com',
        http: {
          headers: {},
        },
      } as any;

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(true);
      expect(result.changesBySignificance.critical).toBe(1);
      expect(result.attentionRequiredCount).toBe(1);

      const event = result.events[0];
      expect(event.significance).toBe('CRITICAL');
      expect(event.explanation.attentionRequired).toBe(true);
      expect(event.explanation.attention).toContain('Action required');
    });
  });

  describe('T23.6: Multi-Layer Blast Radius & Forensic Grouping', () => {
    it('groups correlated Gateway server change and TLS certificate issuer update into unified forensic event', () => {
      const previous: DiscoverySnapshot = {
        domain: 'gateway.example.com',
        http: {
          headers: {
            server: 'nginx/1.24.0',
          },
        },
        ssl: {
          certificate: {
            issuer: "Let's Encrypt Authority X3",
          },
        },
      } as any;

      const current: DiscoverySnapshot = {
        domain: 'gateway.example.com',
        http: {
          headers: {
            server: 'cloudflare',
          },
        },
        ssl: {
          certificate: {
            issuer: 'Cloudflare Inc ECC CA-3',
          },
        },
      } as any;

      const result = service.computeTemporalDelta(
        'domain-1',
        previous,
        current,
      );

      expect(result.hasMeaningfulChanges).toBe(true);
      expect(result.events).toHaveLength(1);

      const groupedEvent = result.events[0];
      expect(groupedEvent.title).toBe('Gateway & TLS configuration changed');
      expect(groupedEvent.blastRadiusLayers).toContain(TopologyLayer.GATEWAY);
      expect(groupedEvent.blastRadiusLayers).toContain(TopologyLayer.EDGE);
      expect(groupedEvent.explanation.whatChanged).toContain(
        'Gateway & TLS security boundary updated together',
      );
    });
  });
});
