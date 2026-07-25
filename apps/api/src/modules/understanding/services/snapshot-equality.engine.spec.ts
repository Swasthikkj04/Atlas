import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import { SnapshotEqualityEngine } from './snapshot-equality.engine';

describe('SnapshotEqualityEngine', () => {
  let engine: SnapshotEqualityEngine;

  beforeEach(() => {
    engine = new SnapshotEqualityEngine();
  });

  const baseSnapshot: DiscoverySnapshot = {
    dns: {
      a: ['1.1.1.1', '1.0.0.1'],
      aaaa: ['2606:4700:4700::1111'],
      mx: [{ exchange: 'mail.example.com', priority: 10 }],
      ns: ['ns1.example.com'],
      cname: [],
      txt: [['v=spf1 include:_spf.example.com ~all']],
      dmarc: [['v=DMARC1; p=none;']],
    },
    ssl: {
      reachable: true,
      supported: true,
      responseTimeMs: 150,
      authorized: true,
      certificate: {
        subject: 'example.com',
        issuer: 'Let\'s Encrypt',
        validFrom: '2026-01-01T00:00:00Z',
        validTo: '2026-04-01T00:00:00Z',
        serialNumber: '12345',
      },
      error: null,
    },
    http: {
      reachable: true,
      url: 'https://example.com',
      finalUrl: 'https://example.com/',
      protocol: 'https',
      statusCode: 200,
      responseTimeMs: 220,
      headers: {
        'server': 'nginx',
        'strict-transport-security': 'max-age=31536000',
        'content-security-policy': 'default-src \'self\'',
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
      },
      redirects: [],
      redirectCount: 0,
      error: null,
    },
  };

  it('should return true for identical snapshots', () => {
    const copy: DiscoverySnapshot = JSON.parse(JSON.stringify(baseSnapshot));
    expect(engine.isEqual(baseSnapshot, copy)).toBe(true);
  });

  it('should ignore array order in DNS IPv4 and IPv6 records', () => {
    const reordered: DiscoverySnapshot = {
      ...baseSnapshot,
      dns: {
        ...baseSnapshot.dns!,
        a: ['1.0.0.1', '1.1.1.1'],
      },
    };
    expect(engine.isEqual(baseSnapshot, reordered)).toBe(true);
  });

  it('should ignore responseTimeMs and non-critical header changes', () => {
    const modifiedMeta: DiscoverySnapshot = {
      ...baseSnapshot,
      ssl: {
        ...baseSnapshot.ssl!,
        responseTimeMs: 9999,
      },
      http: {
        ...baseSnapshot.http!,
        responseTimeMs: 8888,
        headers: {
          ...baseSnapshot.http!.headers,
          'x-request-id': 'unique-id-12345',
        },
      },
    };
    expect(engine.isEqual(baseSnapshot, modifiedMeta)).toBe(true);
  });

  it('should detect differences in DNS IPv4 addresses', () => {
    const changedDns: DiscoverySnapshot = {
      ...baseSnapshot,
      dns: {
        ...baseSnapshot.dns!,
        a: ['9.9.9.9'],
      },
    };
    expect(engine.isEqual(baseSnapshot, changedDns)).toBe(false);
  });

  it('should detect differences in SSL certificate validTo', () => {
    const changedSsl: DiscoverySnapshot = {
      ...baseSnapshot,
      ssl: {
        ...baseSnapshot.ssl!,
        certificate: {
          ...baseSnapshot.ssl!.certificate!,
          validTo: '2026-07-01T00:00:00Z',
        },
      },
    };
    expect(engine.isEqual(baseSnapshot, changedSsl)).toBe(false);
  });

  it('should detect differences in HTTP status code', () => {
    const changedHttp: DiscoverySnapshot = {
      ...baseSnapshot,
      http: {
        ...baseSnapshot.http!,
        statusCode: 500,
      },
    };
    expect(engine.isEqual(baseSnapshot, changedHttp)).toBe(false);
  });

  it('should detect differences in HTTP security headers', () => {
    const changedHeader: DiscoverySnapshot = {
      ...baseSnapshot,
      http: {
        ...baseSnapshot.http!,
        headers: {
          ...baseSnapshot.http!.headers,
          'x-frame-options': 'SAMEORIGIN',
        },
      },
    };
    expect(engine.isEqual(baseSnapshot, changedHeader)).toBe(false);
  });
});
