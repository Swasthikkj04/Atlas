import { ProviderAttributionService } from './provider-attribution.service';
import type { DiscoverySnapshot } from '../../discovery/contracts/discovery-snapshot.interface';

describe('WX-1022: Authoritative Provider Attribution Truth Audit', () => {
  let service: ProviderAttributionService;

  beforeEach(() => {
    service = new ProviderAttributionService();
  });

  describe('1. Dedicated Platform Attribution', () => {
    it('accurately confirms Replit deployment via correlated CNAME and HTTP headers', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.102.136.180'],
          cname: ['my-app.replit.app'],
          ns: ['ns1.google.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 80,
          headers: {
            'x-replit-user': 'user123',
            'x-replit-app': 'my-app',
            server: 'ReplitEdge',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.provider).toBe('Replit');
      expect(result.hosting.decision).toBe('CONFIRMED');
      expect(result.hosting.confidence).toBe('HIGH');
      expect(result.hosting.conflicts).toHaveLength(0);
      expect(result.hosting.signals.length).toBeGreaterThanOrEqual(2);
    });

    it('accurately confirms Vercel deployment via Anycast IP, CNAME, and headers', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['76.76.21.21'],
          cname: ['cname.vercel-dns.com'],
          ns: ['ns1.vercel-dns.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 60,
          headers: {
            'x-vercel-id': 'iad1::iad1::xyz',
            server: 'Vercel',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.provider).toBe('Vercel');
      expect(result.hosting.decision).toBe('CONFIRMED');
      expect(result.hosting.confidence).toBe('HIGH');
      expect(result.dns.provider).toBe('Vercel DNS');
      expect(result.edgeCdn.provider).toBe('Vercel Edge Network');
    });
  });

  describe('2. Separation of Roles (Hosting != Edge != DNS)', () => {
    it('accurately distinguishes Cloudflare Edge + Cloudflare DNS from Replit Origin Hosting', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['104.21.50.10'],
          cname: ['my-project.replit.dev'],
          ns: ['alfa.ns.cloudflare.com', 'bravo.ns.cloudflare.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 90,
          headers: {
            'cf-ray': '89a123bc-iad',
            server: 'cloudflare',
            'x-replit-user': 'creator',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      // Edge CDN must be Cloudflare
      expect(result.edgeCdn.provider).toBe('Cloudflare');
      expect(result.edgeCdn.decision).toBe('CONFIRMED');

      // DNS must be Cloudflare
      expect(result.dns.provider).toBe('Cloudflare');
      expect(result.dns.decision).toBe('CONFIRMED');

      // Origin Hosting must be Replit (NOT Cloudflare!)
      expect(result.hosting.provider).toBe('Replit');
      expect(result.hosting.decision).toBe('CONFIRMED');
      expect(result.hosting.confidence).toBe('HIGH');
    });

    it('prohibits DNS provider alone from being inferred as hosting provider', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['1.2.3.4'],
          ns: ['ns-1.awsdns-01.com', 'ns-2.awsdns-02.org'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 100,
          headers: {
            server: 'nginx/1.18.0',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.dns.provider).toBe('AWS Route53');
      expect(result.hosting.provider).toBeNull();
      expect(result.hosting.decision).toBe('UNKNOWN');
      expect(result.hosting.confidence).toBe('LOW');
    });

    it('prohibits technology framework (Next.js) alone from inferring Vercel hosting', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['192.0.2.1'],
          ns: ['ns1.example.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 120,
          headers: {
            'x-powered-by': 'Next.js',
            server: 'nginx',
          },
        },
        technology: {
          technologies: [{ name: 'Next.js', category: 'FRAMEWORK', confidence: 1.0 }],
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.application.provider).toBe('Next.js');
      expect(result.webServer.provider).toBe('nginx');
      // Hosting must NOT be guessed as Vercel!
      expect(result.hosting.provider).toBeNull();
      expect(result.hosting.decision).toBe('UNKNOWN');
    });
  });

  describe('3. Multi-Signal Conflict Detection', () => {
    it('produces CONFLICTED and INCONCLUSIVE when signals point to competing providers (Replit DNS vs Vercel Server header)', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['34.102.136.180'],
          cname: ['my-app.replit.app'],
          ns: ['ns1.google.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 100,
          headers: {
            server: 'Vercel',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.decision).toBe('CONFLICTED');
      expect(result.hosting.confidence).toBe('INCONCLUSIVE');
      expect(result.hosting.provider).toBeNull();
      expect(result.hosting.conflicts.length).toBeGreaterThanOrEqual(1);
      expect(result.hosting.explanation).toContain('inconclusive');
    });
  });

  describe('4. Insufficient Telemetry Handling', () => {
    it('returns UNKNOWN with calm explanation when no provider fingerprints match', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['93.184.216.34'],
          ns: [],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          status: 200,
          statusCode: 200,
          responseTimeMs: 150,
          headers: {},
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.decision).toBe('UNKNOWN');
      expect(result.hosting.confidence).toBe('LOW');
      expect(result.hosting.provider).toBeNull();
      expect(result.hosting.explanation).toContain('could not be established');
    });
  });

  describe('5. Enterprise, Banking & Hardened Infrastructure Attribution', () => {
    it('accurately attributes Enterprise Datacenter and Hardened Web Server for banking domains (hdfc.bank.in pattern)', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['175.100.168.20'],
          cname: ['hdfc.bank.in'],
          ns: ['ns1.hdfcbank.com', 'ns2.hdfcbank.com'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          status: 200,
          statusCode: 200,
          responseTimeMs: 95,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            // Server header intentionally suppressed for security hardening
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.provider).toBe('Enterprise / Dedicated Datacenter');
      expect(result.hosting.decision).toBe('STRONGLY_INFERRED');
      expect(result.hosting.confidence).toBe('HIGH');
      expect(result.webServer.provider).toBe('Custom / Hardened Web Server');
      expect(result.webServer.decision).toBe('CONFIRMED');
    });

    it('accurately attributes Akamai Connected Cloud & Edge distribution', () => {
      const snapshot: DiscoverySnapshot = {
        dns: {
          a: ['23.200.10.50'],
          cname: ['e1234.dscg.akamaiedge.net'],
          ns: ['a1-123.akam.net'],
          aaaa: [],
          mx: [],
          txt: [],
          dmarc: [],
        },
        http: {
          reachable: true,
          status: 200,
          statusCode: 200,
          responseTimeMs: 40,
          headers: {
            server: 'AkamaiGHost',
            'x-akamai-transformed': '9 - 0 pmb=mRUM,1',
          },
        },
      };

      const result = service.attributeInfrastructure(snapshot);

      expect(result.hosting.provider).toBe('Akamai Connected Cloud');
      expect(result.edgeCdn.provider).toBe('Akamai Edge Network');
      expect(result.edgeCdn.decision).toBe('CONFIRMED');
      expect(result.dns.provider).toBe('Akamai Edge DNS');
      expect(result.webServer.provider).toBe('AkamaiGHost');
    });
  });
});

