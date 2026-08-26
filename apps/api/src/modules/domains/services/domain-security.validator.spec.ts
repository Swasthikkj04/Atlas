import { DomainSecurityValidator } from './domain-security.validator';

describe('DomainSecurityValidator (WX-813: Syntax & SSRF Protection)', () => {
  let validator: DomainSecurityValidator;

  beforeEach(() => {
    validator = new DomainSecurityValidator();
  });

  describe('1. Normalization & Syntax Validation', () => {
    it('normalizes domains by removing protocols, paths, ports, and whitespace', () => {
      const inputs = [
        {
          raw: '  HTTPS://Stripe.COM/dashboard/overview  ',
          expected: 'stripe.com',
        },
        { raw: 'http://api.github.com:8080/v1', expected: 'api.github.com' },
        { raw: 'Example.Org.', expected: 'example.org' },
        { raw: 'sub-domain.app.dev', expected: 'sub-domain.app.dev' },
      ];

      for (const item of inputs) {
        const result = validator.normalizeAndValidateSyntax(item.raw);
        expect(result.isValid).toBe(true);
        expect(result.normalizedDomain).toBe(item.expected);
      }
    });

    it('rejects direct IP addresses (IPv4 and IPv6)', () => {
      const ips = ['127.0.0.1', '192.168.1.1', '8.8.8.8', '::1', '2001:db8::1'];

      for (const ip of ips) {
        const result = validator.normalizeAndValidateSyntax(ip);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Direct IP addresses');
      }
    });

    it('rejects invalid or empty domain strings', () => {
      const invalid = [
        '',
        '   ',
        'stripe',
        '-stripe.com',
        'stripe-.com',
        'stripe..com',
        'stripe.c',
        'http://',
      ];

      for (const str of invalid) {
        const result = validator.normalizeAndValidateSyntax(str);
        expect(result.isValid).toBe(false);
      }
    });

    it('rejects reserved and internal suffixes', () => {
      const reserved = [
        'localhost',
        'service.localhost',
        'app.local',
        'node.internal',
        'server.lan',
        'test.test',
        'example.invalid',
        'metadata.google.internal',
      ];

      for (const domain of reserved) {
        const result = validator.normalizeAndValidateSyntax(domain);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Reserved or internal domains');
      }
    });
  });

  describe('2. Private & Restricted IP Detection (SSRF Guard)', () => {
    it('identifies private, loopback, and link-local IPv4 addresses as restricted', () => {
      const privateIpv4s = [
        '127.0.0.1',
        '127.0.0.100',
        '10.0.0.1',
        '10.255.255.254',
        '172.16.0.1',
        '172.31.255.254',
        '192.168.0.1',
        '192.168.100.50',
        '169.254.169.254', // AWS metadata endpoint
        '169.254.1.1',
        '0.0.0.0',
        '100.64.0.1', // CGNAT
        '100.127.255.255',
        '224.0.0.1', // Multicast
        '240.0.0.1', // Reserved
      ];

      for (const ip of privateIpv4s) {
        expect(validator.isPrivateOrRestrictedIp(ip)).toBe(true);
      }
    });

    it('identifies public IPv4 addresses as safe', () => {
      const publicIpv4s = [
        '93.184.216.34', // example.com
        '8.8.8.8',
        '1.1.1.1',
        '140.82.121.3', // github.com
        '151.101.1.140',
      ];

      for (const ip of publicIpv4s) {
        expect(validator.isPrivateOrRestrictedIp(ip)).toBe(false);
      }
    });

    it('identifies private and loopback IPv6 addresses as restricted', () => {
      const privateIpv6s = [
        '::1',
        '::',
        '0:0:0:0:0:0:0:1',
        'fe80::1',
        'fc00::1',
        'fd00::1',
        'ff02::1',
        '::ffff:127.0.0.1',
        '::ffff:10.0.0.1',
      ];

      for (const ip of privateIpv6s) {
        expect(validator.isPrivateOrRestrictedIp(ip)).toBe(true);
      }
    });
  });
});
