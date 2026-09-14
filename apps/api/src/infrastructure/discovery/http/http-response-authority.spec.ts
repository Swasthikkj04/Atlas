import { HttpDiscoveryService } from './http-discovery.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WX-1022: Authoritative HTTP Response & Redirect Chain Truth Audit', () => {
  let service: HttpDiscoveryService;

  beforeEach(() => {
    service = new HttpDiscoveryService();
    jest.clearAllMocks();
  });

  describe('1. Redirect Chain Authority & Hop Tracking', () => {
    it('accurately traces HTTP -> HTTPS -> www multi-hop redirect chain (google.com pattern)', async () => {
      // Hop 1: http://google.com -> 301 Moved Permanently to https://google.com/
      mockedAxios.get.mockResolvedValueOnce({
        status: 301,
        headers: {
          location: 'https://google.com/',
          server: 'gws',
        },
      });

      // Hop 2: https://google.com/ -> 301 Moved Permanently to https://www.google.com/
      mockedAxios.get.mockResolvedValueOnce({
        status: 301,
        headers: {
          location: 'https://www.google.com/',
          server: 'gws',
        },
      });

      // Hop 3: https://www.google.com/ -> 200 OK with HSTS
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        headers: {
          'strict-transport-security': 'max-age=31536000',
          'content-type': 'text/html; charset=ISO-8859-1',
          server: 'gws',
        },
      });

      const result = await service.discover('google.com');

      expect(result.reachable).toBe(true);
      expect(result.queryStatus).toBe('SUCCESS');
      expect(result.confidence).toBe('AUTHORITATIVE');
      expect(result.redirectCount).toBe(2);
      expect(result.redirectHops).toHaveLength(3);

      // Hop 1 verification
      expect(result.redirectHops[0].url).toBe('http://google.com');
      expect(result.redirectHops[0].statusCode).toBe(301);
      expect(result.redirectHops[0].scheme).toBe('http');

      // Hop 2 verification
      expect(result.redirectHops[1].url).toBe('https://google.com/');
      expect(result.redirectHops[1].statusCode).toBe(301);
      expect(result.redirectHops[1].scheme).toBe('https');

      // Hop 3 (Final Authoritative Response) verification
      expect(result.finalUrl).toBe('https://www.google.com/');
      expect(result.statusCode).toBe(200);
      expect(result.finalResponse?.authority).toBe('FINAL_HTTPS_RESPONSE');
      expect(result.finalResponse?.headers['strict-transport-security']).toBe(
        'max-age=31536000',
      );
      expect(result.headers['strict-transport-security']).toBe(
        'max-age=31536000',
      );
    });

    it('accurately resolves relative redirect paths', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 302,
        headers: { location: '/login' },
      });

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

      const result = await service.discover('app.example.com');

      expect(result.redirectCount).toBe(1);
      expect(result.redirectHops[0].url).toBe('http://app.example.com');
      expect(result.redirectHops[1].url).toBe('http://app.example.com/login');
      expect(result.finalUrl).toBe('http://app.example.com/login');
      expect(result.finalResponse?.authority).toBe('FINAL_HTTP_RESPONSE');
    });
  });

  describe('2. Lookup Failure & Confidence Classification', () => {
    it('classifies network connection timeout as TIMEOUT with FAILED confidence', async () => {
      const timeoutErr = new Error('timeout of 10000ms exceeded');
      (timeoutErr as any).code = 'ECONNABORTED';
      mockedAxios.get.mockRejectedValueOnce(timeoutErr);

      const result = await service.discover('slow-host.example.com');

      expect(result.reachable).toBe(false);
      expect(result.queryStatus).toBe('TIMEOUT');
      expect(result.confidence).toBe('FAILED');
      expect(result.finalResponse).toBeNull();
      expect(result.statusCode).toBeNull();
    });

    it('classifies DNS failure as DNS_ERROR with FAILED confidence', async () => {
      const dnsErr = new Error('getaddrinfo ENOTFOUND non-existent.domain');
      (dnsErr as any).code = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValueOnce(dnsErr);

      const result = await service.discover('non-existent.domain');

      expect(result.reachable).toBe(false);
      expect(result.queryStatus).toBe('DNS_ERROR');
      expect(result.confidence).toBe('FAILED');
      expect(result.finalResponse).toBeNull();
    });

    it('classifies SSL certificate error as SSL_ERROR with FAILED confidence', async () => {
      const sslErr = new Error('certificate has expired');
      (sslErr as any).code = 'CERT_HAS_EXPIRED';
      mockedAxios.get.mockRejectedValueOnce(sslErr);

      const result = await service.discover('expired-ssl.example.com');

      expect(result.reachable).toBe(false);
      expect(result.queryStatus).toBe('SSL_ERROR');
      expect(result.confidence).toBe('FAILED');
    });
  });
});
