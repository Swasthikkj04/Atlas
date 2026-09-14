import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AdminStatus } from '../../admin-identity/contracts/admin-identity.contract';
import { AuthenticatedAdminResult } from '../../admin-webauthn/contracts/admin-webauthn.contract';
import {
  ADMIN_AUTH_POLICY,
  AdminSessionAuditEvent,
  AdminSessionContext,
  AdminSessionDto,
  AdminSessionStatus,
  AdminTokenResponse,
} from '../contracts/admin-session.contract';
import {
  AdminSessionExpiredException,
  AdminSessionNotFoundException,
  AdminSessionRevokedException,
} from '../exceptions/admin-session.exception';
import { AdminJwtCryptoService } from './admin-jwt-crypto.service';

@Injectable()
export class AdminSessionService {
  private readonly logger = new Logger(AdminSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminJwtCrypto: AdminJwtCryptoService,
  ) {}

  /**
   * Creates a dedicated Admin session from a verified AuthenticatedAdminResult (from ADMIN-004).
   * Generates short-lived Admin access JWT bound to the session.
   */
  async createSession(
    result: AuthenticatedAdminResult,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminTokenResponse> {
    const expiresAt = new Date(
      Date.now() + ADMIN_AUTH_POLICY.sessionTtlSeconds * 1000,
    );

    // 1. Create authoritative AdminSession in PostgreSQL
    const session = await this.prisma.adminSession.create({
      data: {
        adminId: result.adminIdentityId,
        credentialId: result.credentialId,
        assuranceLevel: result.assuranceLevel || 'AAL3',
        status: AdminSessionStatus.ACTIVE,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        expiresAt,
      },
    });

    // 2. Issue short-lived Admin access JWT bound to this session
    const { accessToken, expiresIn } = this.adminJwtCrypto.signAdminToken({
      adminIdentityId: result.adminIdentityId,
      sessionId: session.id,
      identifier: result.identifier,
      assuranceLevel: 'AAL3',
    });

    // 3. Emit audit events (without leaking token secret/JWT)
    this.logger.log(
      `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_SESSION_CREATED}] Session [${session.id}] created for Admin [${result.adminIdentityId}]. Assurance=${result.assuranceLevel}`,
    );
    this.logger.log(
      `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_JWT_ISSUED}] Admin JWT issued for Session [${session.id}]. TTL=${expiresIn}s`,
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      sessionId: session.id,
      assuranceLevel: 'AAL3',
    };
  }

  /**
   * Validates an incoming Admin JWT token against the cryptographic boundary and authoritative session state.
   */
  async validateAdminToken(
    token: string,
    clientContext?: { ipAddress?: string; userAgent?: string },
  ): Promise<AdminSessionContext> {
    // 1. Cryptographically verify signature and claims
    const payload = this.adminJwtCrypto.verifyAdminToken(token);

    // 2. Query authoritative session state
    const session = await this.prisma.adminSession.findUnique({
      where: { id: payload.sid },
      include: { admin: true },
    });

    if (!session) {
      this.logger.warn(`Admin session [${payload.sid}] not found.`);
      throw new AdminSessionNotFoundException(
        'Admin session not found or deleted.',
      );
    }

    // 3. Check Session Status
    if (session.status === AdminSessionStatus.REVOKED) {
      this.logger.warn(
        `Admin session [${session.id}] has been revoked. Reason: ${session.revokedReason}`,
      );
      throw new AdminSessionRevokedException('Admin session has been revoked.');
    }

    if (
      session.status === AdminSessionStatus.EXPIRED ||
      session.expiresAt < new Date()
    ) {
      if (session.status === AdminSessionStatus.ACTIVE) {
        await this.prisma.adminSession.update({
          where: { id: session.id },
          data: { status: AdminSessionStatus.EXPIRED },
        });
        this.logger.log(
          `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_SESSION_EXPIRED}] Session [${session.id}] expired.`,
        );
      }
      throw new AdminSessionExpiredException('Admin session has expired.');
    }

    // 4. Verify Identity Binding & Status
    if (
      !session.admin ||
      session.admin.status !== AdminStatus.ACTIVE ||
      session.adminId !== payload.sub
    ) {
      this.logger.error(
        `Admin identity [${payload.sub}] is inactive or mismatched for session [${session.id}].`,
      );
      throw new AdminSessionRevokedException(
        'Admin identity is inactive or suspended.',
      );
    }

    // 5. Session IP & User-Agent binding telemetry
    if (
      session.ipAddress &&
      clientContext?.ipAddress &&
      clientContext.ipAddress !== 'unknown' &&
      session.ipAddress !== clientContext.ipAddress
    ) {
      this.logger.warn(
        `[AdminSessionTelemetry] IP deviation observed for Session [${session.id}]: Enrolled=${session.ipAddress}, Current=${clientContext.ipAddress}`,
      );
    }

    // 6. Update session activity timestamp
    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      adminId: session.adminId,
      identifier: session.admin.identifier,
      sessionId: session.id,
      assuranceLevel: 'AAL3',
      authenticatedAt: session.createdAt,
    };
  }

  /**
   * Revokes an individual Admin session.
   */
  async revokeSession(
    sessionId: string,
    reason = 'Admin session revoked',
  ): Promise<AdminSessionDto> {
    const updated = await this.prisma.adminSession.update({
      where: { id: sessionId },
      data: {
        status: AdminSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    this.logger.log(
      `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_SESSION_REVOKED}] Session [${sessionId}] revoked. Reason: ${reason}`,
    );

    return updated as AdminSessionDto;
  }

  /**
   * Revokes all active sessions for an Admin identity (Incident response / global revocation).
   */
  async revokeAllAdminSessions(
    adminId: string,
    reason = 'Global Admin session revocation',
  ): Promise<{ revokedCount: number }> {
    const result = await this.prisma.adminSession.updateMany({
      where: {
        adminId,
        status: AdminSessionStatus.ACTIVE,
      },
      data: {
        status: AdminSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    this.logger.warn(
      `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_SESSION_REVOKED_ALL}] Revoked ${result.count} active sessions for Admin [${adminId}]. Reason: ${reason}`,
    );

    return { revokedCount: result.count };
  }

  /**
   * Explicit Admin logout ceremony.
   */
  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId, 'Admin explicit logout');
    this.logger.log(
      `[AuditEvent: ${AdminSessionAuditEvent.ADMIN_LOGOUT}] Session [${sessionId}] logged out.`,
    );
  }

  /**
   * Lists all active sessions for the Admin.
   */
  async listActiveSessions(adminId: string): Promise<AdminSessionDto[]> {
    const sessions = await this.prisma.adminSession.findMany({
      where: {
        adminId,
        status: AdminSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions as AdminSessionDto[];
  }
}
