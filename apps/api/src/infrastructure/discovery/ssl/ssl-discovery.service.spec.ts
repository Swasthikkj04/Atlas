import { SslDiscoveryService } from './ssl-discovery.service';
import * as tls from 'node:tls';
import * as dns from 'node:dns/promises';

jest.mock('node:tls');
jest.mock('node:dns/promises');

const mockedTls = tls as jest.Mocked<typeof tls>;
const mockedDns = dns as jest.Mocked<typeof dns>;

describe('SslDiscoveryService (SSRF Guard & TLS Discovery)', () => {
  let service: SslDiscoveryService;

  beforeEach(() => {
    service = new SslDiscoveryService();
    jest.clearAllMocks();
    mockedDns.lookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as any);
  });

  it('blocks direct IP targets with SSRF error before connecting', async () => {
    const result = await service.discover('127.0.0.1');

    expect(result.reachable).toBe(false);
    expect(result.supported).toBe(false);
    expect(result.error).toContain('SSRF_BLOCKED');
    expect(mockedTls.connect).not.toHaveBeenCalled();
  });

  it('blocks cloud metadata endpoints before connecting', async () => {
    const result = await service.discover('169.254.169.254');

    expect(result.reachable).toBe(false);
    expect(result.error).toContain('SSRF_BLOCKED');
    expect(mockedTls.connect).not.toHaveBeenCalled();
  });

  it('blocks internal/reserved hostnames before connecting', async () => {
    const result = await service.discover('metadata.google.internal');

    expect(result.reachable).toBe(false);
    expect(result.error).toContain('SSRF_BLOCKED');
    expect(mockedTls.connect).not.toHaveBeenCalled();
  });

  it('blocks domains that resolve to private IP addresses (SSRF DNS Rebinding)', async () => {
    mockedDns.lookup.mockResolvedValueOnce([
      { address: '10.0.0.5', family: 4 },
    ] as any);

    const result = await service.discover('internal-service.attacker.com');

    expect(result.reachable).toBe(false);
    expect(result.error).toContain('SSRF_BLOCKED');
    expect(mockedTls.connect).not.toHaveBeenCalled();
  });

  it('attempts TLS connection for valid public domain targets', async () => {
    const mockSocket = {
      authorized: true,
      getPeerCertificate: jest.fn().mockReturnValue({
        subject: { CN: 'example.com' },
        issuer: { CN: 'DigiCert Global Root CA' },
        valid_from: 'Jan 1 2025',
        valid_to: 'Jan 1 2026',
        serialNumber: '123456789',
        subjectaltname: 'DNS:example.com',
        fingerprint256: 'AA:BB:CC',
      }),
      getProtocol: jest.fn().mockReturnValue('TLSv1.3'),
      getCipher: jest.fn().mockReturnValue({ name: 'TLS_AES_256_GCM_SHA384' }),
      setTimeout: jest.fn(),
      on: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
    };

    (mockedTls.connect as any).mockImplementation(
      (_options: any, callback: () => void) => {
        if (callback) {
          setImmediate(callback);
        }
        return mockSocket;
      },
    );

    const result = await service.discover('example.com');

    expect(result.reachable).toBe(true);
    expect(result.supported).toBe(true);
    expect(result.certificate?.subject).toBe('example.com');
  });
});
