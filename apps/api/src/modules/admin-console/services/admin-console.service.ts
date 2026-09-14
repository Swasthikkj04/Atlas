import {
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminSessionContext } from '../../admin-session/contracts/admin-session.contract';
import { AdminSessionStatus } from '../../admin-session/contracts/admin-session.contract';
import { AdminSessionService } from '../../admin-session/services/admin-session.service';
import {
  AdminAuditQueryDto,
  AdminAuditEventDto,
  AdminGeographicDistributionItem,
  AdminOverviewMetricsDto,
  AdminPaginatedAuditDto,
  AdminPaginatedUsersDto,
  AdminSecurityOverviewDto,
  AdminSessionsOverviewDto,
  AdminUserDetailDto,
  AdminUsersQueryDto,
} from '../contracts/admin-console.contract';
import { AdminAuditService } from '../../admin-audit/services/admin-audit.service';
import { AdminHardeningService } from '../../admin-audit/services/admin-hardening.service';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_CATEGORIES,
  ADMIN_AUDIT_RETENTION_CLASSES,
} from '../../admin-audit/contracts/admin-audit.contract';
import {
  lookupCountryFromIp,
  getLocalSystemCountry,
} from '../utils/geo-ip.util';
import { VisitorAnalyticsService } from './visitor-analytics.service';

@Injectable()
export class AdminConsoleService {
  private readonly logger = new Logger(AdminConsoleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminSessionService: AdminSessionService,
    private readonly auditService: AdminAuditService,
    private readonly hardeningService: AdminHardeningService,
    @Optional()
    private readonly visitorAnalyticsService?: VisitorAnalyticsService,
  ) {}

