import type { InfrastructureSnapshotDto, UnderstandingJobDto } from '../../../types/api';

/**
 * WX-1012: Authoritative Understanding Freshness & Completion Truth Contract.
 *
 * Establishes canonical truth, state machine, and cross-surface integrity for:
 * 1. State-aware header metadata ("Not understood yet", "Understanding in progress", "Understood just now", "Understood 2m ago", "Understanding failed · Last verified understanding · 23h ago").
 * 2. Unambiguous temporal aging without vague phrasing ("Recently understood").
 * 3. Authoritative backend completion timestamp consumption without optimistic fabrication.
 * 4. Cross-surface snapshot ID and timestamp convergence across Overview, Findings, Changes, Infrastructure, and Memory.
 * 5. Preservation of last trusted timestamp upon understanding failure.
 * 6. Unified reconciliation pipeline for manual ("Understand now") and automatic background workers.
 */

export const UNDERSTANDING_FRESHNESS_INVARIANTS = {
  AUTHORITATIVE_UNDERSTANDING_FRESHNESS:
    'The Workspace header always displays the latest authoritative understanding freshness from backend snapshot truth, never merely a static or cached timestamp.',
  NO_STALE_HEADER_AFTER_COMPLETION:
    'Completing an understanding job immediately updates the header freshness to "Understood just now" without retaining stale prior timestamps.',
  NO_OPTIMISTIC_SUCCESS_TIMESTAMP:
    'The understanding timestamp is never updated optimistically upon button click; it updates strictly after backend snapshot verification and commitment.',
  FAILED_UNDERSTANDING_PRESERVES_LAST_TRUSTED_TIME:
    'Failed understanding attempts display "Understanding failed" while truthfully preserving the previous verified understanding timestamp.',
  MANUAL_AUTOMATIC_FRESHNESS_CONVERGENCE:
    'Manual triggers and automatic background workers converge through the exact same understanding freshness pipeline and timestamp resolution.',
  LATEST_SNAPSHOT_IDENTITY_CONVERGENCE:
    'All Workspace surfaces (Overview, Findings, Changes, Infrastructure, Memory, Header) converge strictly to the identical latest verified snapshot ID.',
  NO_CROSS_SURFACE_TIMESTAMP_DIVERGENCE:
    'Timestamps across Overview, Header, Infrastructure, and Memory derive from the same authoritative snapshot verification time without cross-surface drift.',
  NO_REFRESH_REQUIRED_FOR_FRESHNESS:
    'Workspace intelligence and freshness update reactively and seamlessly upon snapshot commitment without requiring browser refresh or navigation.',
  UNDERSTANDING_STATE_VISIBLE:
    'While understanding is in-progress, the header explicitly displays active understanding state rather than stale historical timestamps.',
} as const;

export type UnderstandingFreshnessPhase =
  | 'NOT_UNDERSTOOD'
  | 'UNDERSTANDING'
  | 'UNDERSTOOD'
  | 'FAILED';

export interface ResolveUnderstandingFreshnessParams {
  readonly isTriggerPending?: boolean;
  readonly triggerError?: Error | null;
  readonly activeJob?: UnderstandingJobDto | null;
  readonly latestJob?: UnderstandingJobDto | null;
  readonly latestSnapshot?:
    | InfrastructureSnapshotDto
    | { readonly id: string; readonly capturedAt?: string; readonly createdAt?: string }
    | null;
  readonly previousSnapshot?: InfrastructureSnapshotDto | null;
  readonly lastScanAt?: string | null;
  readonly totalSnapshots?: number;
  readonly hasInfrastructure?: boolean;
  readonly now?: number | Date;
}

