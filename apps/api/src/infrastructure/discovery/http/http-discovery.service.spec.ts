import { HttpDiscoveryService } from './http-discovery.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpDiscoveryService (Evidence Architecture)', () => {
  let service: HttpDiscoveryService;

  beforeEach(() => {
    service = new HttpDiscoveryService();
    jest.clearAllMocks();
  });

  it('should return OBSERVED state for present security headers', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
      },
      request: { res: { responseUrl: 'https://example.com' } },
    } as any);

    const result = await service.collectEvidence('example.com');

    expect(result.metadata.collectorName).toBe('http');
    expect(result.metadata.status).toBe('SUCCESS');

    expect(result.observations.strictTransportSecurity).toEqual({
      state: 'OBSERVED',
      value: 'max-age=31536000; includeSubDomains',
      rawRef: expect.any(String),
      observedAt: expect.any(Date),
    });

    expect(result.observations.xFrameOptions).toEqual({
      state: 'OBSERVED',
      value: 'DENY',
      rawRef: expect.any(String),
      observedAt: expect.any(Date),
    });

    expect(result.observations.contentSecurityPolicy).toEqual({
      state: 'MISSING',
      rawRef: expect.any(String),
      observedAt: expect.any(Date),
    });
  });

  it('should return MISSING state when security headers are omitted', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      headers: {
        'content-type': 'text/html',
      },
      request: { res: { responseUrl: 'https://example.com' } },
    } as any);

    const result = await service.collectEvidence('example.com');

    expect(result.observations.strictTransportSecurity.state).toBe('MISSING');
    expect(result.observations.contentSecurityPolicy.state).toBe('MISSING');
    expect(result.observations.xFrameOptions.state).toBe('MISSING');
    expect(result.observations.xContentTypeOptions.state).toBe('MISSING');
    expect(result.observations.referrerPolicy.state).toBe('MISSING');
  });

  it('should return FAILED state when network request fails or times out', async () => {
    const networkError = new Error('connect ECONNREFUSED 127.0.0.1:443');
    (networkError as any).code = 'ECONNREFUSED';
    mockedAxios.get.mockRejectedValueOnce(networkError);

    const result = await service.collectEvidence('example.com');

    expect(result.metadata.status).toBe('FAILED');
    expect(result.observations.strictTransportSecurity).toEqual({
      state: 'FAILED',
      failureReason: 'ECONNREFUSED: connect ECONNREFUSED 127.0.0.1:443',
      observedAt: expect.any(Date),
    });
  });

  it('should maintain backward compatibility for discover() method', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      headers: { server: 'nginx' },
      request: { res: { responseUrl: 'https://example.com' } },
    } as any);

    const result = await service.discover('example.com');

    expect(result.reachable).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.headers['server']).toBe('nginx');
    expect(result.evidenceResult).toBeDefined();
  });
});
