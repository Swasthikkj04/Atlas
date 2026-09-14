import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceRepository } from '../repositories/evidence.repository';
import {
  PurgeExecutionResult,
  RetentionDataCategory,
  RetentionStorageFootprint,
  TIER_RETENTION_POLICIES,
  TierRetentionConfig,
} from '../contracts/evidence-retention.interface';

@Injectable()
export class DataRetentionPurgeService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DataRetentionPurgeService.name);
  private purgeIntervalTimer?: NodeJS.Timeout;
  private isPurgeRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly evidenceRepository: EvidenceRepository,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const autoPurgeEnabled =
      this.configService.get<string>('AUTO_DATA_PURGE_ENABLED') !== 'false';
    const intervalHours =
      Number(this.configService.get<string>('DATA_PURGE_INTERVAL_HOURS')) || 24;

    if (autoPurgeEnabled) {
      this.logger.log(
        `Automated data retention purge scheduler initialized (interval: ${intervalHours}h)`,
      );
      // Run daily purge interval
      this.purgeIntervalTimer = setInterval(
        () => {
          this.runFullLifecyclePurge().catch((err) =>
            this.logger.error('Error executing automated lifecycle purge', err),
          );
        },
        intervalHours * 60 * 60 * 1000,
      );

      if (this.purgeIntervalTimer.unref) {
        this.purgeIntervalTimer.unref();
      }
    }
  }

  onModuleDestroy(): void {
    if (this.purgeIntervalTimer) {
      clearInterval(this.purgeIntervalTimer);
    }
  }

  getTierPolicy(tier = 'FREE'): TierRetentionConfig {
    return TIER_RETENTION_POLICIES[tier] || TIER_RETENTION_POLICIES.FREE;
  }

  /**
   * Evaluates storage footprint and aging metrics for a domain or whole workspace.
   */
  async getStorageFootprint(
    domainId?: string,
    tier = 'FREE',
  ): Promise<RetentionStorageFootprint> {
    const policy = this.getTierPolicy(tier);
    const stats =
      await this.evidenceRepository.getEvidenceStorageStats(domainId);

    const cutoffDate = new Date(
      Date.now() - policy.rawEvidenceDays * 24 * 60 * 60 * 1000,
    );
    const expiredCount = await this.evidenceRepository.countExpiredEvidence(
      cutoffDate,
      domainId,
    );

    // Estimate reclaimable bytes based on expired ratio
    const expiredRatio =
      stats.totalCount > 0 ? expiredCount / stats.totalCount : 0;
    const estimatedReclaimableBytes = Math.round(
      stats.totalSizeBytes * expiredRatio,
    );

    return {
      totalEvidenceRecords: stats.totalCount,
      totalEvidenceBytes: stats.totalSizeBytes,
      compressedEvidenceBytes: stats.compressedSizeBytes,
      expiredEvidenceCount: expiredCount,
      estimatedReclaimableBytes,
      oldestEvidenceDate: stats.oldestDate || undefined,
      newestEvidenceDate: stats.newestDate || undefined,
      tierPolicy: policy,
    };
  }

  /**
   * Purges expired raw evidence collector payloads according to retention policy.
   */
  async purgeExpiredRawEvidence(options?: {
    domainId?: string;
    tier?: string;
    dryRun?: boolean;
    batchSize?: number;
  }): Promise<PurgeExecutionResult> {
    const startTime = Date.now();
    const tier = options?.tier || 'FREE';
    const policy = this.getTierPolicy(tier);
    const dryRun = Boolean(options?.dryRun);
    const batchSize = options?.batchSize || 1000;

    const cutoffDate = new Date(
      Date.now() - policy.rawEvidenceDays * 24 * 60 * 60 * 1000,
    );

    const expiredRecords = await this.evidenceRepository.findExpiredEvidence(
      cutoffDate,
      options?.domainId,
      batchSize,
    );

    const evaluatedCount = expiredRecords.length;
    let purgedCount = 0;
    let reclaimedBytes = 0;

    let oldestTimestamp: Date | undefined;
    let newestTimestamp: Date | undefined;

    if (evaluatedCount > 0) {
      oldestTimestamp = expiredRecords[0].capturedAt;
      newestTimestamp = expiredRecords[evaluatedCount - 1].capturedAt;

      reclaimedBytes = expiredRecords.reduce(
        (acc, r) => acc + (r.sizeBytes || 0),
        0,
      );

      if (!dryRun) {
        const ids = expiredRecords.map((r) => r.id);
        purgedCount = await this.evidenceRepository.deleteEvidenceBatch(ids);
        this.logger.log(
          `Purged ${purgedCount} expired raw evidence records for domain=${options?.domainId || 'ALL'}, reclaimed ${reclaimedBytes} bytes.`,
        );
      } else {
        purgedCount = evaluatedCount;
        this.logger.debug(
          `[DRY RUN] Would purge ${purgedCount} expired raw evidence records, reclaiming ~${reclaimedBytes} bytes.`,
        );
      }
    }

    const durationMs = Date.now() - startTime;
    const auditProofSha256 = this.generatePurgeAuditProof({
      category: 'RAW_EVIDENCE',
      evaluatedCount,
      purgedCount,
      reclaimedBytes,
      cutoffDate,
      dryRun,
    });

    return {
      category: 'RAW_EVIDENCE',
      evaluatedCount,
      purgedCount,
      reclaimedBytes,
      oldestPurgedTimestamp: oldestTimestamp,
      newestPurgedTimestamp: newestTimestamp,
      cutoffDate,
      executionDurationMs: durationMs,
      dryRun,
      auditProofSha256,
    };
  }

  /**
   * Purges expired guest experience sessions older than 24 hours (S08-I04).
   */
  async purgeExpiredGuestSessions(options?: {
    dryRun?: boolean;
  }): Promise<PurgeExecutionResult> {
    const startTime = Date.now();
    const dryRun = Boolean(options?.dryRun);
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredGuestSessions = await this.prisma.guestSession.findMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { createdAt: { lt: cutoffDate } },
        ],
      },
      take: 1000,
    });

    const evaluatedCount = expiredGuestSessions.length;
    let purgedCount = 0;

    if (evaluatedCount > 0) {
      if (!dryRun) {
        const ids = expiredGuestSessions.map((s) => s.id);
        const delRes = await this.prisma.guestSession.deleteMany({
          where: { id: { in: ids } },
        });
        purgedCount = delRes.count;
        this.logger.log(`Purged ${purgedCount} expired guest sessions.`);
      } else {
        purgedCount = evaluatedCount;
      }
    }

    const durationMs = Date.now() - startTime;
    const auditProofSha256 = this.generatePurgeAuditProof({
      category: 'GUEST_SESSION',
      evaluatedCount,
      purgedCount,
      reclaimedBytes: 0,
      cutoffDate,
      dryRun,
    });

    return {
      category: 'GUEST_SESSION',
      evaluatedCount,
      purgedCount,
      reclaimedBytes: 0,
      cutoffDate,
      executionDurationMs: durationMs,
      dryRun,
      auditProofSha256,
    };
  }

  /**
   * Purges expired snapshots and cascading findings/briefs past the tier retention window.
   */
  async purgeExpiredSnapshots(options?: {
    domainId?: string;
    tier?: string;
    dryRun?: boolean;
    batchSize?: number;
  }): Promise<PurgeExecutionResult> {
    const startTime = Date.now();
    const tier = options?.tier || 'FREE';
    const policy = this.getTierPolicy(tier);
    const dryRun = Boolean(options?.dryRun);
    const batchSize = options?.batchSize || 200;

    const cutoffDate = new Date(
      Date.now() - policy.snapshotDays * 24 * 60 * 60 * 1000,
    );

    const expiredSnapshots = await this.prisma.infrastructureSnapshot.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        ...(options?.domainId ? { domainId: options.domainId } : {}),
      },
      select: { id: true, createdAt: true },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    const evaluatedCount = expiredSnapshots.length;
    let purgedCount = 0;

    if (evaluatedCount > 0) {
      if (!dryRun) {
        const ids = expiredSnapshots.map((s) => s.id);
        const delRes = await this.prisma.infrastructureSnapshot.deleteMany({
          where: { id: { in: ids } },
        });
        purgedCount = delRes.count;
        this.logger.log(
          `Purged ${purgedCount} expired snapshots (cutoff: ${cutoffDate.toISOString()}).`,
        );
      } else {
        purgedCount = evaluatedCount;
      }
    }

    const durationMs = Date.now() - startTime;
    const auditProofSha256 = this.generatePurgeAuditProof({
      category: 'INFRASTRUCTURE_SNAPSHOT',
      evaluatedCount,
      purgedCount,
      reclaimedBytes: 0,
      cutoffDate,
      dryRun,
    });

    return {
      category: 'INFRASTRUCTURE_SNAPSHOT',
      evaluatedCount,
      purgedCount,
      reclaimedBytes: 0,
      cutoffDate,
      executionDurationMs: durationMs,
      dryRun,
      auditProofSha256,
    };
  }

  /**
   * Runs the complete lifecycle retention purge across all categories.
   */
  async runFullLifecyclePurge(options?: {
    tier?: string;
    dryRun?: boolean;
  }): Promise<{
    results: PurgeExecutionResult[];
    totalPurged: number;
    totalReclaimedBytes: number;
    executedAt: string;
  }> {
    if (this.isPurgeRunning) {
      this.logger.warn(
        'Lifecycle purge is already in progress, skipping concurrent run.',
      );
      return {
        results: [],
        totalPurged: 0,
        totalReclaimedBytes: 0,
        executedAt: new Date().toISOString(),
      };
    }

    this.isPurgeRunning = true;
    try {
      const evidenceResult = await this.purgeExpiredRawEvidence(options);
      const guestResult = await this.purgeExpiredGuestSessions(options);
      const snapshotResult = await this.purgeExpiredSnapshots(options);

      const results = [evidenceResult, guestResult, snapshotResult];
      const totalPurged = results.reduce((acc, r) => acc + r.purgedCount, 0);
      const totalReclaimedBytes = results.reduce(
        (acc, r) => acc + r.reclaimedBytes,
        0,
      );

      return {
        results,
        totalPurged,
        totalReclaimedBytes,
        executedAt: new Date().toISOString(),
      };
    } finally {
      this.isPurgeRunning = false;
    }
  }

  /**
   * Generates a tamper-evident cryptographic SHA-256 hash verifying the purge execution.
   */
  generatePurgeAuditProof(params: {
    category: RetentionDataCategory;
    evaluatedCount: number;
    purgedCount: number;
    reclaimedBytes: number;
    cutoffDate: Date;
    dryRun: boolean;
  }): string {
    const raw = `${params.category}:${params.cutoffDate.toISOString()}:${params.evaluatedCount}:${params.purgedCount}:${params.reclaimedBytes}:${params.dryRun}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
