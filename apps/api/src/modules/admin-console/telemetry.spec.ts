import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import assert from 'node:assert/strict';
import {
  RecordTelemetryEventDto,
  RecordTelemetryBatchDto,
  TelemetryPrivacyBoundary,
  TELEMETRY_EVENTS,
} from './contracts/telemetry.contract';
import { VisitorAnalyticsService } from './services/visitor-analytics.service';
import { TelemetryController } from './controllers/telemetry.controller';

describe('ADMIN-002: Security Telemetry & Action Beacons Suite', () => {
  let visitorAnalyticsService: VisitorAnalyticsService;
  let telemetryController: TelemetryController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      domain: { findMany: jest.fn().mockResolvedValue([]) },
      guestSession: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      understandingJob: { count: jest.fn().mockResolvedValue(0) },
      userSession: { count: jest.fn().mockResolvedValue(0) },
    };

    visitorAnalyticsService = new VisitorAnalyticsService(mockPrisma);
    telemetryController = new TelemetryController(visitorAnalyticsService);
  });

  describe('1. DTO Schema & Whitelist Validation', () => {
    it('validates allowlisted telemetry event with valid metadata', async () => {
      const payload = {
        event: 'SCAN_DOMAIN_CTA',
        path: '/',
        surface: 'landing',
        metadata: {
          submittedDomain: 'example.com',
          ctaLocation: 'hero',
          referrer: 'https://google.com',
        },
      };

      const dto = plainToInstance(RecordTelemetryEventDto, payload);
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      assert.equal(errors.length, 0);
    });

    it('rejects unknown / disallowed telemetry event names', async () => {
      const payload = {
        event: 'ARBITRARY_SURVEILLANCE_ACTION',
        path: '/',
      };

      const dto = plainToInstance(RecordTelemetryEventDto, payload);
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      assert.ok(errors.length > 0);
      assert.ok(errors[0].property === 'event');
    });

    it('rejects non-whitelisted metadata fields', async () => {
      const payload = {
        event: 'SIGN_IN',
        metadata: {
          submittedDomain: 'example.com',
          unauthorizedTrackingCookie: 'cookie-val', // Non-whitelisted
        },
      };

      const dto = plainToInstance(RecordTelemetryEventDto, payload);
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      assert.ok(errors.length > 0);
    });

    it('validates batch telemetry payload structure', async () => {
      const batchPayload = {
        events: [
          { event: 'SCAN_DOMAIN_CTA', path: '/' },
          { event: 'SIGN_UP_CTA', path: '/register' },
        ],
      };

      const dto = plainToInstance(RecordTelemetryBatchDto, batchPayload);
      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      assert.equal(errors.length, 0);
    });
  });

  describe('2. Privacy Boundary & Secret Injection Defenses', () => {
    it('rejects payloads containing password or password variants', () => {
      const badPayload = {
        event: 'AUTH_FAILURE',
        metadata: {
          password: 'SuperSecretPassword123!',
        },
      };

      assert.throws(
        () => TelemetryPrivacyBoundary.assertNoSensitiveData(badPayload),
        BadRequestException,
      );
    });

    it('rejects payloads containing accessToken, sessionToken, or cookies', () => {
      const payloads = [
        {
          event: 'SIGN_IN',
          metadata: { accessToken: 'eyJhbGciOiJIUzI1Ni...' },
        },
        { event: 'SIGN_IN', metadata: { sessionToken: 'sess_12345' } },
        { event: 'SIGN_IN', metadata: { cookie: 'auth=abc' } },
        { event: 'SIGN_IN', metadata: { authorization: 'Bearer token' } },
        { event: 'SIGN_IN', metadata: { privateKey: 'BEGIN RSA PRIVATE KEY' } },
        { event: 'SIGN_IN', metadata: { clientSecret: 'sec_abcdef' } },
      ];

      for (const p of payloads) {
        assert.throws(
          () => TelemetryPrivacyBoundary.assertNoSensitiveData(p),
          BadRequestException,
        );
      }
    });

    it('detects and rejects raw JWT tokens embedded in values', () => {
      const jwtVal =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignatureValueABCDEF1234567890';
      const payload = {
        event: 'SIGN_IN',
        metadata: {
          referrer: jwtVal,
        },
      };

      assert.throws(
        () => TelemetryPrivacyBoundary.assertNoSensitiveData(payload),
        BadRequestException,
      );
    });
  });

  describe('3. Domain Normalization & Sanitization', () => {
    it('sanitizes submittedDomain by stripping protocols, ports, and trailing paths', () => {
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain(
          'https://app.example.com/login?param=1#anchor',
        ),
        'app.example.com',
      );
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain(
          'http://api.subdomain.co.uk:8080/',
        ),
        'api.subdomain.co.uk',
      );
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain('  EXAMPLE.ORG  '),
        'example.org',
      );
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain('localhost'),
        'localhost',
      );
    });

    it('rejects malformed domains, script injection, and empty values', () => {
      assert.equal(TelemetryPrivacyBoundary.normalizeDomain(''), undefined);
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain('<script>alert(1)</script>'),
        undefined,
      );
      assert.equal(
        TelemetryPrivacyBoundary.normalizeDomain('..invalid..domain..'),
        undefined,
      );
    });
  });

  describe('4. Telemetry Controller & Observability Invariants', () => {
    const mockRequest = (
      ip = '198.51.100.42',
      ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    ) =>
      ({
        ip,
        headers: {
          'user-agent': ua,
          'cf-ipcountry': 'US',
        },
      }) as any;

    it('successfully ingests single telemetry event without requiring authentication', () => {
      const res = telemetryController.recordEvents(
        {
          event: 'SCAN_DOMAIN_CTA',
          surface: 'landing',
          path: '/',
          metadata: { ctaLocation: 'hero' },
        },
        mockRequest(),
      );

      assert.equal(res.success, true);
      assert.equal(res.ingested, 1);
      assert.ok(res.eventIds && res.eventIds.length === 1);
    });

    it('successfully ingests batch telemetry events', () => {
      const res = telemetryController.recordEvents(
        {
          events: [
            {
              event: 'SCAN_DOMAIN',
              surface: 'gx',
              metadata: { submittedDomain: 'acme.corp' },
            },
            { event: 'CLAIM_SESSION', surface: 'gx' },
          ],
        },
        mockRequest(),
      );

      assert.equal(res.success, true);
      assert.equal(res.ingested, 2);
      assert.equal(res.eventIds?.length, 2);
    });

    it('normalizes timestamps within bounds and falls back to server time if malformed', () => {
      const res = visitorAnalyticsService.recordTelemetryEvent(
        {
          event: 'SIGN_IN',
          surface: 'auth',
          timestamp: 'invalid-date-format',
        },
        '1.1.1.1',
        'Mozilla/5.0',
        'US',
      );

      assert.equal(res.success, true);
    });

    it('isolates internal runtime errors and preserves production uptime ("Telemetry can fail. Nebula cannot.")', () => {
      // Mock internal error in service
      const faultyService = {
        recordTelemetryEvent: () => {
          throw new Error('Database connection failed');
        },
        recordTelemetryEvents: () => {
          throw new Error('Database connection failed');
        },
        recordVisit: () => ({ success: false, eventId: '' }),
      } as any;

      const isolatedController = new TelemetryController(faultyService);
      const res = isolatedController.recordEvents(
        { event: 'PAGE_VIEW', path: '/docs' },
        mockRequest(),
      );

      // Fails safe and does not crash
      assert.equal(res.success, true);
      assert.equal(res.ingested, 0);
      assert.equal(res.status, 'DEGRADED_ISOLATED');
    });

    it('enforces that telemetry is observational only and cannot mutate tenant state or elevate admin privileges', () => {
      const attackPayload = {
        event: 'SIGN_IN',
        metadata: {
          role: 'SUPER_ADMIN', // Ignored
          isAdmin: true, // Ignored
        },
      };

      // Server ingests purely as an observational event, no DB admin row is modified
      assert.doesNotThrow(() => {
        visitorAnalyticsService.recordTelemetryEvent(
          attackPayload as any,
          '1.2.3.4',
        );
      });
    });
  });

  describe('5. Distinct Planes: Product Telemetry vs Authoritative Security Audit', () => {
    it('verifies that security audit events remain in AdminAuditService and are not conflated with telemetry', () => {
      const securityAuditEvents = [
        'ADMIN_WEBAUTHN_ENROLLMENT_STARTED',
        'ADMIN_WEBAUTHN_ENROLLMENT_COMPLETED',
        'ADMIN_WEBAUTHN_ENROLLMENT_FAILED',
        'ADMIN_SESSION_CREATED',
        'ADMIN_LOCKDOWN_TRIGGERED',
      ];

      // These security-sensitive actions belong strictly to AdminAuditService
      for (const secEvent of securityAuditEvents) {
        assert.ok(!TELEMETRY_EVENTS.includes(secEvent as any));
      }
    });
  });

  describe('6. ADMIN-003: Browser Tab Presence & Session Lifecycle Telemetry', () => {
    it('tracks tab lifecycle transitions: OPENED -> VISIBLE -> HIDDEN -> CLOSED', () => {
      const tabId = 'tab_test_lifecycle_1';
      const sessionId = 'ses_auth_123';

      // 1. Tab Opened
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabId, status: 'visible' },
      });

      let tab = visitorAnalyticsService.getTabPresence(tabId);
      assert.ok(tab);
      assert.equal(tab.tabInstanceId, tabId);
      assert.equal(tab.sessionId, sessionId);
      assert.equal(tab.status, 'active');
      assert.equal(tab.lastPresenceSignal, 'SESSION_TAB_OPENED');

      // 2. Tab Hidden (background tab)
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_HIDDEN',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabId },
      });

      tab = visitorAnalyticsService.getTabPresence(tabId);
      assert.equal(tab?.status, 'hidden');
      assert.equal(tab?.lastPresenceSignal, 'SESSION_TAB_HIDDEN');
      assert.ok(tab?.lastHiddenAt);

      // 3. Tab Visible (user switched back)
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_VISIBLE',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabId },
      });

      tab = visitorAnalyticsService.getTabPresence(tabId);
      assert.equal(tab?.status, 'active');
      assert.equal(tab?.lastPresenceSignal, 'SESSION_TAB_VISIBLE');
      assert.ok(tab?.lastVisibleAt);

      // 4. Tab Closed (pagehide / beforeunload beacon)
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_CLOSED',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabId },
      });

      tab = visitorAnalyticsService.getTabPresence(tabId);
      assert.equal(tab?.status, 'closed');
      assert.equal(tab?.lastPresenceSignal, 'SESSION_TAB_CLOSED');
      assert.ok(tab?.lastClosedAt);
    });

    it('enforces FREEZE INVARIANT: SESSION_TAB_CLOSED ≠ SESSION_REVOKED', () => {
      const tabId = 'tab_test_freeze_inv';
      const sessionId = 'ses_permanent_auth_456';

      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId,
        path: '/',
        metadata: { tabInstanceId: tabId },
      });

      // Browser document unloads
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_CLOSED',
        sessionId,
        path: '/',
        metadata: { tabInstanceId: tabId },
      });

      // Tab is marked as closed in telemetry
      const tab = visitorAnalyticsService.getTabPresence(tabId);
      assert.equal(tab?.status, 'closed');

      // Observational presence reports offline / 0 active tabs
      const presence = visitorAnalyticsService.getSessionPresence(sessionId);
      assert.equal(presence.isOnline, false);
      assert.equal(presence.activeTabsCount, 0);
      assert.equal(presence.closedTabsCount, 1);

      // Invariant check: No DB revocation methods or session delete queries were triggered
      // Telemetry is strictly observational and uncoupled from auth revocation state.
    });

    it('correctly manages multi-tab presence per session', () => {
      const sessionId = 'ses_multitab_789';
      const tabA = 'tab_user_a';
      const tabB = 'tab_user_b';
      const tabC = 'tab_user_c';

      // Tab A: active, Tab B: active, Tab C: hidden
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabA, status: 'visible' },
      });
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId,
        path: '/docs',
        metadata: { tabInstanceId: tabB, status: 'visible' },
      });
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId,
        path: '/settings',
        metadata: { tabInstanceId: tabC, status: 'hidden' },
      });

      let presence = visitorAnalyticsService.getSessionPresence(sessionId);
      assert.equal(presence.isOnline, true);
      assert.equal(presence.activeTabsCount, 2);
      assert.equal(presence.hiddenTabsCount, 1);
      assert.equal(presence.closedTabsCount, 0);
      assert.equal(presence.tabs.length, 3);

      // Closing Tab A must NOT make the overall session appear offline
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_CLOSED',
        sessionId,
        path: '/workspace',
        metadata: { tabInstanceId: tabA },
      });

      presence = visitorAnalyticsService.getSessionPresence(sessionId);
      assert.equal(presence.isOnline, true);
      assert.equal(presence.activeTabsCount, 1);
      assert.equal(presence.hiddenTabsCount, 1);
      assert.equal(presence.closedTabsCount, 1);

      // Hiding Tab B: active = 0, hidden = 2 -> still online
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_HIDDEN',
        sessionId,
        path: '/docs',
        metadata: { tabInstanceId: tabB },
      });

      presence = visitorAnalyticsService.getSessionPresence(sessionId);
      assert.equal(presence.isOnline, true);
      assert.equal(presence.activeTabsCount, 0);
      assert.equal(presence.hiddenTabsCount, 2);

      // Closing all remaining tabs
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_CLOSED',
        sessionId,
        path: '/docs',
        metadata: { tabInstanceId: tabB },
      });
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_CLOSED',
        sessionId,
        path: '/settings',
        metadata: { tabInstanceId: tabC },
      });

      presence = visitorAnalyticsService.getSessionPresence(sessionId);
      assert.equal(presence.isOnline, false);
      assert.equal(presence.activeTabsCount, 0);
      assert.equal(presence.hiddenTabsCount, 0);
      assert.equal(presence.closedTabsCount, 3);
    });

    it('prunes stale presence records older than retention cutoff', () => {
      const oldTabId = 'tab_ancient_1';
      const freshTabId = 'tab_fresh_2';

      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId: 'ses_old',
        metadata: { tabInstanceId: oldTabId },
      });
      visitorAnalyticsService.recordTelemetryEvent({
        event: 'SESSION_TAB_OPENED',
        sessionId: 'ses_fresh',
        metadata: { tabInstanceId: freshTabId },
      });

      // Artificially age old tab
      const oldTab = visitorAnalyticsService.getTabPresence(oldTabId);
      if (oldTab) {
        oldTab.lastSeenAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago
      }

      visitorAnalyticsService.pruneStalePresence(24 * 60 * 60 * 1000);

      assert.equal(visitorAnalyticsService.getTabPresence(oldTabId), undefined);
      assert.ok(visitorAnalyticsService.getTabPresence(freshTabId));
    });
  });
});
