import { SubdomainDiscoveryService } from './subdomain-discovery.service';
import { SubdomainTakeoverAnalyzerService } from './services/subdomain-takeover-analyzer.service';
import { promises as dns } from 'node:dns';

jest.mock('node:dns', () => ({
  promises: {
    resolve4: jest.fn(),
    resolve6: jest.fn(),
    resolveCname: jest.fn(),
  },
}));

describe('SubdomainDiscoveryService', () => {
  let service: SubdomainDiscoveryService;
  let takeoverAnalyzer: SubdomainTakeoverAnalyzerService;

  beforeEach(() => {
    jest.clearAllMocks();
    takeoverAnalyzer = new SubdomainTakeoverAnalyzerService();
    service = new SubdomainDiscoveryService(takeoverAnalyzer);
  });

  describe('1. Wildcard DNS Detection', () => {
    it('detects wildcard DNS when test host resolves to an IP', async () => {
      (dns.resolve4 as jest.Mock).mockResolvedValue(['203.0.113.50']);

      const ips = await service.detectWildcardDns('wildcard-test.com');
      expect(ips).toEqual(['203.0.113.50']);
    });

    it('returns empty array when test host fails to resolve (standard non-wildcard)', async () => {
      (dns.resolve4 as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));

      const ips = await service.detectWildcardDns('clean-domain.com');
      expect(ips).toEqual([]);
    });
  });

  describe('2. Multi-Source Subdomain Enumeration', () => {
    it('discovers active subdomains and classifies environments', async () => {
      // Mock wildcard probe to return nothing
      (dns.resolve4 as jest.Mock).mockImplementation((host: string) => {
        if (host === 'api.example.com')
          return Promise.resolve(['93.184.216.34']);
        if (host === 'staging.example.com')
          return Promise.resolve(['93.184.216.35']);
        return Promise.reject(new Error('ENOTFOUND'));
      });

      (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));
      (dns.resolveCname as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));

      const result = await service.discoverSubdomains('example.com', {
        extraWordlist: [],
        concurrency: 5,
      });

      expect(result.domain).toBe('example.com');
      expect(result.totalDiscovered).toBe(2);
      expect(result.wildcardDetected).toBe(false);

      const apiSub = result.subdomains.find((s) => s.subdomainPrefix === 'api');
      expect(apiSub).toBeDefined();
      expect(apiSub?.environmentType).toBe('PRODUCTION');
      expect(apiSub?.ipAddresses).toEqual(['93.184.216.34']);

      const stageSub = result.subdomains.find(
        (s) => s.subdomainPrefix === 'staging',
      );
      expect(stageSub).toBeDefined();
      expect(stageSub?.environmentType).toBe('STAGING');

      expect(result.environmentsSummary.PRODUCTION).toBe(1);
      expect(result.environmentsSummary.STAGING).toBe(1);
    });

    it('harvests and probes TLS SAN hostnames', async () => {
      (dns.resolve4 as jest.Mock).mockImplementation((host: string) => {
        if (host === 'admin.example.com')
          return Promise.resolve(['104.21.1.1']);
        return Promise.reject(new Error('ENOTFOUND'));
      });
      (dns.resolve6 as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));
      (dns.resolveCname as jest.Mock).mockRejectedValue(new Error('ENOTFOUND'));

      const result = await service.discoverSubdomains('example.com', {
        sanHostnames: ['admin.example.com', 'unrelated.other.com'],
      });

      const adminSub = result.subdomains.find(
        (s) => s.hostname === 'admin.example.com',
      );
      expect(adminSub).toBeDefined();
      expect(adminSub?.environmentType).toBe('INTERNAL');
    });
  });
});
