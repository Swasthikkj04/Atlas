import React, { useState } from 'react';
import {
  formatRetentionWindow,
  formatStorageBytes,
  calculateStorageEfficiency,
  TIER_RETENTION_SCHEDULES,
  type PurgeReceipt,
  type StorageFootprintReport,
  type WorkspaceTier,
} from '../../contracts/data-retention-privacy.contract';

interface DataRetentionPrivacyCardProps {
  readonly tier?: WorkspaceTier;
  readonly footprint?: StorageFootprintReport;
  readonly onPurgeRequested?: (dryRun: boolean) => Promise<PurgeReceipt | void>;
  readonly className?: string;
}

export const DataRetentionPrivacyCard: React.FC<DataRetentionPrivacyCardProps> = ({
  tier = 'FREE',
  footprint,
  onPurgeRequested,
  className = '',
}) => {
  const policy = TIER_RETENTION_SCHEDULES[tier] || TIER_RETENTION_SCHEDULES.FREE;
  const [isRunningPurge, setIsRunningPurge] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<PurgeReceipt | null>(null);

  const totalBytes = footprint?.totalBytes || 1024 * 1024 * 15; // default sample 15MB
  const compressedBytes = footprint?.compressedBytes || 1024 * 1024 * 4; // 4MB
  const reclaimableBytes = footprint?.reclaimableBytes || 1024 * 1024 * 3; // 3MB
  const totalRecords = footprint?.totalRecords || 42;
  const expiredRecords = footprint?.expiredRecords || 8;

  const efficiency = calculateStorageEfficiency(totalBytes, compressedBytes);

  const handleAction = async (dryRun: boolean) => {
    if (!onPurgeRequested || isRunningPurge) return;
    setIsRunningPurge(true);
    try {
      const receipt = await onPurgeRequested(dryRun);
      if (receipt) {
        setLatestReceipt(receipt);
      }
    } finally {
      setIsRunningPurge(false);
    }
  };

  return (
    <div
      data-testid="data-retention-privacy-card"
      className={`rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              Data Retention &amp; Evidence Lifecycle
            </h4>
            <p className="text-[11px] text-slate-400">
              Automated ephemerality bounds, zero-orphan purge &amp; audit trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Automated Purge Active
          </span>
        </div>
      </div>

      {/* Retention Schedule Window Cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Metric 1: Raw Collector Payloads */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400 mb-1">Raw Payloads &amp; Evidence</div>
          <div data-testid="raw-evidence-window" className="text-sm font-semibold text-indigo-300">
            {formatRetentionWindow(policy.rawEvidenceDays)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            HTTP responses, TLS handshakes &amp; raw headers
          </p>
        </div>

        {/* Metric 2: Snapshots & Drift History */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400 mb-1">Snapshots &amp; Drift History</div>
          <div data-testid="snapshot-window" className="text-sm font-semibold text-indigo-300">
            {formatRetentionWindow(policy.snapshotDays)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Synthesized topology &amp; change forensic logs
          </p>
        </div>

        {/* Metric 3: Audit Logs */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="text-[11px] text-slate-400 mb-1">Security Audit Trail</div>
          <div data-testid="audit-log-window" className="text-sm font-semibold text-indigo-300">
            {formatRetentionWindow(policy.auditLogDays)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Compliance events &amp; cryptographic proofs
          </p>
        </div>
      </div>

      {/* Storage Footprint & Reclaim Gauge */}
      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-3.5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-300 font-medium">Evidence Storage Footprint</span>
          <span className="font-mono text-slate-400">
            {formatStorageBytes(totalBytes)} ({totalRecords} records)
          </span>
        </div>

        {/* Multi-tier Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 flex">
          <div
            className="h-full bg-indigo-500"
            style={{ width: `${Math.max(10, 100 - (reclaimableBytes / totalBytes) * 100)}%` }}
            title="Active Valid Evidence"
          />
          <div
            className="h-full bg-amber-500"
            style={{ width: `${Math.min(90, (reclaimableBytes / totalBytes) * 100)}%` }}
            title="Expired Pending Purge"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Gzip Compression: <strong className="text-emerald-400">{efficiency}% saved</strong></span>
          {reclaimableBytes > 0 && (
            <span data-testid="reclaimable-text" className="text-amber-400 font-medium">
              ~{formatStorageBytes(reclaimableBytes)} ({expiredRecords} expired records) reclaimable
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      {onPurgeRequested && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
          <p className="text-[11px] text-slate-400">
            Trigger automated cycle early or run a safe dry-run preview.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isRunningPurge}
              onClick={() => handleAction(true)}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
            >
              Preview Purge
            </button>
            <button
              type="button"
              disabled={isRunningPurge}
              onClick={() => handleAction(false)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition disabled:opacity-50"
            >
              Purge Expired
            </button>
          </div>
        </div>
      )}

      {/* Cryptographic Audit Proof Stamp */}
      {latestReceipt && (
        <div
          data-testid="purge-audit-receipt"
          className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs"
        >
          <div className="flex items-center justify-between font-medium text-emerald-300 mb-1">
            <span>
              {latestReceipt.dryRun ? 'Purge Preview Result' : 'Cryptographic Deletion Receipt'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{latestReceipt.timestamp}</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            {latestReceipt.dryRun ? 'Identified' : 'Successfully purged'}{' '}
            <strong>{latestReceipt.purgedCount} records</strong>, reclaiming{' '}
            <strong>{formatStorageBytes(latestReceipt.reclaimedBytes)}</strong>.
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/90 break-all">
            <span className="text-slate-400 shrink-0">SHA-256:</span>
            <span>{latestReceipt.auditProofSha256}</span>
          </div>
        </div>
      )}
    </div>
  );
};
