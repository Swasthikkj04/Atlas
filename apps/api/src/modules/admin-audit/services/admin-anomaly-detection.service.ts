import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_CATEGORIES,
  ADMIN_AUDIT_RETENTION_CLASSES,
} from '../contracts/admin-audit.contract';
import {
  AdminAuditCryptoService,
  GENESIS_HASH,
} from './admin-audit-crypto.service';

interface AnomalyWindowEntry {
  timestamp: number;
  ipAddress: string;
}

@Injectable()
export class AdminAnomalyDetectionService {
  private readonly logger = new Logger(AdminAnomalyDetectionService.name);

  // In-memory sliding window trackers
  private readonly authFailures = new Map<string, AnomalyWindowEntry[]>();
  private readonly tokenRejections = new Map<string, AnomalyWindowEntry[]>();
  private readonly activeSessionIps = new Map<string, Set<string>>();

  // Anomaly metrics counters
  private suspiciousBurstCount = 0;
  private cloneAttemptsCount = 0;
  private unauthorizedProbingCount = 0;
  private concurrentAccessCount = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: AdminAuditCryptoService,
  ) {}

  /**
   * Tracks authentication failures and triggers SUSPICIOUS_AUTHENTICATION_BURST if threshold exceeded.
   */
  async recordAuthFailure(
    identifier: string,
    ipAddress: string,
  ): Promise<void> {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15-minute window
    const key = `${identifier}:${ipAddress}`;

    const entries = (this.authFailures.get(key) || []).filter(
      (e) => now - e.timestamp < windowMs,
    );
    entries.push({ timestamp: now, ipAddress });
    this.authFailures.set(key, entries);

    if (entries.length >= 5) {
      this.suspiciousBurstCount++;
      this.logger.warn(
        `[SECURITY_ANOMALY: SUSPICIOUS_AUTHENTICATION_BURST] Repeated auth failures (${entries.length}) for [${identifier}] from IP [${ipAddress}]`,
      );

      await this.persistSecurityIncident({
        action: ADMIN_AUDIT_ACTIONS.SUSPICIOUS_AUTHENTICATION_BURST,
        ipAddress,
        metadata: {
          identifier,
          failureCount: entries.length,
          windowMinutes: 15,
        },
      });
    }
  }

  /**
   * Records critical passkey counter anomalies (WebAuthn clone detection).
   */
  async recordCounterAnomaly(
    adminId: string,
    credentialId: string,
    storedCounter: bigint,
    incomingCounter: bigint,
    ipAddress?: string,
  ): Promise<void> {
    this.cloneAttemptsCount++;
    this.logger.error(
      `[SECURITY_ALERT: CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT] Admin [${adminId}] Passkey [${credentialId}]. Stored: ${storedCounter}, Incoming: ${incomingCounter}`,
    );

    await this.persistSecurityIncident({
      adminId,
      credentialId,
      action: ADMIN_AUDIT_ACTIONS.CRITICAL_AUTHENTICATOR_CLONE_ATTEMPT,
      targetType: 'AdminWebAuthnCredential',
      targetId: credentialId,
      ipAddress,
      metadata: {
        storedCounter: storedCounter.toString(),
        incomingCounter: incomingCounter.toString(),
        severity: 'CRITICAL',
      },
    });
  }

  /**
   * Tracks repeated token rejections and unauthorized probing.
   */
  async recordTokenRejection(ipAddress: string, reason: string): Promise<void> {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5-minute window
    const key = ipAddress || 'unknown';

    const entries = (this.tokenRejections.get(key) || []).filter(
      (e) => now - e.timestamp < windowMs,
    );
    entries.push({ timestamp: now, ipAddress });
    this.tokenRejections.set(key, entries);

    if (entries.length >= 5) {
      this.unauthorizedProbingCount++;
      this.logger.warn(
        `[SECURITY_ANOMALY: SUSPICIOUS_UNAUTHORIZED_PROBING] Repeated token rejections (${entries.length}) from IP [${ipAddress}]. Last reason: ${reason}`,
      );

      await this.persistSecurityIncident({
        action: ADMIN_AUDIT_ACTIONS.SUSPICIOUS_UNAUTHORIZED_PROBING,
        ipAddress,
        metadata: {
          rejectionCount: entries.length,
          lastReason: reason,
          windowMinutes: 5,
        },
      });
    }
  }

  /**
   * Tracks concurrent session creation across disparate IP addresses.
   */
  async recordSessionCreation(
    adminId: string,
    sessionId: string,
    ipAddress?: string,
  ): Promise<void> {
    if (!ipAddress) return;

    const ips = this.activeSessionIps.get(adminId) || new Set<string>();
    ips.add(ipAddress);
    this.activeSessionIps.set(adminId, ips);

    if (ips.size >= 3) {
      this.concurrentAccessCount++;
      this.logger.warn(
        `[SECURITY_ANOMALY: SUSPICIOUS_CONCURRENT_ACCESS] Admin [${adminId}] active across ${ips.size} distinct IP addresses`,
      );

      await this.persistSecurityIncident({
        adminId,
        sessionId,
        action: ADMIN_AUDIT_ACTIONS.SUSPICIOUS_CONCURRENT_ACCESS,
        targetType: 'AdminSession',
        targetId: sessionId,
        ipAddress,
        metadata: {
          distinctIpCount: ips.size,
          observedIps: Array.from(ips),
        },
      });
    }
  }

  /**
   * Returns current detection telemetry metrics.
   */
  getAnomalyMetrics() {
    return {
      suspiciousBurstCount: this.suspiciousBurstCount,
      cloneAttemptsCount: this.cloneAttemptsCount,
      unauthorizedProbingCount: this.unauthorizedProbingCount,
      concurrentAccessCount: this.concurrentAccessCount,
    };
  }

  /**
   * Helper to persist a tamper-evident security incident audit event.
   */
  private async persistSecurityIncident(input: {
    adminId?: string;
    sessionId?: string;
    credentialId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const latestEvent = await this.prisma.adminAuditEvent.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const previousHash = latestEvent?.eventHash || GENESIS_HASH;
      const createdAt = new Date();

      const eventHash = this.cryptoService.computeEventHash({
        previousHash,
        action: input.action,
        category: ADMIN_AUDIT_CATEGORIES.SECURITY_INCIDENT,
        adminId: input.adminId,
        sessionId: input.sessionId,
        credentialId: input.credentialId,
        targetType: input.targetType,
        targetId: input.targetId,
        outcome: 'FAILURE',
        createdAt,
        metadata: input.metadata,
      });

      await this.prisma.adminAuditEvent.create({
        data: {
          adminId: input.adminId,
          sessionId: input.sessionId,
          credentialId: input.credentialId,
          action: input.action,
          category: ADMIN_AUDIT_CATEGORIES.SECURITY_INCIDENT,
          retentionClass: ADMIN_AUDIT_RETENTION_CLASSES.SECURITY_INCIDENT,
          targetType: input.targetType,
          targetId: input.targetId,
          outcome: 'FAILURE',
          ipAddress: input.ipAddress,
          metadata:
            (this.cryptoService.sanitizeMetadata(input.metadata) as any) ??
            undefined,
          previousHash,
          eventHash,
          createdAt,
        },
      });
    } catch (err) {
      this.logger.error('Failed to persist security incident audit event', err);
    }
  }
}
