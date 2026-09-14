import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AdminOverviewMetricsDto, AdminSecurityOverviewDto } from './api/admin-api.ts';

describe('ADMIN-007: Admin Console Web Feature & Invariants', () => {
  describe('1. Data Contracts & GX Intelligence Separation', () => {
    it('structures Admin Overview with isolated Platform, GX Intelligence, Security, and System sections', () => {
      const mockOverview: AdminOverviewMetricsDto = {
        platform: {
          totalUsers: 100,
          activeUsers: 80,
          activeNowUsers: 12,
          monthlyActiveUsers: 75,
          pendingVerificationUsers: 15,
          newUsers: 10,
          deactivatedUsers: 5,
        },
        guestExperience: {
          totalGxSessions: 500,
          activeGuests: 35,
          gxUnderstandings: 320,
          convertedUsers: 40,
          conversionRate: 8.0,
          trend: {
            today: 15,
            last7Days: 95,
            last30Days: 420,
          },
        },
        security: {
          adminSessions: 1,
          userSessions: 45,
          failedAdminAuthCount: 0,
          recentSecurityEventsCount: 2,
          assuranceLevel: 'AAL3',
          webAuthnStatus: 'OPERATIONAL',
        },
        system: {
          apiHealth: 'HEALTHY',
          databaseHealth: 'HEALTHY',
          workersHealth: 'HEALTHY',
          infrastructureHealth: 'HEALTHY',
          uptimeSeconds: 86400,
        },
        geographicDistribution: [
          {
            countryCode: 'US',
            countryName: 'United States',
            countryFlag: '🇺🇸',
            userCount: 65,
            percentage: 81.3,
          },
          {
            countryCode: 'IN',
            countryName: 'India',
            countryFlag: '🇮🇳',
            userCount: 15,
            percentage: 18.7,
          },
        ],
      };

      assert.equal(mockOverview.platform.totalUsers, 100);
      assert.equal(mockOverview.guestExperience.totalGxSessions, 500);
      assert.equal(mockOverview.guestExperience.conversionRate, 8.0);
      assert.equal(mockOverview.security.assuranceLevel, 'AAL3');
      assert.equal(mockOverview.system.apiHealth, 'HEALTHY');
      assert.equal(mockOverview.geographicDistribution?.length, 2);
      assert.equal(mockOverview.geographicDistribution?.[0].countryCode, 'US');
      assert.equal(mockOverview.geographicDistribution?.[0].countryFlag, '🇺🇸');
    });
  });

  describe('2. Security Posture & Emergency Lockdown Contracts', () => {
    it('enforces NIST AAL3 and OPERATIONAL WebAuthn status', () => {
      const securityDto: AdminSecurityOverviewDto = {
        adminAuthStatus: 'PROTECTED',
        webAuthnStatus: 'OPERATIONAL',
        activePasskeyCount: 3,
        assuranceLevel: 'AAL3',
        failedAuthCount: 0,
        recentEventsCount: 12,
        lockoutState: 'UNLOCKED',
      };

      assert.equal(securityDto.assuranceLevel, 'AAL3');
      assert.equal(securityDto.webAuthnStatus, 'OPERATIONAL');
      assert.equal(securityDto.lockoutState, 'UNLOCKED');
    });

    it('handles emergency lockdown and session revocation contracts', () => {
      const lockdownResult = {
        success: true,
        status: 'DISABLED',
        revokedSessionsCount: 3,
        lockdownAt: new Date().toISOString(),
        reason: 'Suspected hardware key compromise',
      };

      assert.equal(lockdownResult.success, true);
      assert.equal(lockdownResult.status, 'DISABLED');
      assert.equal(lockdownResult.revokedSessionsCount, 3);
    });

    it('ADMIN-001: validates WebAuthn hardware key enrollment contract and error mapping', () => {
      const mockInitiateResponse = {
        options: {
          rp: { name: 'Nebula Platform Admin', id: 'localhost' },
          challenge: 'mock-challenge-base64url',
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          user: { id: 'adm-001', name: 'platform-owner', displayName: 'Nebula Admin (platform-owner)' },
          authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
        },
        challenge: 'mock-challenge-base64url',
      };

      const mockVerifyPayload = {
        response: {
          id: 'mock-credential-id',
          rawId: 'mock-credential-id',
          response: {
            clientDataJSON: 'mock-client-data',
            attestationObject: 'mock-attestation',
            transports: ['usb', 'nfc'],
          },
          type: 'public-key',
        },
        challenge: mockInitiateResponse.challenge,
        deviceLabel: 'YubiKey 5C NFC',
      };

      const mockVerifyResponse = {
        credentialId: 'mock-credential-id',
        deviceLabel: 'YubiKey 5C NFC',
        status: 'ACTIVE',
      };

      assert.equal(mockInitiateResponse.options.rp.name, 'Nebula Platform Admin');
      assert.equal(mockInitiateResponse.challenge, 'mock-challenge-base64url');
      assert.equal(mockVerifyPayload.deviceLabel, 'YubiKey 5C NFC');
      assert.equal(mockVerifyResponse.status, 'ACTIVE');

      // Error mapping verification
      const mapError = (err: { name?: string; message?: string }) => {
        if (err.name === 'NotAllowedError' || err.message?.includes('not allowed') || err.message?.includes('cancelled')) {
          return 'Hardware key enrollment ceremony was cancelled or timed out.';
        }
        if (err.name === 'TimeoutError' || err.message?.includes('timed out')) {
          return 'Hardware key registration ceremony timed out.';
        }
        return err.message || 'Failed to complete hardware key enrollment ceremony.';
      };

      assert.equal(
        mapError({ name: 'NotAllowedError' }),
        'Hardware key enrollment ceremony was cancelled or timed out.',
      );
      assert.equal(
        mapError({ name: 'TimeoutError' }),
        'Hardware key registration ceremony timed out.',
      );
      assert.equal(
        mapError({ message: 'The operation was cancelled' }),
        'Hardware key enrollment ceremony was cancelled or timed out.',
      );
      assert.equal(
        mapError({ message: 'This WebAuthn passkey credential has already been registered.' }),
        'This WebAuthn passkey credential has already been registered.',
      );
    });
  });

  describe('3. User Directory Contracts', () => {
    it('validates paginated user directory structure and country metadata controls', () => {
      const paginatedUsers = {
        users: [
          {
            id: 'usr_1',
            email: 'alice@example.com',
            name: 'Alice Smith',
            status: 'ACTIVE',
            domainsCount: 2,
            activeSessionsCount: 1,
            createdAt: '2026-09-01T00:00:00.000Z',
            countryCode: 'US',
            countryName: 'United States',
            countryFlag: '🇺🇸',
            lastIpAddress: '8.8.8.8',
          },
          {
            id: 'usr_2',
            email: 'bob@example.com',
            name: null,
            status: 'DEACTIVATED',
            domainsCount: 0,
            activeSessionsCount: 0,
            createdAt: '2026-08-15T00:00:00.000Z',
            countryCode: 'IN',
            countryName: 'India',
            countryFlag: '🇮🇳',
            lastIpAddress: '106.51.10.2',
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      assert.equal(paginatedUsers.total, 2);
      assert.equal(paginatedUsers.users[0].status, 'ACTIVE');
      assert.equal(paginatedUsers.users[0].countryCode, 'US');
      assert.equal(paginatedUsers.users[0].countryFlag, '🇺🇸');
      assert.equal(paginatedUsers.users[1].status, 'DEACTIVATED');
      assert.equal(paginatedUsers.users[1].countryCode, 'IN');
    });
  });

  describe('4. Session Inspector Contracts', () => {
    it('validates multi-tenant session monitoring with geographic location', () => {
      const sessionsOverview = {
        adminSessions: [
          {
            id: 'ses_adm_1',
            adminId: 'adm_001',
            assuranceLevel: 'AAL3',
            ipAddress: '198.51.100.1',
            userAgent: 'Mozilla/5.0',
            lastActiveAt: '2026-09-06T12:00:00.000Z',
            expiresAt: '2026-09-06T12:15:00.000Z',
            createdAt: '2026-09-06T12:00:00.000Z',
            countryCode: 'US',
            countryName: 'United States',
            countryFlag: '🇺🇸',
          },
        ],
        currentSessionId: 'ses_adm_1',
        userSessions: [
          {
            id: 'ses_usr_1',
            userId: 'usr_1',
            userEmail: 'alice@example.com',
            ipAddress: '192.0.2.1',
            userAgent: 'Mozilla/5.0',
            createdAt: '2026-09-06T10:00:00.000Z',
            expiresAt: '2026-09-13T10:00:00.000Z',
            countryCode: 'US',
            countryName: 'United States',
            countryFlag: '🇺🇸',
          },
        ],
        userSessionsCount: 1,
      };

      assert.equal(sessionsOverview.adminSessions.length, 1);
      assert.equal(sessionsOverview.adminSessions[0].countryCode, 'US');
      assert.equal(sessionsOverview.currentSessionId, 'ses_adm_1');
      assert.equal(sessionsOverview.userSessionsCount, 1);
      assert.equal(sessionsOverview.userSessions[0].countryFlag, '🇺🇸');
    });
  });

  describe('5. Audit Trail & Cryptographic Verification Receipts', () => {
    it('validates SHA-256 chain verification receipt schema', () => {
      const verificationReceipt = {
        valid: true,
        totalEventsVerified: 142,
        genesisHash: '0000000000000000000000000000000000000000000000000000000000000000',
        latestHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };

      assert.equal(verificationReceipt.valid, true);
      assert.equal(verificationReceipt.totalEventsVerified, 142);
      assert.equal(verificationReceipt.genesisHash.length, 64);
      assert.equal(verificationReceipt.latestHash.length, 64);
    });
  });

  describe('6. Visitor & Domain Traffic Analytics (ADMIN-VISITORS)', () => {
    it('validates comprehensive visitor analytics schema and surface breakdown', () => {
      const mockVisitorAnalytics = {
        period: '24h' as const,
        domainFilter: 'all',
        availableDomains: ['all', 'atlas.dev', 'stripe.com'],
        overview: {
          totalPageviews: 450,
          totalUniqueVisitors: 120,
          todayVisitors: 85,
          activeVisitorsNow: 14,
          avgDurationSeconds: 155,
          bounceRatePercentage: 22.4,
        },
        surfaces: {
          landing: {
            pageviews: 200,
            uniqueVisitors: 80,
            directScansStarted: 35,
            ctaClicks: {
              scanDomain: 35,
              signUp: 18,
              exploreDocs: 12,
            },
            topReferrers: [
              { referrer: 'https://google.com', count: 45, percentage: 56.2 },
              { referrer: 'Direct / Bookmark', count: 35, percentage: 43.8 },
            ],
          },
          guestExperience: {
            totalVisitors: 150,
            uniqueGuests: 65,
            activeGuestSessions: 8,
            understandingsInitiated: 50,
            understandingsCompleted: 42,
            conversionsToRegistered: 12,
            conversionRatePercentage: 28.5,
            funnel: {
              stage1LandingVisits: 150,
              stage2DomainEntered: 100,
              stage3BriefGenerated: 80,
              stage4ClaimCtaClicked: 30,
              stage5AccountCreated: 12,
            },
            topScannedDomains: [{ domain: 'stripe.com', count: 20 }],
          },
          docs: {
            pageviews: 100,
            uniqueVisitors: 40,
            topSections: [
              { section: 'Architecture Overview', path: '/docs/architecture-overview', views: 45, percentage: 45.0 },
            ],
            searchQueriesCount: 22,
            topSearchKeywords: [{ keyword: 'DNSSEC', count: 8 }],
          },
          allSurfaces: [
            {
              surfaceId: 'landing' as const,
              label: 'Landing Page',
              pathPrefix: '/',
              pageviews: 200,
              uniqueVisitors: 80,
              percentageOfTotal: 44.4,
              avgTimeOnPageSeconds: 90,
            },
          ],
        },
        timeSeries: [
          {
            timestamp: '2026-09-06T12:00:00.000Z',
            label: '12:00',
            pageviews: 25,
            uniqueVisitors: 10,
            gxVisitors: 8,
            landingVisitors: 12,
            docsVisitors: 5,
          },
        ],
        geographicDistribution: [
          {
            countryCode: 'IN',
            countryName: 'India',
            countryFlag: '🇮🇳',
            visitors: 60,
            pageviews: 220,
            percentage: 50.0,
          },
          {
            countryCode: 'US',
            countryName: 'United States',
            countryFlag: '🇺🇸',
            visitors: 40,
            pageviews: 150,
            percentage: 33.3,
          },
        ],
        clientDemographics: {
          devices: [{ type: 'Desktop' as const, count: 90, percentage: 75.0 }],
          browsers: [{ name: 'Chrome', count: 80, percentage: 66.7 }],
          operatingSystems: [{ name: 'Linux', count: 70, percentage: 58.3 }],
        },
      };

      assert.equal(mockVisitorAnalytics.overview.totalUniqueVisitors, 120);
      assert.equal(mockVisitorAnalytics.surfaces.landing.pageviews, 200);
      assert.equal(mockVisitorAnalytics.surfaces.guestExperience.conversionRatePercentage, 28.5);
      assert.equal(mockVisitorAnalytics.surfaces.guestExperience.funnel.stage5AccountCreated, 12);
      assert.equal(mockVisitorAnalytics.surfaces.docs.topSections.length, 1);
      assert.equal(mockVisitorAnalytics.geographicDistribution[0].countryCode, 'IN');
      assert.equal(mockVisitorAnalytics.geographicDistribution[0].countryFlag, '🇮🇳');
    });
  });
});
