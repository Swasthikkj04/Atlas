export type RetentionDataCategory =
  | 'RAW_EVIDENCE'
  | 'INFRASTRUCTURE_SNAPSHOT'
  | 'CHANGE_HISTORY'
  | 'GUEST_SESSION'
  | 'SECURITY_AUDIT_LOG';

export interface TierRetentionConfig {
  readonly tier: 'GUEST' | 'FREE' | 'PRO' | 'ENTERPRISE';
  readonly rawEvidenceDays: number;
  readonly snapshotDays: number;
  readonly changeHistoryDays: number;
  readonly guestSessionHours: number;
  readonly auditLogDays: number;
}

export const TIER_RETENTION_POLICIES: Record<string, TierRetentionConfig> = {
  GUEST: {
    tier: 'GUEST',
    rawEvidenceDays: 1, // 24 hours strict
    snapshotDays: 1,
    changeHistoryDays: 1,
    guestSessionHours: 24,
    auditLogDays: 90,
  },
  FREE: {
    tier: 'FREE',
    rawEvidenceDays: 7, // 7 days raw collector payloads
    snapshotDays: 14, // 14 days snapshots
    changeHistoryDays: 30, // 30 days change history
    guestSessionHours: 24,
    auditLogDays: 90,
  },
  PRO: {
    tier: 'PRO',
    rawEvidenceDays: 30, // 30 days raw collector payloads
    snapshotDays: 90, // 90 days snapshots
    changeHistoryDays: 180, // 180 days change history
    guestSessionHours: 24,
    auditLogDays: 365,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    rawEvidenceDays: 90, // 90 days raw collector payloads
    snapshotDays: 365, // 365 days snapshots
    changeHistoryDays: 730, // 2 years change history
    guestSessionHours: 24,
    auditLogDays: 1095, // 3 years audit logs
  },
};

export interface PurgeExecutionResult {
  readonly category: RetentionDataCategory;
  readonly evaluatedCount: number;
  readonly purgedCount: number;
  readonly reclaimedBytes: number;
  readonly oldestPurgedTimestamp?: Date;
  readonly newestPurgedTimestamp?: Date;
  readonly cutoffDate: Date;
  readonly executionDurationMs: number;
  readonly dryRun: boolean;
  readonly auditProofSha256: string;
}

export interface RetentionStorageFootprint {
  readonly totalEvidenceRecords: number;
  readonly totalEvidenceBytes: number;
  readonly compressedEvidenceBytes: number;
  readonly expiredEvidenceCount: number;
  readonly estimatedReclaimableBytes: number;
  readonly oldestEvidenceDate?: Date;
  readonly newestEvidenceDate?: Date;
  readonly tierPolicy: TierRetentionConfig;
}
