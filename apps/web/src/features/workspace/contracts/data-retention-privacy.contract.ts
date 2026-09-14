/**
 * Certified P2 Invariants and Contracts for Data Protection, Granular Retention & Evidence Purging.
 */

export const P2_DATA_RETENTION_INVARIANTS = {
  P2_GRANULAR_TIER_RETENTION_POLICIES: true,
  P2_AUTOMATED_EVIDENCE_LIFECYCLE_PURGING: true,
  P2_EPHEMERAL_GX_PURGE_24H: true,
  P2_CRYPTOGRAPHIC_PURGE_AUDIT_TRAIL: true,
  P2_ZERO_ORPHAN_CASCADE_DELETION: true,
} as const;

export type WorkspaceTier = 'GUEST' | 'FREE' | 'PRO' | 'ENTERPRISE';

export interface TierRetentionPolicy {
  readonly tier: WorkspaceTier;
  readonly rawEvidenceDays: number;
  readonly snapshotDays: number;
  readonly changeHistoryDays: number;
  readonly guestSessionHours: number;
  readonly auditLogDays: number;
}

export const TIER_RETENTION_SCHEDULES: Record<WorkspaceTier, TierRetentionPolicy> = {
  GUEST: {
    tier: 'GUEST',
    rawEvidenceDays: 1,
    snapshotDays: 1,
    changeHistoryDays: 1,
    guestSessionHours: 24,
    auditLogDays: 90,
  },
  FREE: {
    tier: 'FREE',
    rawEvidenceDays: 7,
    snapshotDays: 14,
    changeHistoryDays: 30,
    guestSessionHours: 24,
    auditLogDays: 90,
  },
  PRO: {
    tier: 'PRO',
    rawEvidenceDays: 30,
    snapshotDays: 90,
    changeHistoryDays: 180,
    guestSessionHours: 24,
    auditLogDays: 365,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    rawEvidenceDays: 90,
    snapshotDays: 365,
    changeHistoryDays: 730,
    guestSessionHours: 24,
    auditLogDays: 1095,
  },
};

export interface StorageFootprintReport {
  readonly totalRecords: number;
  readonly totalBytes: number;
  readonly compressedBytes: number;
  readonly expiredRecords: number;
  readonly reclaimableBytes: number;
  readonly oldestRecordDate?: string;
  readonly newestRecordDate?: string;
  readonly tierPolicy: TierRetentionPolicy;
}

export interface PurgeReceipt {
  readonly category: string;
  readonly evaluatedCount: number;
  readonly purgedCount: number;
  readonly reclaimedBytes: number;
  readonly executionDurationMs: number;
  readonly dryRun: boolean;
  readonly auditProofSha256: string;
  readonly timestamp: string;
}

export function formatStorageBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${val} ${units[i]}`;
}

export function formatRetentionWindow(days: number): string {
  if (days === 1) return '24 Hours';
  if (days < 30) return `${days} Days`;
  if (days < 365) return `${Math.round(days / 30)} Months`;
  return `${Math.round(days / 365)} Year${Math.round(days / 365) > 1 ? 's' : ''}`;
}

export function calculateStorageEfficiency(totalBytes: number, compressedBytes: number): number {
  if (totalBytes <= 0 || compressedBytes <= 0) return 0;
  return Math.round(((totalBytes - compressedBytes) / totalBytes) * 100);
}
