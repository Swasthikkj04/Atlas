import { HttpTransitAnalyzerService } from './http-transit-analyzer.service';

describe('HttpTransitAnalyzerService (S6 — HTTP Transit Invariants)', () => {
  let service: HttpTransitAnalyzerService;

  beforeEach(() => {
    service = new HttpTransitAnalyzerService();
  });

  describe('CORS Policy Audit', () => {
    it('detects wildcard CORS origin with credentials enabled (critical CORS flaw)', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET, POST, OPTIONS',
          },
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.corsAudit.isWildcardWithCredentials).toBe(true);
      expect(report.corsAudit.isOverlyPermissive).toBe(true);
      expect(report.corsAudit.allowCredentials).toBe(true);
      expect(report.corsAudit.allowMethods).toEqual(['GET', 'POST', 'OPTIONS']);
    });

    it('identifies restrictive CORS configuration with explicit origin', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            'access-control-allow-origin': 'https://app.example.com',
            'access-control-allow-credentials': 'true',
            'access-control-max-age': '86400',
          },
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.corsAudit.isWildcardWithCredentials).toBe(false);
      expect(report.corsAudit.isOverlyPermissive).toBe(false);
      expect(report.corsAudit.allowOrigin).toBe('https://app.example.com');
      expect(report.corsAudit.maxAge).toBe(86400);
    });
  });

  describe('Dangerous HTTP Methods Audit', () => {
    it('detects TRACE and CONNECT enabled in Allow header', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            allow: 'GET, POST, TRACE, CONNECT, OPTIONS',
          },
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.methodsAudit.hasTraceMethod).toBe(true);
      expect(report.methodsAudit.hasConnectMethod).toBe(true);
      expect(report.methodsAudit.hasDangerousMethods).toBe(true);
      expect(report.methodsAudit.dangerousMethodsList).toEqual([
        'TRACE',
        'CONNECT',
      ]);
    });

    it('certifies standard safe HTTP method sets', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          headers: {
            allow: 'GET, HEAD, POST, OPTIONS',
          },
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.methodsAudit.hasTraceMethod).toBe(false);
      expect(report.methodsAudit.hasDangerousMethods).toBe(false);
    });
  });

  describe('Cleartext HTTP Upgrade Audit', () => {
    it('flags unredirected plain HTTP port 80 responding with 200 OK', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          redirectHops: [
            {
              url: 'http://example.com',
              scheme: 'http',
              statusCode: 200,
              headers: {},
            },
          ],
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.upgradeAudit.hasCleartextExposure).toBe(true);
      expect(report.upgradeAudit.isHttpsRedirectEnforced).toBe(false);
      expect(report.upgradeAudit.initialStatusCode).toBe(200);
    });

    it('certifies clean permanent 301 redirect from HTTP to HTTPS', () => {
      const snapshot = {
        http: {
          reachable: true,
          queryStatus: 'SUCCESS',
          redirectHops: [
            {
              url: 'http://example.com',
              scheme: 'http',
              statusCode: 301,
              location: 'https://example.com/',
              headers: { location: 'https://example.com/' },
            },
            {
              url: 'https://example.com/',
              scheme: 'https',
              statusCode: 200,
              headers: {},
            },
          ],
        },
      };

      const report = service.analyzeTransit(snapshot);
      expect(report.upgradeAudit.hasCleartextExposure).toBe(false);
      expect(report.upgradeAudit.isHttpsRedirectEnforced).toBe(true);
      expect(report.upgradeAudit.isPermanentRedirect).toBe(true);
    });
  });
});
