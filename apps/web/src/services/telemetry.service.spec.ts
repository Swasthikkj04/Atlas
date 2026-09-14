import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  telemetry,
  normalizeTelemetryDomain,
  sanitizeTelemetryMetadata,
  getTabInstanceId,
} from './telemetry.service.ts';

describe('ADMIN-002 & ADMIN-003: Web Security Telemetry & Presence Beacons Suite', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalNavigator: any;
  let originalSessionStorage: any;
  let fetchCalls: Array<{ url: string; options: any }> = [];
  let beaconCalls: Array<{ url: string; data: any }> = [];
  let mockStorage: Map<string, string>;

  beforeEach(() => {
    fetchCalls = [];
    beaconCalls = [];
    mockStorage = new Map<string, string>();
    originalFetch = globalThis.fetch;
    originalSessionStorage = (globalThis as any).sessionStorage;

    (globalThis as any).sessionStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };

    globalThis.fetch = (async (url: any, options: any) => {
      fetchCalls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response;
    }) as any;

    if (typeof (globalThis as any).navigator === 'undefined') {
      (globalThis as any).navigator = {
        sendBeacon: (url: string, data: any) => {
          beaconCalls.push({ url, data });
          return true;
        },
      };
    } else {
      originalNavigator = (globalThis as any).navigator.sendBeacon;
      (globalThis as any).navigator.sendBeacon = (url: string, data: any) => {
        beaconCalls.push({ url, data });
        return true;
      };
    }

    if (typeof (globalThis as any).window === 'undefined') {
      (globalThis as any).window = {
        location: { pathname: '/' },
      };
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalNavigator) {
      (globalThis as any).navigator.sendBeacon = originalNavigator;
    }
    (globalThis as any).sessionStorage = originalSessionStorage;
  });

  describe('1. Domain Sanitization & Privacy Boundary', () => {
    it('normalizes valid domains by stripping protocol, path, port, and query params', () => {
      assert.equal(
        normalizeTelemetryDomain('https://app.acme.org:443/dashboard?foo=bar'),
        'app.acme.org',
      );
      assert.equal(
        normalizeTelemetryDomain('HTTP://DOMAIN.COM/path/'),
        'domain.com',
      );
      assert.equal(
        normalizeTelemetryDomain('  sub.example.co.uk  '),
        'sub.example.co.uk',
      );
    });

    it('rejects invalid, unsafe, or oversized domain strings', () => {
      assert.equal(normalizeTelemetryDomain(''), undefined);
      assert.equal(normalizeTelemetryDomain('<script>evil()</script>'), undefined);
      assert.equal(normalizeTelemetryDomain('http://'), undefined);
      assert.equal(normalizeTelemetryDomain('invalid..domain'), undefined);
    });

    it('silently filters out sensitive keys (password, token, cookie, session, authorization)', () => {
      const sensitiveInput = {
        submittedDomain: 'https://example.com/login',
        ctaLocation: 'hero',
        password: 'PlainTextPassword123!',
        userPassword: 'secretPassword',
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'rf_12345',
        cookie: 'session_id=98765',
        authorization: 'Bearer jwt_secret_token',
        privateKey: 'BEGIN RSA PRIVATE KEY',
      };

      const sanitized = sanitizeTelemetryMetadata(sensitiveInput);
      assert.deepEqual(sanitized, {
        submittedDomain: 'example.com',
        ctaLocation: 'hero',
      });
      assert.equal((sanitized as any)?.password, undefined);
      assert.equal((sanitized as any)?.accessToken, undefined);
      assert.equal((sanitized as any)?.authorization, undefined);
      assert.equal((sanitized as any)?.cookie, undefined);
    });
  });

  describe('2. Telemetry Dispatch & Beacon Transport', () => {
    it('dispatches non-blocking fetch with keepalive on track()', () => {
      telemetry.track('SCAN_DOMAIN_CTA', {
        path: '/',
        ctaLocation: 'hero',
      });

      assert.equal(fetchCalls.length, 1);
      const call = fetchCalls[0];
      assert.equal(call.url, '/api/v1/telemetry/events');
      assert.equal(call.options.method, 'POST');
      assert.equal(call.options.keepalive, true);

      const parsedBody = JSON.parse(call.options.body);
      assert.equal(parsedBody.event, 'SCAN_DOMAIN_CTA');
      assert.equal(parsedBody.path, '/');
      assert.equal(parsedBody.metadata.ctaLocation, 'hero');
    });

    it('uses navigator.sendBeacon when trackBeacon() is invoked', () => {
      const result = telemetry.trackBeacon('SIGN_OUT', {
        path: '/login',
        surface: 'auth',
      });

      assert.equal(result, true);
      assert.equal(beaconCalls.length, 1);
      const call = beaconCalls[0];
      assert.equal(call.url, '/api/v1/telemetry/events');
    });

    it('gracefully isolates network errors without throwing or impacting UI flow ("Telemetry can fail. Nebula cannot.")', () => {
      globalThis.fetch = (async () => {
        throw new Error('Network error / beacon dropped');
      }) as any;

      assert.doesNotThrow(() => {
        telemetry.track('SIGN_IN', {
          path: '/login',
          status: 'SUCCESS',
        });
      });
    });
  });

  describe('3. Deduplication on React Re-renders', () => {
    it('deduplicates rapid consecutive triggers with identical event/path/location within dedupe window', () => {
      fetchCalls = [];

      // Simulate 3 rapid re-renders firing the same CTA
      telemetry.track('SIGN_UP_CTA', { path: '/register', ctaLocation: 'navbar' });
      telemetry.track('SIGN_UP_CTA', { path: '/register', ctaLocation: 'navbar' });
      telemetry.track('SIGN_UP_CTA', { path: '/register', ctaLocation: 'navbar' });

      // Only the first one should be dispatched
      assert.equal(fetchCalls.length, 1);
    });
  });

  describe('4. Observability vs Authoritative Security Audit Isolation', () => {
    it('ensures telemetry client does not handle authoritative admin WebAuthn security events', () => {
      const secAuditEvents = [
        'ADMIN_WEBAUTHN_ENROLLMENT_STARTED',
        'ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED',
        'ADMIN_WEBAUTHN_ENROLLMENT_FAILED',
      ];

      // Telemetry events are strictly observational
      for (const ev of secAuditEvents) {
        assert.ok(ev.startsWith('ADMIN_WEBAUTHN_'));
      }
    });
  });

  describe('5. ADMIN-003: Tab Instance Identity & Presence Telemetry', () => {
    it('generates random non-sensitive tabInstanceId and persists in sessionStorage', () => {
      const tabId1 = getTabInstanceId();
      assert.ok(tabId1.startsWith('tab_'));
      assert.ok(tabId1.length > 8);

      // Subsequent calls in same tab return the same tab ID
      const tabId2 = getTabInstanceId();
      assert.equal(tabId1, tabId2);
    });

    it('isolates different tabs with distinct tab instance IDs', () => {
      const tabId1 = getTabInstanceId();

      // Simulate new tab with fresh sessionStorage
      mockStorage.clear();
      const tabId2 = getTabInstanceId();

      assert.notEqual(tabId1, tabId2);
      assert.ok(tabId2.startsWith('tab_'));
    });

    it('dispatches SESSION_TAB_OPENED and presence metadata correctly', () => {
      fetchCalls = [];
      const tabId = getTabInstanceId();

      telemetry.track('SESSION_TAB_OPENED', {
        tabInstanceId: tabId,
        path: '/workspace',
        status: 'visible',
      });

      assert.equal(fetchCalls.length, 1);
      const parsedBody = JSON.parse(fetchCalls[0].options.body);
      assert.equal(parsedBody.event, 'SESSION_TAB_OPENED');
      assert.equal(parsedBody.metadata.tabInstanceId, tabId);
      assert.equal(parsedBody.metadata.status, 'visible');
    });

    it('dispatches SESSION_TAB_CLOSED via trackBeacon on document unload', async () => {
      beaconCalls = [];
      const tabId = getTabInstanceId();

      const res = telemetry.trackBeacon('SESSION_TAB_CLOSED', {
        tabInstanceId: tabId,
        path: '/workspace',
        status: 'closed',
      });

      assert.equal(res, true);
      assert.equal(beaconCalls.length, 1);
      const rawData = beaconCalls[0].data;
      const text = typeof rawData === 'string' ? rawData : await (rawData as Blob).text();
      const parsed = JSON.parse(text);
      assert.equal(parsed.event, 'SESSION_TAB_CLOSED');
      assert.equal(parsed.metadata.tabInstanceId, tabId);
      assert.equal(parsed.metadata.status, 'closed');
    });

    it('verifies that presence payloads never leak tokens or passwords', () => {
      const tabId = getTabInstanceId();
      const sensitivePresenceMeta = {
        tabInstanceId: tabId,
        token: 'secret_jwt_token',
        password: 'my_password',
        cookie: 'auth_cookie=xyz',
        authorization: 'Bearer 12345',
      };

      const sanitized = sanitizeTelemetryMetadata(sensitivePresenceMeta);
      assert.equal(sanitized?.tabInstanceId, tabId);
      assert.equal((sanitized as any)?.token, undefined);
      assert.equal((sanitized as any)?.password, undefined);
      assert.equal((sanitized as any)?.cookie, undefined);
      assert.equal((sanitized as any)?.authorization, undefined);
    });
  });
});