export interface UnderstandingFreshnessState {
  readonly phase: UnderstandingFreshnessPhase;
  readonly statusBadge: 'ACTIVE' | 'UNDERSTANDING' | 'FAILED' | 'NOT_UNDERSTOOD';
  readonly headline: string;
  readonly formattedFreshness: string;
  readonly verifiedDateFormatted: string | null;
  readonly contextMessage: string | null;
  readonly snapshotId: string | null;
  readonly authoritativeTimestamp: string | null;
  readonly lastVerifiedTimestamp: string | null;
  readonly lastVerifiedFreshness: string | null;
  readonly isUnderstanding: boolean;
  readonly canTrigger: boolean;
  readonly buttonLabel: string;
}

/**
 * Pure formatter for relative elapsed time (e.g., "just now", "2m ago", "23h ago", "2d ago").
 */
export function formatRelativeTime(
  dateString?: string | number | Date | null,
  now?: number | Date
): string {
  if (!dateString) return 'recently';
  try {
    const timestamp = typeof dateString === 'number'
      ? dateString
      : new Date(dateString).getTime();
    if (isNaN(timestamp)) return 'recently';

    const current = now ? (typeof now === 'number' ? now : new Date(now).getTime()) : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((current - timestamp) / 1000));

    if (elapsedSeconds < 60) return 'just now';
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'recently';
  }
}

/**
 * Formats understanding freshness with authoritative precision:
 * - < 60s: "Understood just now"
 * - < 60m: "Understood 2m ago"
 * - < 24h: "Understood 3h ago"
 * - >= 24h: "Understood 1d ago"
 *
 * Prohibits vague approximations like "Recently understood".
 */
