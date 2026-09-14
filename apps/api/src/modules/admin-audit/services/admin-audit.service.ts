import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  ADMIN_AUDIT_CATEGORIES,
  ADMIN_AUDIT_RETENTION_CLASSES,
  AdminAuditChainVerificationResultDto,
  AdminAuditEventDto,
  AdminAuditQueryDto,
  AdminPaginatedAuditDto,
  CreateAdminAuditEventInput,
  RETENTION_DAYS_BY_CLASS,
} from '../contracts/admin-audit.contract';
import {
  AdminAuditCryptoService,
  GENESIS_HASH,
} from './admin-audit-crypto.service';
import { AdminAnomalyDetectionService } from './admin-anomaly-detection.service';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: AdminAuditCryptoService,
    private readonly anomalyService: AdminAnomalyDetectionService,
  ) {}

  /**
   * Records an immutable, tamper-evident audit event with cryptographic hash chaining.
   */
  async recordEvent(
    input: CreateAdminAuditEventInput,
  ): Promise<AdminAuditEventDto> {
    const category = input.category || ADMIN_AUDIT_CATEGORIES.SECURITY_INCIDENT;
    const retentionClass =
      input.retentionClass || ADMIN_AUDIT_RETENTION_CLASSES.SECURITY_INCIDENT;
    const outcome = input.outcome || 'SUCCESS';
    const createdAt = input.createdAt || new Date();

    // 1. Retrieve the latest event to link the hash chain
    const latestEvent = await this.prisma.adminAuditEvent.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const previousHash = latestEvent?.eventHash || GENESIS_HASH;

    // 2. Compute the cryptographic hash for this event
    const eventHash = this.cryptoService.computeEventHash({
      previousHash,
      action: input.action,
      category,
      adminId: input.adminId,
      sessionId: input.sessionId,
      credentialId: input.credentialId,
      targetType: input.targetType,
      targetId: input.targetId,
      outcome,
      createdAt,
      metadata: input.metadata,
    });

    const sanitizedMetadata = this.cryptoService.sanitizeMetadata(
      input.metadata,
    );

    // 3. Persist the event record
    const created = await this.prisma.adminAuditEvent.create({
      data: {
        adminId: input.adminId,
        sessionId: input.sessionId,
        credentialId: input.credentialId,
        action: input.action,
        category,
        retentionClass,
        targetType: input.targetType,
        targetId: input.targetId,
        outcome,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: sanitizedMetadata ?? undefined,
        previousHash,
        eventHash,
        createdAt,
      },
    });

    this.logger.log(
      `[AuditEvent: ${input.action}] category=${category} outcome=${outcome} adminId=${input.adminId || 'anonymous'} hash=${eventHash.slice(0, 8)}`,
    );

    return {
      id: created.id,
      adminId: created.adminId,
      sessionId: created.sessionId,
      credentialId: created.credentialId,
      action: created.action,
      category: created.category,
      retentionClass: created.retentionClass,
      targetType: created.targetType,
      targetId: created.targetId,
      outcome: created.outcome,
      ipAddress: created.ipAddress,
      userAgent: created.userAgent,
      metadata: created.metadata as Record<string, any> | null,
      previousHash: created.previousHash,
      eventHash: created.eventHash,
      createdAt: created.createdAt,
    };
  }

  /**
   * Verifies the cryptographic chain integrity of all historical audit events.
   */
  async verifyAuditChainIntegrity(): Promise<AdminAuditChainVerificationResultDto> {
    const events = await this.prisma.adminAuditEvent.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const mappedEvents: AdminAuditEventDto[] = events.map((e) => ({
      id: e.id,
      adminId: e.adminId,
      sessionId: e.sessionId,
      credentialId: e.credentialId,
      action: e.action,
      category: e.category,
      retentionClass: e.retentionClass,
      targetType: e.targetType,
      targetId: e.targetId,
      outcome: e.outcome,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      metadata: e.metadata as Record<string, any> | null,
      previousHash: e.previousHash,
      eventHash: e.eventHash,
      createdAt: e.createdAt,
    }));

    return this.cryptoService.verifyChain(mappedEvents);
  }

  /**
   * Server-side paginated and filterable audit log query.
   */
  async getAuditEvents(
    query: AdminAuditQueryDto,
  ): Promise<AdminPaginatedAuditDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.outcome) where.outcome = query.outcome;
    if (query.category) where.category = query.category;
    if (query.retentionClass) where.retentionClass = query.retentionClass;

    const [events, total] = await Promise.all([
      this.prisma.adminAuditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAuditEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        adminId: e.adminId,
        sessionId: e.sessionId,
        credentialId: e.credentialId,
        action: e.action,
        category: e.category,
        retentionClass: e.retentionClass,
        targetType: e.targetType,
        targetId: e.targetId,
        outcome: e.outcome,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        metadata: e.metadata as Record<string, any> | null,
        previousHash: e.previousHash,
        eventHash: e.eventHash,
        createdAt: e.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Enforces data retention windows across all retention classes.
   */
  async cleanupExpiredEvents(): Promise<{ deletedCount: number }> {
    let totalDeleted = 0;
    const now = Date.now();

    for (const [retentionClass, days] of Object.entries(
      RETENTION_DAYS_BY_CLASS,
    )) {
      const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);
      const res = await this.prisma.adminAuditEvent.deleteMany({
        where: {
          retentionClass,
          createdAt: { lt: cutoffDate },
        },
      });
      totalDeleted += res.count;
    }

    this.logger.log(
      `[RetentionCleanup] Deleted ${totalDeleted} expired audit events`,
    );
    return { deletedCount: totalDeleted };
  }
}
