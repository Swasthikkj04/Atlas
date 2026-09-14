import { OriginIpBypassLeakageRule } from './origin-ip-bypass-leakage.rule';
import { InsecureIngressTransitRule } from './insecure-ingress-transit.rule';
import { RuntimeDebugTraceExposureRule } from './runtime-debug-trace-exposure.rule';
import { FindingContext } from '../../contracts/finding-context.interface';
import { Severity } from '../../enums/severity.enum';

describe('Architectural Anomaly Findings Rules (Move 4)', () => {
  describe('OriginIpBypassLeakageRule', () => {
    let rule: OriginIpBypassLeakageRule;

    beforeEach(() => {
      rule = new OriginIpBypassLeakageRule();
    });

    it('flags HIGH finding when internal 10.x.x.x or 192.168.x.x IP is leaked in response headers', async () => {
      const context: FindingContext = {
        domainName: 'leak.corp.net',
        snapshot: {
          http: {
            reachable: true,
            url: 'https://leak.corp.net',
            finalUrl: 'https://leak.corp.net',
            protocol: 'https',
            statusCode: 200,
            responseTimeMs: 20,
            headers: {
              'x-forwarded-for': '192.168.1.104, 10.0.0.1',
              server: 'nginx',
            },
            redirects: [],
            redirectHops: [],
            redirectCount: 0,
            finalResponse: null,
            queryStatus: 'SUCCESS',
            confidence: 'AUTHORITATIVE',
            error: null,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings.length).toBe(1);
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain(
        'Internal Private IPv4 Address Leaked',
      );
    });

    it('returns empty when no internal RFC 1918 IPs exist in headers', async () => {
      const context: FindingContext = {
        domainName: 'clean.corp.net',
        snapshot: {
          http: {
            reachable: true,
            url: 'https://clean.corp.net',
            finalUrl: 'https://clean.corp.net',
            protocol: 'https',
            statusCode: 200,
            responseTimeMs: 20,
            headers: {
              server: 'cloudflare',
              'content-type': 'application/json',
            },
            redirects: [],
            redirectHops: [],
            redirectCount: 0,
            finalResponse: null,
            queryStatus: 'SUCCESS',
            confidence: 'AUTHORITATIVE',
            error: null,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings.length).toBe(0);
    });
  });

  describe('InsecureIngressTransitRule', () => {
    let rule: InsecureIngressTransitRule;

    beforeEach(() => {
      rule = new InsecureIngressTransitRule();
    });

    it('flags HIGH finding when redirect chain downgrades from HTTPS to unencrypted HTTP', async () => {
      const context: FindingContext = {
        domainName: 'downgrade-site.io',
        snapshot: {
          http: {
            reachable: true,
            url: 'https://downgrade-site.io',
            finalUrl: 'http://downgrade-site.io/insecure-login',
            protocol: 'http',
            statusCode: 200,
            responseTimeMs: 30,
            headers: {},
            redirects: [
              'https://downgrade-site.io',
              'http://downgrade-site.io/insecure-login',
            ],
            redirectHops: [
              {
                url: 'https://downgrade-site.io',
                statusCode: 302,
                headers: {},
                location: 'http://downgrade-site.io/insecure-login',
                scheme: 'https',
                hostname: 'downgrade-site.io',
                responseTimeMs: 15,
              },
              {
                url: 'http://downgrade-site.io/insecure-login',
                statusCode: 200,
                headers: {},
                scheme: 'http',
                hostname: 'downgrade-site.io',
                responseTimeMs: 15,
              },
            ],
            redirectCount: 1,
            finalResponse: null,
            queryStatus: 'SUCCESS',
            confidence: 'AUTHORITATIVE',
            error: null,
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings.length).toBe(1);
      expect(findings[0].severity).toBe(Severity.HIGH);
      expect(findings[0].title).toContain('Insecure Protocol Downgrade');
    });
  });

  describe('RuntimeDebugTraceExposureRule', () => {
    let rule: RuntimeDebugTraceExposureRule;

    beforeEach(() => {
      rule = new RuntimeDebugTraceExposureRule();
    });

    it('flags CRITICAL finding when Express/Node unhandled exception stack trace is exposed in HTML', async () => {
      const context: FindingContext = {
        domainName: 'express-fail.app',
        snapshot: {
          http: {
            reachable: true,
            url: 'https://express-fail.app',
            finalUrl: 'https://express-fail.app',
            protocol: 'https',
            statusCode: 500,
            responseTimeMs: 12,
            headers: {},
            redirects: [],
            redirectHops: [],
            redirectCount: 0,
            finalResponse: null,
            queryStatus: 'SUCCESS',
            confidence: 'AUTHORITATIVE',
            error: null,
            evidenceResult: {
              metadata: {
                collectorName: 'http',
                version: '1.0.0',
                collectedAt: new Date().toISOString(),
                durationMs: 12,
                status: 'SUCCESS',
              },
              observations: {} as any,
              rawPayload: {
                htmlBody:
                  "<!DOCTYPE html><html><body><pre>TypeError: Cannot read properties of undefined (reading 'id')\n    at /usr/src/app/routes/users.js:45:18\n    at Layer.handle [as handle_request] (/usr/src/app/node_modules/express/lib/router/layer.js:95:5)</pre></body></html>",
              },
            },
          },
        },
      };

      const findings = await rule.evaluate(context);
      expect(findings.length).toBe(1);
      expect(findings[0].severity).toBe(Severity.CRITICAL);
      expect(findings[0].title).toContain(
        'Debug Stack Trace Disclosed by Express / Node.js',
      );
    });
  });
});
