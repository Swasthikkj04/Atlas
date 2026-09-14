import {
  isPrivateOrRestrictedIp,
  isRestrictedHostname,
  verifyDnsAndSsrfSafety,
  validateProbeUrl,
} from './ssrf-guard';
import * as dns from 'node:dns/promises';

jest.mock('node:dns/promises');
const mockedDns = dns as jest.Mocked<typeof dns>;

describe('SsrfGuard (SSRF Defense Matrix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPrivateOrRestrictedIp', () => {
    it('detects all RFC 1918 private IPv4 ranges', () => {
      // 10.0.0.0/8
      expect(isPrivateOrRestrictedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('10.255.255.255')).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateOrRestrictedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('172.31.255.255')).toBe(true);
      expect(isPrivateOrRestrictedIp('172.15.255.255')).toBe(false); // Public
      expect(isPrivateOrRestrictedIp('172.32.0.0')).toBe(false); // Public

      // 192.168.0.0/16
      expect(isPrivateOrRestrictedIp('192.168.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('192.168.254.254')).toBe(true);
    });

    it('detects loopback addresses (127.0.0.0/8 and ::1)', () => {
      expect(isPrivateOrRestrictedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('127.0.0.100')).toBe(true);
      expect(isPrivateOrRestrictedIp('127.255.255.254')).toBe(true);
      expect(isPrivateOrRestrictedIp('::1')).toBe(true);
      expect(isPrivateOrRestrictedIp('0:0:0:0:0:0:0:1')).toBe(true);
    });

    it('detects cloud metadata and link-local addresses (169.254.0.0/16 and fe80::/10)', () => {
      expect(isPrivateOrRestrictedIp('169.254.169.254')).toBe(true); // AWS / GCP metadata
      expect(isPrivateOrRestrictedIp('169.254.1.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('fe80::1')).toBe(true);
      expect(isPrivateOrRestrictedIp('feb0::1234')).toBe(true);
    });

    it('detects Carrier-Grade NAT / Shared Space (100.64.0.0/10)', () => {
      expect(isPrivateOrRestrictedIp('100.64.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('100.127.255.254')).toBe(true);
      expect(isPrivateOrRestrictedIp('100.63.255.255')).toBe(false); // Public
      expect(isPrivateOrRestrictedIp('100.128.0.1')).toBe(false); // Public
    });

    it('detects Multicast and Reserved Future Use (224.0.0.0/4 and 240.0.0.0/4)', () => {
      expect(isPrivateOrRestrictedIp('224.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('239.255.255.255')).toBe(true);
      expect(isPrivateOrRestrictedIp('240.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('255.255.255.255')).toBe(true);
    });

    it('detects IPv4-mapped IPv6 restricted addresses', () => {
      expect(isPrivateOrRestrictedIp('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('::ffff:169.254.169.254')).toBe(true);
      expect(isPrivateOrRestrictedIp('::ffff:10.0.0.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('::ffff:192.168.1.1')).toBe(true);
      expect(isPrivateOrRestrictedIp('::ffff:8.8.8.8')).toBe(false);
    });

    it('detects Unique Local IPv6 (fc00::/7)', () => {
      expect(isPrivateOrRestrictedIp('fc00::1')).toBe(true);
      expect(isPrivateOrRestrictedIp('fd00::dead:beef')).toBe(true);
    });

    it('allows valid public IP addresses', () => {
      expect(isPrivateOrRestrictedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrRestrictedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrRestrictedIp('93.184.216.34')).toBe(false); // example.com
      expect(isPrivateOrRestrictedIp('140.82.121.3')).toBe(false); // github.com
    });
  });

  describe('isRestrictedHostname', () => {
    it('identifies internal and cloud metadata hostnames', () => {
      expect(isRestrictedHostname('localhost')).toBe(true);
      expect(isRestrictedHostname('metadata.google.internal')).toBe(true);
      expect(isRestrictedHostname('instance-data')).toBe(true);
      expect(isRestrictedHostname('kubernetes.default')).toBe(true);
    });

    it('identifies reserved TLD suffixes', () => {
      expect(isRestrictedHostname('test.local')).toBe(true);
      expect(isRestrictedHostname('service.internal')).toBe(true);
      expect(isRestrictedHostname('myhost.lan')).toBe(true);
      expect(isRestrictedHostname('dev.corp')).toBe(true);
      expect(isRestrictedHostname('sample.example')).toBe(true);
      expect(isRestrictedHostname('app.localhost')).toBe(true);
    });

    it('allows valid public hostnames', () => {
      expect(isRestrictedHostname('google.com')).toBe(false);
      expect(isRestrictedHostname('api.stripe.com')).toBe(false);
      expect(isRestrictedHostname('sub.domain.co.uk')).toBe(false);
    });
  });

  describe('verifyDnsAndSsrfSafety', () => {
    it('blocks direct IP addresses', async () => {
      const res = await verifyDnsAndSsrfSafety('127.0.0.1');
      expect(res.isSafe).toBe(false);
      expect(res.reason).toBe('SSRF_PRIVATE_IP');
    });

    it('blocks reserved hostnames', async () => {
      const res = await verifyDnsAndSsrfSafety('metadata.google.internal');
      expect(res.isSafe).toBe(false);
      expect(res.reason).toBe('SSRF_RESERVED_HOSTNAME');
    });

    it('blocks domains that resolve to private IP addresses (DNS rebinding / SSRF)', async () => {
      mockedDns.lookup.mockResolvedValueOnce([
        { address: '127.0.0.1', family: 4 },
      ] as any);

      const res = await verifyDnsAndSsrfSafety('evil-rebind.com');
      expect(res.isSafe).toBe(false);
      expect(res.reason).toBe('SSRF_PRIVATE_IP');
    });

    it('blocks domains resolving to cloud metadata endpoint', async () => {
      mockedDns.lookup.mockResolvedValueOnce([
        { address: '169.254.169.254', family: 4 },
      ] as any);

      const res = await verifyDnsAndSsrfSafety('attacker-metadata.com');
      expect(res.isSafe).toBe(false);
      expect(res.reason).toBe('SSRF_PRIVATE_IP');
    });

    it('allows domains resolving to public IP addresses', async () => {
      mockedDns.lookup.mockResolvedValueOnce([
        { address: '93.184.216.34', family: 4 },
      ] as any);

      const res = await verifyDnsAndSsrfSafety('example.com');
      expect(res.isSafe).toBe(true);
      expect(res.resolvedIps).toEqual(['93.184.216.34']);
    });
  });

  describe('validateProbeUrl', () => {
    it('blocks non-HTTP/HTTPS protocols', async () => {
      const fileRes = await validateProbeUrl('file:///etc/passwd');
      expect(fileRes.isSafe).toBe(false);
      expect(fileRes.reason).toBe('FORBIDDEN_SCHEME');

      const ftpRes = await validateProbeUrl('ftp://example.com/file');
      expect(ftpRes.isSafe).toBe(false);
      expect(ftpRes.reason).toBe('FORBIDDEN_SCHEME');

      const gopherRes = await validateProbeUrl('gopher://127.0.0.1:70');
      expect(gopherRes.isSafe).toBe(false);
      expect(gopherRes.reason).toBe('FORBIDDEN_SCHEME');
    });

    it('blocks URLs targeting private IP directly', async () => {
      const res = await validateProbeUrl(
        'http://169.254.169.254/latest/meta-data/',
      );
      expect(res.isSafe).toBe(false);
      expect(res.reason).toBe('SSRF_PRIVATE_IP');
    });

    it('allows valid public HTTP and HTTPS URLs', async () => {
      mockedDns.lookup.mockResolvedValueOnce([
        { address: '140.82.121.3', family: 4 },
      ] as any);

      const res = await validateProbeUrl('https://github.com/login');
      expect(res.isSafe).toBe(true);
      expect(res.parsedUrl?.hostname).toBe('github.com');
    });
  });
});
