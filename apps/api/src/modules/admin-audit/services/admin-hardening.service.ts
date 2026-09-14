import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  AdminSessionContext,
  AdminSessionStatus,
} from '../../admin-session/contracts/admin-session.contract';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_CATEGORIES,
  ADMIN_AUDIT_RETENTION_CLASSES,
  AdminEmergencyLockdownResultDto,
} from '../contracts/admin-audit.contract';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminHardeningService {
  private readonly logger = new Logger(AdminHardeningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Executes emergency platform lockdown: disables the Admin identity and revokes all active Admin sessions.
   * Fails closed across the entire platform.
   */
  async triggerEmergencyLockdown(
    reason: string,
    adminContext: AdminSessionContext,
  ): Promise<AdminEmergencyLockdownResultDto> {
    const admin = await this.prisma.adminIdentity.findUnique({
      where: { id: adminContext.adminId },
    });

    if (!admin) {
      throw new NotFoundException(
        `Admin identity [${adminContext.adminId}] not found.`,
      );
    }

    const now = new Date();

    // 1. Invalidate all active Admin sessions
    const revokeResult = await this.prisma.adminSession.updateMany({
      where: {
        adminId: adminContext.adminId,
        status: AdminSessionStatus.ACTIVE,
      },
      data: {
        status: AdminSessionStatus.REVOKED,
        revokedAt: now,
        revokedReason: `EMERGENCY_LOCKDOWN: ${reason}`,
      },
    });

    // 2. Disable Admin Identity
    await this.prisma.adminIdentity.update({
      where: { id: adminContext.adminId },
      data: {
        status: 'DISABLED',
        disabledAt: now,
        disabledReason: reason,
      },
    });

    // 3. Record Immutable Audit Event
    await this.auditService.recordEvent({
      adminId: adminContext.adminId,
      sessionId: adminContext.sessionId,
      action: ADMIN_AUDIT_ACTIONS.ADMIN_LOCKDOWN_TRIGGERED,
      category: ADMIN_AUDIT_CATEGORIES.SECURITY_INCIDENT,
      retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SECURITY_INCIDENT,
      targetType: 'AdminIdentity',
      targetId: adminContext.adminId,
      outcome: 'SUCCESS',
      metadata: {
        reason,
        revokedSessionsCount: revokeResult.count,
        lockdownAt: now.toISOString(),
      },
    });

    this.logger.error(
      `[EMERGENCY_LOCKDOWN_TRIGGERED] Admin [${adminContext.adminId}] disabled. Revoked ${revokeResult.count} sessions. Reason: ${reason}`,
    );

    return {
      success: true,
      status: 'DISABLED',
      revokedSessionsCount: revokeResult.count,
      lockdownAt: now,
      reason,
    };
  }

  /**
   * Emergency global session revocation across all devices.
   */
  async revokeAllAdminSessions(
    reason: string,
    adminContext: AdminSessionContext,
  ): Promise<{ revokedCount: number }> {
    const now = new Date();

    const result = await this.prisma.adminSession.updateMany({
      where: {
        adminId: adminContext.adminId,
        status: AdminSessionStatus.ACTIVE,
      },
      data: {
        status: AdminSessionStatus.REVOKED,
        revokedAt: now,
        revokedReason: reason,
      },
    });

    await this.auditService.recordEvent({
      adminId: adminContext.adminId,
      sessionId: adminContext.sessionId,
      action: ADMIN_AUDIT_ACTIONS.GLOBAL_SESSIONS_REVOKED,
      category: ADMIN_AUDIT_CATEGORIES.SESSION,
      retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SESSION,
      targetType: 'AdminSession',
      outcome: 'SUCCESS',
      metadata: {
        reason,
        revokedCount: result.count,
      },
    });

    this.logger.warn(
      `[GLOBAL_SESSIONS_REVOKED] Admin [${adminContext.adminId}] globally revoked ${result.count} active sessions.`,
    );

    return { revokedCount: result.count };
  }

  /**
   * Validates operational state of the Admin identity (fails closed if disabled).
   */
  async verifyAdminOperationalState(
    adminId: string,
  ): Promise<{ operational: boolean; status: string; reason?: string }> {
    const admin = await this.prisma.adminIdentity.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException(`Admin identity [${adminId}] not found.`);
    }

    if (admin.status === 'DISABLED') {
      throw new ForbiddenException(
        `Admin identity is locked down and disabled. Reason: ${admin.disabledReason || 'Security lockdown active'}`,
      );
    }

    return {
      operational: true,
      status: admin.status,
    };
  }

  /**
   * Incident response for a compromised passkey: immediately revokes passkey and leaves zero fallback bypasses.
   */
  async handleCompromisedPasskey(
    adminId: string,
    credentialId: string,
    reason: string,
  ): Promise<{ success: boolean }> {
    await this.prisma.adminWebAuthnCredential.updateMany({
      where: {
        adminId,
        credentialId,
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    await this.auditService.recordEvent({
      adminId,
      credentialId,
      action: ADMIN_AUDIT_ACTIONS.ADMIN_WEBAUTHN_AUTHENTICATOR_REJECTED,
      category: ADMIN_AUDIT_CATEGORIES.SECURITY_INCIDENT,
      retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SECURITY_INCIDENT,
      targetType: 'AdminWebAuthnCredential',
      targetId: credentialId,
      outcome: 'FAILURE',
      metadata: { reason },
    });

    this.logger.error(
      `[PASSKEY_COMPROMISE_INCIDENT] Revoked Passkey [${credentialId}] for Admin [${adminId}]. Zero fallback bypasses allowed.`,
    );

    return { success: true };
  }
}
