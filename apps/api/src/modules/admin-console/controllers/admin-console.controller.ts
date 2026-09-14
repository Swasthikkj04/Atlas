import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthorizationGuard } from '../../admin-authorization/guards/admin-authorization.guard';
import {
  CurrentAdmin,
  RequireAdmin,
  RequireAdminCapability,
} from '../../admin-authorization/decorators/admin-authorization.decorator';
import { AdminCapability } from '../../admin-authorization/contracts/admin-authorization.contract';
import type { AdminSessionContext } from '../../admin-session/contracts/admin-session.contract';
import { AdminConsoleService } from '../services/admin-console.service';
import { VisitorAnalyticsService } from '../services/visitor-analytics.service';
import {
  AdminAuditQueryDto,
  AdminUsersQueryDto,
  AdminVisitorsQueryDto,
  DisableUserDto,
  RevokeSessionDto,
  AdminEmergencyActionDto,
  type AdminOverviewMetricsDto,
  type AdminPaginatedAuditDto,
  type AdminPaginatedUsersDto,
  type AdminSecurityOverviewDto,
  type AdminSessionsOverviewDto,
  type AdminUserDetailDto,
  type AdminVisitorsAnalyticsDto,
} from '../contracts/admin-console.contract';

@Controller('admin')
@UseGuards(AdminAuthorizationGuard)
@RequireAdmin()
export class AdminConsoleController {
  constructor(
    private readonly adminConsoleService: AdminConsoleService,
    private readonly visitorAnalyticsService: VisitorAnalyticsService,
  ) {}

  /**
   * Platform & GX intelligence operational overview.
   */
  @Get('overview')
  @RequireAdminCapability(AdminCapability.ADMIN_DASHBOARD_READ)
  async getOverview(): Promise<AdminOverviewMetricsDto> {
    return this.adminConsoleService.getOverview();
  }

  /**
   * Domain visitor & traffic analytics (Landing page, GX, Docs, Custom Domains).
   */
  @Get('visitors')
  @RequireAdminCapability(AdminCapability.ADMIN_DASHBOARD_READ)
  async getVisitors(
    @Query() query: AdminVisitorsQueryDto,
  ): Promise<AdminVisitorsAnalyticsDto> {
    return this.visitorAnalyticsService.getVisitorAnalytics(query);
  }

  /**
   * Paginated user directory with server-side filtering.
   */
  @Get('users')
  @RequireAdminCapability(AdminCapability.ADMIN_USER_READ)
  async getUsers(
    @Query() query: AdminUsersQueryDto,
  ): Promise<AdminPaginatedUsersDto> {
    return this.adminConsoleService.getUsers(query);
  }

  /**
   * Safe user detail view.
   */
  @Get('users/:id')
  @RequireAdminCapability(AdminCapability.ADMIN_USER_READ)
  async getUserDetail(
    @Param('id') userId: string,
  ): Promise<AdminUserDetailDto> {
    return this.adminConsoleService.getUserDetail(userId);
  }

  /**
   * Disables a user account.
   */
  @Post('users/:id/disable')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_USER_MANAGE)
  async disableUser(
    @Param('id') userId: string,
    @Body() dto: DisableUserDto,
    @CurrentAdmin() admin: AdminSessionContext,
  ): Promise<{ success: boolean }> {
    return this.adminConsoleService.disableUser(userId, admin, dto?.reason);
  }

  /**
   * Lists active sessions.
   */
  @Get('sessions')
  @RequireAdminCapability(AdminCapability.ADMIN_SESSION_READ)
  async getSessions(
    @CurrentAdmin() admin: AdminSessionContext,
  ): Promise<AdminSessionsOverviewDto> {
    return this.adminConsoleService.getSessions(admin.sessionId, admin.adminId);
  }

  /**
   * Revokes a session.
   */
  @Post('sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_SESSION_REVOKE)
  async revokeSession(
    @Param('id') sessionId: string,
    @Body() dto: RevokeSessionDto,
    @CurrentAdmin() admin: AdminSessionContext,
  ): Promise<{ success: boolean }> {
    return this.adminConsoleService.revokeSession(
      sessionId,
      admin,
      dto?.type || 'ADMIN',
    );
  }

  /**
   * Revokes all other active Admin sessions.
   */
  @Post('sessions/revoke-all-others')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_SESSION_REVOKE)
  async revokeAllOtherAdminSessions(
    @CurrentAdmin() admin: AdminSessionContext,
  ): Promise<{ revokedCount: number }> {
    return this.adminConsoleService.revokeAllOtherAdminSessions(
      admin.sessionId,
      admin,
    );
  }

  /**
   * Operational security summary.
   */
  @Get('security')
  @RequireAdminCapability(AdminCapability.ADMIN_SECURITY_READ)
  async getSecurity(): Promise<AdminSecurityOverviewDto> {
    return this.adminConsoleService.getSecurityOverview();
  }

  /**
   * Emergency platform lockdown: disables Admin identity and revokes all active sessions.
   */
  @Post('security/lockdown')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_SECURITY_MANAGE)
  async triggerLockdown(
    @Body() dto: AdminEmergencyActionDto,
    @CurrentAdmin() admin: AdminSessionContext,
  ) {
    return this.adminConsoleService.triggerEmergencyLockdown(
      dto?.reason || 'Emergency lockdown initiated',
      admin,
    );
  }

  /**
   * Emergency global session revocation across all devices.
   */
  @Post('security/revoke-all-sessions')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_SESSION_REVOKE)
  async revokeAllSessions(
    @Body() dto: AdminEmergencyActionDto,
    @CurrentAdmin() admin: AdminSessionContext,
  ) {
    return this.adminConsoleService.revokeAllAdminSessions(
      dto?.reason || 'Emergency session invalidation',
      admin,
    );
  }

  /**
   * Administrative audit logs.
   */
  @Get('audit')
  @RequireAdminCapability(AdminCapability.ADMIN_AUDIT_READ)
  async getAudit(
    @Query() query: AdminAuditQueryDto,
  ): Promise<AdminPaginatedAuditDto> {
    return this.adminConsoleService.getAuditEvents(query);
  }

  /**
   * Verifies the cryptographic integrity of the audit hash chain.
   */
  @Get('audit/verify-integrity')
  @RequireAdminCapability(AdminCapability.ADMIN_AUDIT_READ)
  async verifyAuditChainIntegrity() {
    return this.adminConsoleService.verifyAuditChainIntegrity();
  }

  /**
   * Cleans up expired audit logs according to retention class policies.
   */
  @Post('audit/retention-cleanup')
  @HttpCode(HttpStatus.OK)
  @RequireAdminCapability(AdminCapability.ADMIN_SECURITY_MANAGE)
  async cleanupExpiredAuditLogs() {
    return this.adminConsoleService.cleanupExpiredAuditEvents();
  }
}