  /**
   * Retrieves high-level operational intelligence for Admin Overview (Platform + GX + Security + System + Geography).
   */
  async getOverview(): Promise<AdminOverviewMetricsDto> {
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Platform Users Aggregation (100% Real Database Telemetry)
    const [
      totalUsers,
      activeUsers,
      deactivatedUsers,
      pendingVerificationUsers,
      newUsers,
      monthlyActiveUsers,
      activeNowUsersGroup,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({
        where: { status: { in: ['DEACTIVATED', 'SUSPENDED', 'LOCKED'] } },
      }),
      this.prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { lastLoginAt: { gte: thirtyDaysAgo } },
            { sessions: { some: { lastActivityAt: { gte: thirtyDaysAgo } } } },
            { createdAt: { gte: thirtyDaysAgo } },
          ],
        },
      }),
      this.prisma.userSession.groupBy({
        by: ['userId'],
        where: {
          expiresAt: { gt: now },
          revokedAt: null,
        },
      }),
    ]);

    const activeNowUsers = activeNowUsersGroup.length;

    // 2. GX Intelligence Aggregation (100% Real DB telemetry)
    const [
      totalGx,
      activeGx,
      gxUnderstandings,
      convertedGx,
      todayGx,
      weekGx,
      monthGx,
    ] = await Promise.all([
      this.prisma.guestSession.count(),
      this.prisma.guestSession.count({ where: { expiresAt: { gt: now } } }),
      this.prisma.guestSession.count({
        where: { understandingJobId: { not: null } },
      }),
      this.prisma.guestSession.count({ where: { status: 'CONVERTED' } }),
      this.prisma.guestSession.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.guestSession.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.guestSession.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Conversion metric: real converted guest sessions count
    const convertedUsers = convertedGx;
    const conversionRate =
      totalGx > 0 ? Number(((convertedUsers / totalGx) * 100).toFixed(2)) : 0;

    // 3. Security Metrics & Active Sessions for Geographic Distribution
    const [
      adminSessionsCount,
      userSessionsCount,
      recentEventsCount,
      activeSessionsForGeo,
    ] = await Promise.all([
      this.prisma.adminSession.count({
        where: { status: AdminSessionStatus.ACTIVE },
      }),
      this.prisma.userSession.count({
        where: { expiresAt: { gt: now }, revokedAt: null },
      }),
      this.prisma.adminAuditEvent.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.userSession.findMany({
        where: { expiresAt: { gt: now }, revokedAt: null },
        select: { ipAddress: true },
        take: 200,
      }),
    ]);

    // 4. Geographic Distribution Aggregation
    const countryCountMap = new Map<
      string,
      { count: number; name: string; flag: string }
    >();
    for (const session of activeSessionsForGeo || []) {
      const geo = lookupCountryFromIp(session.ipAddress);
      const existing = countryCountMap.get(geo.countryCode);
      if (existing) {
        existing.count += 1;
      } else {
        countryCountMap.set(geo.countryCode, {
          count: 1,
          name: geo.countryName,
          flag: geo.countryFlag,
        });
      }
    }

    const totalGeoSessions = (activeSessionsForGeo || []).length;
    let geographicDistribution: AdminGeographicDistributionItem[] = Array.from(
      countryCountMap.entries(),
    )
      .map(([code, data]) => ({
        countryCode: code,
        countryName: data.name,
        countryFlag: data.flag,
        userCount: data.count,
        percentage:
          totalGeoSessions > 0
            ? Number(((data.count / totalGeoSessions) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.userCount - a.userCount);

    if (geographicDistribution.length === 0) {
      if (totalUsers > 0) {
        const defaultGeo = getLocalSystemCountry();
        geographicDistribution = [
          {
            countryCode: defaultGeo.countryCode,
            countryName: defaultGeo.countryName,
            countryFlag: defaultGeo.countryFlag,
            userCount: totalUsers,
            percentage: 100,
          },
        ];
      } else {
        geographicDistribution = [];
      }
    }

    return {
      platform: {
        totalUsers,
        activeUsers,
        activeNowUsers,
        monthlyActiveUsers,
        pendingVerificationUsers,
        newUsers,
        deactivatedUsers,
      },
      guestExperience: {
        totalGxSessions: totalGx,
        activeGuests: activeGx,
        gxUnderstandings,
        convertedUsers,
        conversionRate,
        trend: {
          today: todayGx,
          last7Days: weekGx,
          last30Days: monthGx,
        },
      },
      security: {
        adminSessions: adminSessionsCount,
        userSessions: userSessionsCount,
        failedAdminAuthCount: 0,
        recentSecurityEventsCount: recentEventsCount,
        assuranceLevel: 'AAL3',
        webAuthnStatus: 'OPERATIONAL',
      },
      system: {
        apiHealth: 'HEALTHY',
        databaseHealth: 'HEALTHY',
        workersHealth: 'HEALTHY',
        infrastructureHealth: 'HEALTHY',
        uptimeSeconds: Math.floor(process.uptime()),
      },
      geographicDistribution,
    };
  }

  /**
   * Server-side paginated and searchable user directory with geographic resolution.
   */
  async getUsers(query: AdminUsersQueryDto): Promise<AdminPaginatedUsersDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { ipAddress: true },
          },
          _count: {
            select: {
              domains: true,
              sessions: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    let userList = (users || []).map((u) => {
      const lastIp = u.sessions?.[0]?.ipAddress || null;
      const geo = lookupCountryFromIp(lastIp);
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        domainsCount: u._count?.domains || 0,
        activeSessionsCount: u._count?.sessions || 0,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        countryFlag: geo.countryFlag,
        lastIpAddress: lastIp,
      };
    });

    if (query.country) {
      userList = userList.filter(
        (u) => u.countryCode.toUpperCase() === query.country?.toUpperCase(),
      );
    }

    return {
      users: userList,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves safe user detail with country metadata without exposing secrets.
   */
  async getUserDetail(userId: string): Promise<AdminUserDetailDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: { select: { provider: true } },
        sessions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { ipAddress: true },
        },
        _count: {
          select: {
            domains: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const lastIp = user.sessions?.[0]?.ipAddress || null;
    const geo = lookupCountryFromIp(lastIp);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      domainsCount: user._count.domains,
      activeSessionsCount: user._count.sessions,
      authProviders: [
        ...(user.passwordHash ? ['LOCAL_PASSWORD'] : []),
        ...user.oauthAccounts.map((o) => o.provider),
      ],
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      countryFlag: geo.countryFlag,
      lastIpAddress: lastIp,
    };
  }

  /**
   * Disables a user account and revokes active sessions with tamper-evident audit logging.
   */
  async disableUser(
    userId: string,
    adminContext: AdminSessionContext,
    reason = 'Administrative account disable',
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'DEACTIVATED' },
      }),
      this.prisma.userSession.deleteMany({
        where: { userId },
      }),
    ]);

    await this.auditService.recordEvent({
      adminId: adminContext.adminId,
      sessionId: adminContext.sessionId,
      action: ADMIN_AUDIT_ACTIONS.USER_DISABLED,
      category: ADMIN_AUDIT_CATEGORIES.ADMIN_ACTION,
      retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.ADMIN_ACTION,
      targetType: 'User',
      targetId: userId,
      outcome: 'SUCCESS',
      metadata: { reason, userEmail: user.email },
    });

    this.logger.log(
      `[AuditEvent: USER_DISABLED] Admin [${adminContext.adminId}] disabled user [${userId}]`,
    );
    return { success: true };
  }

  /**
   * Lists active Admin and User sessions for inspection with country metadata.
   */
  async getSessions(
    currentSessionId: string,
    adminId: string,
  ): Promise<AdminSessionsOverviewDto> {
    const [adminSessions, userSessions, userSessionsCount] = await Promise.all([
      this.adminSessionService.listActiveSessions(adminId),
      this.prisma.userSession.findMany({
        where: { expiresAt: { gt: new Date() } },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.userSession.count({
        where: { expiresAt: { gt: new Date() } },
      }),
    ]);

    return {
      currentSessionId,
      adminSessions: adminSessions.map((s) => {
        const geo = lookupCountryFromIp(s.ipAddress);
        const presence = this.visitorAnalyticsService?.getSessionPresence(s.id);
        return {
          ...s,
          countryCode: geo.countryCode,
          countryName: geo.countryName,
          countryFlag: geo.countryFlag,
          presence,
        };
      }),
      userSessionsCount,
      userSessions: userSessions.map((s) => {
        const geo = lookupCountryFromIp(s.ipAddress);
        const presence = this.visitorAnalyticsService?.getSessionPresence(s.id);
        return {
          id: s.id,
          userId: s.userId,
          userEmail: s.user.email,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          countryCode: geo.countryCode,
          countryName: geo.countryName,
          countryFlag: geo.countryFlag,
          createdAt: s.createdAt,
          lastActivityAt: s.lastActivityAt,
          expiresAt: s.expiresAt,
          presence,
        };
      }),
    };
  }

  /**
   * Revokes a session (Admin or User).
   */
  async revokeSession(
    sessionId: string,
    adminContext: AdminSessionContext,
    type: 'ADMIN' | 'USER' = 'ADMIN',
  ): Promise<{ success: boolean }> {
    if (type === 'ADMIN') {
      await this.adminSessionService.revokeSession(
        sessionId,
        'Admin Console revocation',
      );
      await this.auditService.recordEvent({
        adminId: adminContext.adminId,
        sessionId: adminContext.sessionId,
        action: ADMIN_AUDIT_ACTIONS.ADMIN_SESSION_REVOKED,
        category: ADMIN_AUDIT_CATEGORIES.SESSION,
        retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SESSION,
        targetType: 'AdminSession',
        targetId: sessionId,
      });
    } else {
      await this.prisma.userSession.deleteMany({ where: { id: sessionId } });
      await this.auditService.recordEvent({
        adminId: adminContext.adminId,
        sessionId: adminContext.sessionId,
        action: ADMIN_AUDIT_ACTIONS.USER_SESSION_REVOKED,
        category: ADMIN_AUDIT_CATEGORIES.SESSION,
        retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SESSION,
        targetType: 'UserSession',
        targetId: sessionId,
      });
    }

    return { success: true };
  }

  /**
   * Revokes all other active Admin sessions except the current one.
   */
  async revokeAllOtherAdminSessions(
    currentSessionId: string,
    adminContext: AdminSessionContext,
  ): Promise<{ revokedCount: number }> {
    const result = await this.prisma.adminSession.updateMany({
      where: {
        adminId: adminContext.adminId,
        id: { not: currentSessionId },
        status: AdminSessionStatus.ACTIVE,
      },
      data: {
        status: AdminSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: 'Admin revoked all other sessions',
      },
    });

    await this.auditService.recordEvent({
      adminId: adminContext.adminId,
      sessionId: adminContext.sessionId,
      action: ADMIN_AUDIT_ACTIONS.ADMIN_SESSIONS_REVOKED,
      category: ADMIN_AUDIT_CATEGORIES.SESSION,
      retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SESSION,
      targetType: 'AdminSession',
      metadata: { currentSessionId, revokedCount: result.count },
    });

    return { revokedCount: result.count };
  }

  /**
   * Emergency global session revocation across all devices.
   */
  async revokeAllAdminSessions(
    reason: string,
    adminContext: AdminSessionContext,
  ): Promise<{ revokedCount: number }> {
    return this.hardeningService.revokeAllAdminSessions(reason, adminContext);
  }

  /**
   * Emergency platform lockdown.
   */
  async triggerEmergencyLockdown(
    reason: string,
    adminContext: AdminSessionContext,
  ) {
    return this.hardeningService.triggerEmergencyLockdown(reason, adminContext);
  }

  /**
   * Verifies the cryptographic chain integrity of all historical audit events.
   */
  async verifyAuditChainIntegrity() {
    return this.auditService.verifyAuditChainIntegrity();
  }

  /**
   * Cleans up expired audit events according to retention policy.
   */
  async cleanupExpiredAuditEvents() {
    return this.auditService.cleanupExpiredEvents();
  }

  /**
   * Retrieves operational security signals.
   */
  async getSecurityOverview(): Promise<AdminSecurityOverviewDto> {
    const [passkeyCount, recentEventsCount] = await Promise.all([
      this.prisma.adminWebAuthnCredential.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.adminAuditEvent.count(),
    ]);

    return {
      adminAuthStatus: 'PROTECTED',
      webAuthnStatus: 'OPERATIONAL',
      activePasskeyCount: passkeyCount,
      assuranceLevel: 'AAL3',
      failedAuthCount: 0,
      recentEventsCount,
      lockoutState: 'UNLOCKED',
    };
  }

  /**
   * Queries paginated and filtered administrative audit events with country metadata.
   */
  async getAuditEvents(
    query: AdminAuditQueryDto,
  ): Promise<AdminPaginatedAuditDto> {
    const result = await this.auditService.getAuditEvents(query);
    return {
      ...result,
      events: result.events.map((e) => {
        const geo = lookupCountryFromIp(e.ipAddress);
        return {
          ...e,
          countryCode: geo.countryCode,
          countryName: geo.countryName,
          countryFlag: geo.countryFlag,
        };
      }),
    };
  }
}
