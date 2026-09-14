import { Test, TestingModule } from '@nestjs/testing';
import { AdminConsoleService } from './services/admin-console.service';
import { AdminSessionService } from '../admin-session/services/admin-session.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AdminSessionStatus } from '../admin-session/contracts/admin-session.contract';
import { AdminAuditService } from '../admin-audit/services/admin-audit.service';
import { AdminHardeningService } from '../admin-audit/services/admin-hardening.service';
import { getLocalSystemCountry } from './utils/geo-ip.util';

describe('ADMIN-007: AdminConsoleService & GX Intelligence', () => {
  let service: AdminConsoleService;
  let adminSessionServiceMock: any;
  let prismaMock: any;

  const mockAdminContext = {
    adminId: 'adm-00000001',
    identifier: 'platform-owner',
    sessionId: 'ses-00000001',
    assuranceLevel: 'AAL3' as const,
    authenticatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      guestSession: {
        count: jest.fn(),
      },
      adminSession: {
        count: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      userSession: {
        count: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        groupBy: jest
          .fn()
          .mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]),
      },
      adminAuditEvent: {
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      adminWebAuthnCredential: {
        count: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation((promises) => Promise.all(promises)),
    };

    adminSessionServiceMock = {
      listActiveSessions: jest.fn(),
      revokeSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminConsoleService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdminSessionService, useValue: adminSessionServiceMock },
        {
          provide: AdminAuditService,
          useValue: {
            recordEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
            getAuditEvents: jest.fn().mockResolvedValue({
              events: [],
              total: 0,
              page: 1,
              totalPages: 1,
            }),
            verifyAuditChainIntegrity: jest
              .fn()
              .mockResolvedValue({ valid: true, totalEventsVerified: 0 }),
            cleanupExpiredEvents: jest
              .fn()
              .mockResolvedValue({ deletedCount: 0 }),
          },
        },
        {
          provide: AdminHardeningService,
          useValue: {
            triggerEmergencyLockdown: jest
              .fn()
              .mockResolvedValue({ success: true, status: 'DISABLED' }),
            revokeAllAdminSessions: jest
              .fn()
              .mockResolvedValue({ revokedCount: 1 }),
            verifyAdminOperationalState: jest
              .fn()
              .mockResolvedValue({ operational: true, status: 'ACTIVE' }),
          },
        },
      ],
    }).compile();

    service = module.get<AdminConsoleService>(AdminConsoleService);
  });

  describe('1. Platform & GX Intelligence Overview', () => {
    it('accurately aggregates Platform metrics and GX Intelligence', async () => {
      // User counts (total, active, deactivated, pending, new, monthlyActive)
      prismaMock.user.count
        .mockResolvedValueOnce(12481) // total
        .mockResolvedValueOnce(9832) // active
        .mockResolvedValueOnce(120) // deactivated
        .mockResolvedValueOnce(45) // pending
        .mockResolvedValueOnce(147) // new
        .mockResolvedValueOnce(8200); // monthly active

      // GX counts (total, active, understandings, converted, today, 7d, 30d)
      prismaMock.guestSession.count
        .mockResolvedValueOnce(24891) // total GX
        .mockResolvedValueOnce(1482) // active GX
        .mockResolvedValueOnce(18204) // GX understandings
        .mockResolvedValueOnce(2185) // converted
        .mockResolvedValueOnce(312) // today
        .mockResolvedValueOnce(2180) // 7 days
        .mockResolvedValueOnce(9400); // 30 days

      // Security counts
      prismaMock.adminSession.count.mockResolvedValue(2);
      prismaMock.userSession.count.mockResolvedValue(1204);
      prismaMock.adminAuditEvent.count.mockResolvedValue(7);
      prismaMock.userSession.findMany.mockResolvedValue([
        { ipAddress: '8.8.8.8' },
        { ipAddress: '106.51.10.2' },
      ]);

      const overview = await service.getOverview();

      expect(overview.platform.totalUsers).toBe(12481);
      expect(overview.platform.activeUsers).toBe(9832);
      expect(overview.platform.activeNowUsers).toBe(2);
      expect(overview.platform.monthlyActiveUsers).toBe(8200);
      expect(overview.platform.pendingVerificationUsers).toBe(45);
      expect(overview.platform.newUsers).toBe(147);

      expect(overview.guestExperience.totalGxSessions).toBe(24891);
      expect(overview.guestExperience.activeGuests).toBe(1482);
      expect(overview.guestExperience.gxUnderstandings).toBe(18204);
      expect(overview.guestExperience.convertedUsers).toBe(2185);
      expect(overview.guestExperience.conversionRate).toBeGreaterThan(0);

      expect(overview.security.adminSessions).toBe(2);
      expect(overview.security.assuranceLevel).toBe('AAL3');
      expect(overview.security.webAuthnStatus).toBe('OPERATIONAL');

      expect(overview.geographicDistribution).toBeDefined();
      expect(overview.geographicDistribution.length).toBeGreaterThan(0);
    });
  });

  describe('2. User Directory & Lifecycle Management', () => {
    it('supports server-side paginated user listing with country resolution', async () => {
      const mockUsers = [
        {
          id: 'usr-1',
          email: 'alice@example.com',
          name: 'Alice',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          sessions: [{ ipAddress: '8.8.8.8' }],
          _count: { domains: 3, sessions: 2 },
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await service.getUsers({ page: 1, limit: 20 });
      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe('alice@example.com');
      expect(result.users[0].domainsCount).toBe(3);
      expect(result.users[0].countryCode).toBe('US');
      expect(result.users[0].countryFlag).toBe('🇺🇸');
      expect(result.users[0].lastIpAddress).toBe('8.8.8.8');
    });

    it('filters users by country', async () => {
      const mockUsers = [
        {
          id: 'usr-1',
          email: 'alice@example.com',
          sessions: [{ ipAddress: '8.8.8.8' }], // US
          _count: { domains: 1, sessions: 1 },
        },
        {
          id: 'usr-2',
          email: 'bob@example.com',
          sessions: [{ ipAddress: '106.51.10.2' }], // IN
          _count: { domains: 1, sessions: 1 },
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers);
      prismaMock.user.count.mockResolvedValue(2);

      const result = await service.getUsers({ country: 'IN' });
      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe('bob@example.com');
      expect(result.users[0].countryCode).toBe('IN');
    });

    it('retrieves user detail with country metadata', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'alice@example.com',
        fullName: 'Alice Test',
        status: 'ACTIVE',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        oauthAccounts: [{ provider: 'GOOGLE' }],
        sessions: [{ ipAddress: '8.8.8.8' }],
        _count: { domains: 2, sessions: 1 },
      });

      const detail = await service.getUserDetail('usr-1');
      expect(detail.id).toBe('usr-1');
      expect(detail.countryCode).toBe('US');
      expect(detail.countryFlag).toBe('🇺🇸');
      expect(detail.countryName).toBe('United States');
      expect(detail.lastIpAddress).toBe('8.8.8.8');
    });

    it('disables user account and creates an audit event', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'badactor@example.com',
      });
      prismaMock.user.update.mockResolvedValue({
        id: 'usr-1',
        status: 'DEACTIVATED',
      });
      prismaMock.userSession.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.adminAuditEvent.create.mockResolvedValue({ id: 'audit-1' });

      const res = await service.disableUser(
        'usr-1',
        mockAdminContext,
        'TOS violation',
      );
      expect(res.success).toBe(true);
    });
  });

  describe('3. Session Control & Revocation', () => {
    it('lists admin and user sessions with country metadata', async () => {
      adminSessionServiceMock.listActiveSessions.mockResolvedValue([
        {
          id: 'ses-1',
          adminId: 'adm-00000001',
          ipAddress: '127.0.0.1',
          status: AdminSessionStatus.ACTIVE,
        },
      ]);
      prismaMock.userSession.findMany.mockResolvedValue([
        {
          id: 'uses-1',
          userId: 'u1',
          user: { email: 'u1@example.com' },
          ipAddress: '8.8.8.8',
          userAgent: 'Mozilla',
          createdAt: new Date(),
          lastActivityAt: new Date(),
          expiresAt: new Date(),
        },
      ]);
      prismaMock.userSession.count.mockResolvedValue(1);

      const sessions = await service.getSessions('ses-1', 'adm-00000001');
      const localSystem = getLocalSystemCountry();
      expect(sessions.adminSessions.length).toBe(1);
      expect(sessions.adminSessions[0].countryCode).toBe(
        localSystem.countryCode,
      );
      expect(sessions.userSessions.length).toBe(1);
      expect(sessions.userSessions[0].countryCode).toBe('US');
      expect(sessions.userSessions[0].countryFlag).toBe('🇺🇸');
      expect(sessions.currentSessionId).toBe('ses-1');
    });

    it('revokes all other admin sessions', async () => {
      prismaMock.adminSession.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.adminAuditEvent.create.mockResolvedValue({ id: 'audit-2' });

      const result = await service.revokeAllOtherAdminSessions(
        'ses-1',
        mockAdminContext,
      );
      expect(result.revokedCount).toBe(2);
    });
  });
});