export function formatUnderstandingFreshness(
  timestamp?: string | number | Date | null,
  now?: number | Date
): string {
  if (!timestamp) return 'Not understood yet';
  try {
    const targetTime = typeof timestamp === 'number'
      ? timestamp
      : new Date(timestamp).getTime();
    if (isNaN(targetTime)) return 'Not understood yet';

    const currentTime = now ? (typeof now === 'number' ? now : new Date(now).getTime()) : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - targetTime) / 1000));

    if (elapsedSeconds < 60) {
      return 'Understood just now';
    }

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) {
      return `Understood ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Understood ${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `Understood ${days}d ago`;
  } catch {
    return 'Not understood yet';
  }
}

/**
 * Formats full timestamp as "Verified · Aug 24, 2026 · 20:36".
 */
export function formatVerifiedDate(
  timestamp?: string | number | Date | null
): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');

    return `Verified · ${month} ${day}, ${year} · ${hours}:${mins}`;
  } catch {
    return '';
  }
}

/**
 * Pure resolver determining the authoritative understanding freshness state for Workspace Header.
 */
export function resolveUnderstandingFreshness(
  params: ResolveUnderstandingFreshnessParams
): UnderstandingFreshnessState {
  const {
    isTriggerPending = false,
    triggerError = null,
    activeJob = null,
    latestJob = null,
    latestSnapshot = null,
    lastScanAt = null,
    totalSnapshots = 0,
    hasInfrastructure = false,
    now,
  } = params;

  // Derive candidate timestamps for prior verified understanding
  const snapshotTime = latestSnapshot?.capturedAt || latestSnapshot?.createdAt || null;
  const completedJobTime =
    latestJob && latestJob.status === 'COMPLETED'
      ? latestJob.completedAt || latestJob.startedAt
      : null;

  const candidateTimestamps = [snapshotTime, completedJobTime, lastScanAt].filter(
    (t): t is string => Boolean(t)
  );

  const freshestTimestamp = candidateTimestamps.length > 0
    ? [...candidateTimestamps].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : null;

  // 1. UNDERSTANDING IN PROGRESS
  if (
    isTriggerPending ||
    (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PENDING'))
  ) {
    // When understanding is running, find the prior completed timestamp
    const priorCompletedTime =
      latestJob && latestJob.status === 'COMPLETED' && latestJob.id !== activeJob?.id
        ? latestJob.completedAt || latestJob.startedAt
        : null;
    const priorTimestamps = [snapshotTime, priorCompletedTime, lastScanAt].filter(
      (t): t is string => Boolean(t)
    );
    const priorVerifiedTimestamp = priorTimestamps.length > 0
      ? [...priorTimestamps].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    return {
      phase: 'UNDERSTANDING',
      statusBadge: 'UNDERSTANDING',
      headline: 'Understanding in progress',
      formattedFreshness: 'Understanding infrastructure…',
      verifiedDateFormatted: null,
      contextMessage: 'Nebula is establishing a new verified understanding.',
      snapshotId: null,
      authoritativeTimestamp: null,
      lastVerifiedTimestamp: priorVerifiedTimestamp,
      lastVerifiedFreshness: priorVerifiedTimestamp
        ? `Last verified understanding · ${formatRelativeTime(priorVerifiedTimestamp, now)}`
        : null,
      isUnderstanding: true,
      canTrigger: false,
      buttonLabel: 'Understanding…',
    };
  }

  // 2. FAILED STATE (Trigger failure or worker execution error)
  if (
    triggerError ||
    (latestJob && latestJob.status === 'FAILED' && !activeJob)
  ) {
    const errorMsg =
      triggerError?.message ||
      latestJob?.error ||
      "Understanding couldn't be completed.";

    const priorCompletedTime =
      latestJob && latestJob.status === 'COMPLETED'
        ? latestJob.completedAt || latestJob.startedAt
        : null;
    const priorTimestamps = [snapshotTime, priorCompletedTime, lastScanAt].filter(
      (t): t is string => Boolean(t)
    );
    const priorVerifiedTimestamp = priorTimestamps.length > 0
      ? [...priorTimestamps].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    const lastVerifiedFreshness = priorVerifiedTimestamp
      ? `Last verified understanding · ${formatRelativeTime(priorVerifiedTimestamp, now)}`
      : null;

    return {
      phase: 'FAILED',
      statusBadge: 'FAILED',
      headline: 'Understanding failed',
      formattedFreshness: lastVerifiedFreshness
        ? `Understanding failed · ${lastVerifiedFreshness}`
        : 'Understanding failed',
      verifiedDateFormatted: priorVerifiedTimestamp
        ? formatVerifiedDate(priorVerifiedTimestamp)
        : null,
      contextMessage: errorMsg,
      snapshotId: latestSnapshot?.id || null,
      authoritativeTimestamp: null,
      lastVerifiedTimestamp: priorVerifiedTimestamp,
      lastVerifiedFreshness,
      isUnderstanding: false,
      canTrigger: true,
      buttonLabel: 'Try again',
    };
  }

  // 3. UNDERSTOOD / VERIFIED STATE
  const hasVerifiedData =
    Boolean(latestSnapshot) ||
    (latestJob && latestJob.status === 'COMPLETED') ||
    totalSnapshots > 0 ||
    hasInfrastructure ||
    Boolean(freshestTimestamp);

  if (hasVerifiedData && freshestTimestamp) {
    const formatted = formatUnderstandingFreshness(freshestTimestamp, now);
    const verifiedDate = formatVerifiedDate(freshestTimestamp);
    const snapshotId =
      latestSnapshot?.id ||
      (latestJob && latestJob.status === 'COMPLETED' ? latestJob.snapshotId : null) ||
      null;

    return {
      phase: 'UNDERSTOOD',
      statusBadge: 'ACTIVE',
      headline: formatted,
      formattedFreshness: formatted,
      verifiedDateFormatted: verifiedDate,
      contextMessage: null,
      snapshotId,
      authoritativeTimestamp: freshestTimestamp,
      lastVerifiedTimestamp: freshestTimestamp,
      lastVerifiedFreshness: null,
      isUnderstanding: false,
      canTrigger: true,
      buttonLabel: 'Understand now',
    };
  }

  // 4. NOT UNDERSTOOD YET (Initial state)
  return {
    phase: 'NOT_UNDERSTOOD',
    statusBadge: 'NOT_UNDERSTOOD',
    headline: 'Not understood yet',
    formattedFreshness: 'Not understood yet',
    verifiedDateFormatted: null,
    contextMessage: null,
    snapshotId: null,
    authoritativeTimestamp: null,
    lastVerifiedTimestamp: null,
    lastVerifiedFreshness: null,
    isUnderstanding: false,
    canTrigger: true,
    buttonLabel: 'Understand now',
  };
}

/**
 * Snapshot Identity Integrity: Verifies that all Workspace surfaces
 * reference the exact same latest verified snapshot ID (WX-1012).
 */
export interface WorkspaceSurfacesSnapshotVerification {
  readonly latestUnderstandingSnapshotId?: string | null;
  readonly overviewSnapshotId?: string | null;
  readonly infrastructureSnapshotId?: string | null;
  readonly findingsSnapshotId?: string | null;
  readonly changesCurrentSnapshotId?: string | null;
  readonly memoryLatestSnapshotId?: string | null;
}

export interface SnapshotConvergenceResult {
  readonly isConverged: boolean;
  readonly convergedSnapshotId: string | null;
  readonly divergentSurfaces: readonly string[];
}

export function verifyWorkspaceSnapshotConvergence(
  surfaces: WorkspaceSurfacesSnapshotVerification
): SnapshotConvergenceResult {
  const entries: [string, string | null | undefined][] = [
    ['latestUnderstanding', surfaces.latestUnderstandingSnapshotId],
    ['Overview', surfaces.overviewSnapshotId],
    ['Infrastructure', surfaces.infrastructureSnapshotId],
    ['Findings', surfaces.findingsSnapshotId],
    ['Changes', surfaces.changesCurrentSnapshotId],
    ['Memory', surfaces.memoryLatestSnapshotId],
  ];

  const activeEntries = entries.filter(([_, id]) => id !== undefined && id !== null && id !== '');

  if (activeEntries.length === 0) {
    return { isConverged: true, convergedSnapshotId: null, divergentSurfaces: [] };
  }

  const primaryId = activeEntries[0][1];
  const divergent = activeEntries
    .filter(([_, id]) => id !== primaryId)
    .map(([name]) => name);

  return {
    isConverged: divergent.length === 0,
    convergedSnapshotId: divergent.length === 0 ? (primaryId || null) : null,
    divergentSurfaces: divergent,
  };
}

/**
 * Cross-Surface Timestamp Integrity: Verifies that timestamps across
 * Header, Overview, Infrastructure, and Memory derive from the same authoritative truth.
 */
export interface WorkspaceSurfacesTimestampVerification {
  readonly headerTimestamp?: string | null;
  readonly overviewTimestamp?: string | null;
  readonly infrastructureTimestamp?: string | null;
  readonly changesTimestamp?: string | null;
  readonly memoryTimestamp?: string | null;
}

export interface TimestampConvergenceResult {
  readonly isConverged: boolean;
  readonly convergedTimestamp: string | null;
  readonly divergentSurfaces: readonly string[];
}

export function verifyWorkspaceTimestampConvergence(
  surfaces: WorkspaceSurfacesTimestampVerification
): TimestampConvergenceResult {
  const entries: [string, string | null | undefined][] = [
    ['Header', surfaces.headerTimestamp],
    ['Overview', surfaces.overviewTimestamp],
    ['Infrastructure', surfaces.infrastructureTimestamp],
    ['Changes', surfaces.changesTimestamp],
    ['Memory', surfaces.memoryTimestamp],
  ];

  const activeEntries = entries.filter(([_, ts]) => ts !== undefined && ts !== null && ts !== '');

  if (activeEntries.length === 0) {
    return { isConverged: true, convergedTimestamp: null, divergentSurfaces: [] };
  }

  const primaryTs = activeEntries[0][1];
  const divergent = activeEntries
    .filter(([_, ts]) => ts !== primaryTs)
    .map(([name]) => name);

  return {
    isConverged: divergent.length === 0,
    convergedTimestamp: divergent.length === 0 ? (primaryTs || null) : null,
    divergentSurfaces: divergent,
  };
}
