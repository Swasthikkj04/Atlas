import { DomainReachabilityService } from './domain-reachability.service';
import { DomainSecurityValidator } from './domain-security.validator';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DomainReachabilityService (WX-813: Reachability Probe Gate)', () => {
  let reachabilityService: DomainReachabilityService;
  let validator: DomainSecurityValidator;

  beforeEach(() => {
    validator = new DomainSecurityValidator();
    reachabilityService = new DomainReachabilityService(validator);
    jest.clearAllMocks();
  });

  it('rejects syntactically invalid domain inputs immediately', async () => {
    const result =
      await reachabilityService.verifyDomainReachability('invalid..domain');
    expect(result.reachable).toBe(false);
    expect(result.reason).toBe('DOMAIN_INVALID');
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('rejects domains that fail DNS or resolve to private IPs (SSRF protection)', async () => {
    jest.spyOn(validator, 'verifyDnsAndSsrfSafety').mockResolvedValue({
      isSafe: false,
      reason: 'SSRF_PRIVATE_IP',
    });

    const result = await reachabilityService.verifyDomainReachability(
      'mock-ssrf-domain.com',
    );
    expect(result.reachable).toBe(false);
    expect(result.reason).toBe('DOMAIN_UNREACHABLE');
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('accepts domain when HTTPS probe responds with any HTTP status code (200, 301, 401, 403, 500)', async () => {
    jest.spyOn(validator, 'verifyDnsAndSsrfSafety').mockResolvedValue({
      isSafe: true,
      resolvedIps: ['93.184.216.34'],
    });

    const testStatuses = [200, 301, 302, 401, 403, 500, 503];

    for (const status of testStatuses) {
      mockedAxios.get.mockResolvedValueOnce({
        status,
        headers: {},
        data: 'probe response',
      });

      const result =
        await reachabilityService.verifyDomainReachability('example.com');
      expect(result.reachable).toBe(true);
      expect(result.normalizedDomain).toBe('example.com');
      expect(result.statusCode).toBe(status);
    }
  });

  it('falls back to HTTP probe if HTTPS connection fails', async () => {
    jest.spyOn(validator, 'verifyDnsAndSsrfSafety').mockResolvedValue({
      isSafe: true,
      resolvedIps: ['93.184.216.34'],
    });

    // HTTPS fails with network/TLS error
    mockedAxios.get.mockRejectedValueOnce(new Error('ECONNRESET'));

    // HTTP probe succeeds
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: 'http response',
    });

    const result =
      await reachabilityService.verifyDomainReachability('legacy-site.org');
    expect(result.reachable).toBe(true);
    expect(result.normalizedDomain).toBe('legacy-site.org');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('rejects domain when both HTTPS and HTTP probes fail or time out', async () => {
    jest.spyOn(validator, 'verifyDnsAndSsrfSafety').mockResolvedValue({
      isSafe: true,
      resolvedIps: ['93.184.216.34'],
    });

    // HTTPS fails
    mockedAxios.get.mockRejectedValueOnce(new Error('ETIMEDOUT'));
    // HTTP fails
    mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result =
      await reachabilityService.verifyDomainReachability('dead-domain.io');
    expect(result.reachable).toBe(false);
    expect(result.reason).toBe('DOMAIN_UNREACHABLE');
  });
});
