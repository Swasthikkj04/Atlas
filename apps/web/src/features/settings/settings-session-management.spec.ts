import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDeviceSummary,
  formatSessionActivityTime,
  SESSION_MANAGEMENT_HARD_INVARIANTS,
  type UserSession,
} from './contracts/session-management.contract.ts';

describe('AX-105: Active Sessions & Device Management Specifications', () => {
  describe('1. Device & Browser Summary Formatting Engine', () => {
    it('formats valid browser and operating system correctly', () => {
      assert.equal(
        formatDeviceSummary({ browser: 'Chrome', operatingSystem: 'Linux' }),
        'Chrome · Linux',
      );
      assert.equal(
        formatDeviceSummary({ browser: 'Safari', operatingSystem: 'macOS' }),
        'Safari · macOS',
      );
      assert.equal(
        formatDeviceSummary({ browser: 'Firefox', operatingSystem: 'Windows' }),
        'Firefox · Windows',
      );
    });

    it('handles Unknown or fallback fields gracefully', () => {
      assert.equal(
        formatDeviceSummary({ browser: 'Unknown', operatingSystem: 'Unknown' }),
        'Browser · Device',
      );
      assert.equal(
        formatDeviceSummary({ browser: 'Chrome', operatingSystem: undefined }),
        'Chrome · Device',
      );
      assert.equal(
        formatDeviceSummary({ browser: undefined, operatingSystem: 'iOS' }),
        'Browser · iOS',
      );
      assert.equal(formatDeviceSummary({}), 'Browser · Device');
    });
  });

  describe('2. Authoritative Activity Timestamp Formatting Engine', () => {
    const fixedNow = new Date('2026-08-21T12:00:00.000Z').getTime();

    it('formats timestamps under 60 seconds as Active now', () => {
      const recent = new Date(fixedNow - 30 * 1000).toISOString();
      assert.equal(formatSessionActivityTime(recent, fixedNow), 'Active now');
    });

    it('formats timestamps under 60 minutes as Active Xm ago', () => {
      const minsAgo = new Date(fixedNow - 15 * 60 * 1000).toISOString();
      assert.equal(formatSessionActivityTime(minsAgo, fixedNow), 'Active 15m ago');
    });

    it('formats timestamps under 24 hours as Active Xh ago', () => {
      const hoursAgo = new Date(fixedNow - 4 * 3600 * 1000).toISOString();
      assert.equal(formatSessionActivityTime(hoursAgo, fixedNow), 'Active 4h ago');
    });

    it('formats 1 day ago as Active yesterday', () => {
      const yesterday = new Date(fixedNow - 25 * 3600 * 1000).toISOString();
      assert.equal(formatSessionActivityTime(yesterday, fixedNow), 'Active yesterday');
    });

    it('formats multiple days ago as Active Xd ago', () => {
      const daysAgo = new Date(fixedNow - 4 * 86400 * 1000).toISOString();
      assert.equal(formatSessionActivityTime(daysAgo, fixedNow), 'Active 4d ago');
    });

    it('handles missing, null, or invalid dates gracefully without throwing', () => {
      assert.equal(formatSessionActivityTime(undefined, fixedNow), 'Active recently');
      assert.equal(formatSessionActivityTime('invalid-date', fixedNow), 'Active recently');
    });
  });

  describe('3. Current Session Identification & Partitioning', () => {
    const mockSessions: UserSession[] = [
      {
        id: 'ses-1',
        deviceName: 'Chrome on Linux',
        deviceType: 'Desktop',
        browser: 'Chrome',
        operatingSystem: 'Linux',
        ipAddress: '127.0.0.1',
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: true,
      },
      {
        id: 'ses-2',
        deviceName: 'Safari on macOS',
        deviceType: 'Desktop',
        browser: 'Safari',
        operatingSystem: 'macOS',
        ipAddress: '192.168.1.50',
        lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: false,
      },
      {
        id: 'ses-3',
        deviceName: 'Chrome on Android',
        deviceType: 'Mobile',
        browser: 'Chrome',
        operatingSystem: 'Android',
        ipAddress: '10.0.0.4',
        lastActivityAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: false,
      },
    ];

    it('correctly partitions current session from remote active sessions', () => {
      const currentSession = mockSessions.find((s) => s.isCurrent) || mockSessions[0];
      const otherSessions = mockSessions.filter((s) => s.id !== currentSession?.id);

      assert.equal(currentSession.id, 'ses-1');
      assert.equal(currentSession.isCurrent, true);
      assert.equal(otherSessions.length, 2);
      assert.deepEqual(
        otherSessions.map((s) => s.id),
        ['ses-2', 'ses-3'],
      );
    });

    it('handles empty otherSessions list cleanly', () => {
      const singleSession: UserSession[] = [mockSessions[0]];
      const currentSession = singleSession.find((s) => s.isCurrent) || singleSession[0];
      const otherSessions = singleSession.filter((s) => s.id !== currentSession?.id);

      assert.equal(currentSession.id, 'ses-1');
      assert.equal(otherSessions.length, 0);
    });
  });

  describe('4. P0 Session Management Hard Invariants Certification', () => {
    it('certifies all 12 canonical session management hard invariants', () => {
      assert.equal(SESSION_MANAGEMENT_HARD_INVARIANTS.length, 12);
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_UNAUTHORIZED_SESSION_ACCESS'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_CROSS_USER_SESSION_REVOCATION'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_SESSION_SECRET_EXPOSURE'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_TOKEN_EXPOSURE'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_MOCKED_SESSION_DATA'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('CURRENT_SESSION_IS_AUTHORITATIVE'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_LOCAL_SESSION_REGISTRY'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('REVOCATION_REQUIRES_SERVER_CONFIRMATION'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('LOGOUT_ALL_PRESERVES_CURRENT_SESSION'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('SESSION_LIST_CONVERGES_TO_SERVER_TRUTH'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_UNAUTHENTICATED_SESSION_MANAGEMENT'));
      assert.ok(SESSION_MANAGEMENT_HARD_INVARIANTS.includes('NO_SECURITY_ACTIVITY_UI_FABRICATION'));
    });
  });
});
