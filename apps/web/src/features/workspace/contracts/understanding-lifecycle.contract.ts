import type { InfrastructureSnapshotDto, UnderstandingJobDto } from '../../../types/api';
import { formatRelativeTime, formatVerifiedDate } from './understanding-freshness.contract';

/**
 * WX-1018: Authoritative Understanding Lifecycle & Current-State Communication Contract.
 *
 * Canonical 6-Phase State Model:
 * 1. NOT_UNDERSTOOD: Domain has never been understood (0 snapshots, 0 jobs).
 * 2. UNDERSTANDING: Non-blocking understanding in progress (worker actively discovering infrastructure).
 * 3. BASELINE_ESTABLISHED: Single snapshot established. No prior state to compare against yet (Baseline ≠ No changes).
 * 4. STABLE: Multiple snapshots evaluated with 0 meaningful changes detected against previous state.
 * 5. CHANGED: Multiple snapshots evaluated with ≥ 1 meaningful changes detected against previous state.
 * 6. FAILED: Latest run failed; previous verified state is truthfully retained with retry option.
 */

export type UnderstandingCanonicalPhase =
  | 'NOT_UNDERSTOOD'
  | 'UNDERSTANDING'
  | 'BASELINE_ESTABLISHED'
  | 'STABLE'
  | 'CHANGED'
  | 'FAILED';

export interface UnderstandingBadgeConfig {
  readonly label: string;
  readonly text: string;
  readonly bg: string;
  readonly border: string;
  readonly dotColor: string;
  readonly isPulsing?: boolean;
}

export interface UnderstandingLifecycleState {
  readonly phase: UnderstandingCanonicalPhase;
  readonly badge: UnderstandingBadgeConfig;
  readonly semanticHeadline: string;
  readonly temporalSubtitle: string;
  readonly supportingContext: string;
  readonly verifiedDateFormatted: string | null;
  readonly snapshotId: string | null;
  readonly authoritativeTimestamp: string | null;
  readonly lastTrustedTimestamp: string | null;
  readonly lastTrustedRelativeTime: string | null;
  readonly isUnderstanding: boolean;
  readonly canTrigger: boolean;
  readonly buttonLabel: string;
  readonly retryAvailable: boolean;
}

export interface ResolveUnderstandingLifecycleStateParams {
  readonly isTriggerPending?: boolean;
  readonly triggerError?: Error | null;
  readonly activeJob?: UnderstandingJobDto | null;
  readonly latestJob?: UnderstandingJobDto | null;
  readonly latestSnapshot?:
    | InfrastructureSnapshotDto
    | { readonly id: string; readonly capturedAt?: string; readonly createdAt?: string }
    | null;
  readonly previousSnapshot?: InfrastructureSnapshotDto | null;
  readonly totalSnapshots?: number;
  readonly meaningfulChangesCount?: number;
  readonly lastScanAt?: string | null;
  readonly now?: number | Date;
}

/**
 * Pure formatter for authoritative verified recency:
 * - "Verified just now"
 * - "Verified 1 minute ago"
 * - "Verified 2 minutes ago"
 * - "Verified 23 hours ago"
 * - "Verified 2 days ago"
 */
export function formatVerifiedRecency(
  timestamp?: string | number | Date | null,
  now?: number | Date
): string {
  if (!timestamp) return 'Timestamp unavailable';
  try {
    const targetTime = typeof timestamp === 'number'
      ? timestamp
      : new Date(timestamp).getTime();
    if (isNaN(targetTime)) return 'Timestamp unavailable';

    const currentTime = now ? (typeof now === 'number' ? now : new Date(now).getTime()) : Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - targetTime) / 1000));

    if (elapsedSeconds < 60) {
      return 'Verified just now';
    }

    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes === 1) {
      return 'Verified 1 minute ago';
    }
    if (minutes < 60) {
      return `Verified ${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      return 'Verified 1 hour ago';
    }
    if (hours < 24) {
      return `Verified ${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days === 1) {
      return 'Verified 1 day ago';
    }
    return `Verified ${days} days ago`;
  } catch {
    return 'Timestamp unavailable';
  }
}

/**
 * Authoritative Understanding Lifecycle Resolver (WX-1018).
 * Enforces: Semantic state FIRST, temporal recency SECOND.
 */
export function resolveUnderstandingLifecycleState(
  params: ResolveUnderstandingLifecycleStateParams
): UnderstandingLifecycleState {
  const {
    isTriggerPending = false,
    triggerError = null,
    activeJob = null,
    latestJob = null,
    latestSnapshot = null,
    previousSnapshot = null,
    totalSnapshots = 0,
    meaningfulChangesCount = 0,
    lastScanAt = null,
    now,
  } = params;

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

  const effectiveTotalSnapshots = Math.max(
    totalSnapshots,
    latestSnapshot ? (previousSnapshot ? 2 : 1) : 0
  );

  // 1. UNDERSTANDING IN PROGRESS (Non-blocking)
  if (
    isTriggerPending ||
    (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PENDING'))
  ) {
    return {
      phase: 'UNDERSTANDING',
      badge: {
        label: 'UNDERSTANDING',
        text: 'text-[#3568C8]',
        bg: 'bg-[#EEF4FF]',
        border: 'border-[#C8D8F6]',
        dotColor: 'bg-[#3568C8]',
        isPulsing: true,
      },
      semanticHeadline: 'Understanding infrastructure…',
      temporalSubtitle: 'Establishing a new verified state',
      supportingContext: 'Nebula is establishing a new verified infrastructure state.',
      verifiedDateFormatted: freshestTimestamp ? formatVerifiedDate(freshestTimestamp) : null,
      snapshotId: latestSnapshot?.id || null,
      authoritativeTimestamp: freshestTimestamp,
      lastTrustedTimestamp: freshestTimestamp,
      lastTrustedRelativeTime: freshestTimestamp ? formatRelativeTime(freshestTimestamp, now) : null,
      isUnderstanding: true,
      canTrigger: false,
      buttonLabel: 'Understanding…',
      retryAvailable: false,
    };
  }

  // 2. FAILED STATE (Preserves last trusted state)
  if (
    triggerError ||
    (latestJob && latestJob.status === 'FAILED' && !activeJob)
  ) {
    const hasTrustedState = Boolean(freshestTimestamp);
    return {
      phase: 'FAILED',
      badge: {
        label: 'FAILED',
        text: 'text-[#A93442]',
        bg: 'bg-[#FDEBEC]',
        border: 'border-[#E9B3B9]',
        dotColor: 'bg-[#A93442]',
      },
      semanticHeadline: hasTrustedState
        ? 'Previous infrastructure state retained'
        : 'Understanding failed',
      temporalSubtitle: hasTrustedState
        ? 'The latest understanding could not be completed. Your last verified state remains trusted.'
        : 'Understanding could not be completed.',
      supportingContext: hasTrustedState
        ? 'The latest understanding could not be completed. Your last verified state remains trusted.'
        : "Understanding couldn't be completed. Run understanding to analyze this domain.",
      verifiedDateFormatted: freshestTimestamp ? formatVerifiedDate(freshestTimestamp) : null,
      snapshotId: latestSnapshot?.id || null,
      authoritativeTimestamp: null,
      lastTrustedTimestamp: freshestTimestamp,
      lastTrustedRelativeTime: freshestTimestamp ? formatRelativeTime(freshestTimestamp, now) : null,
      isUnderstanding: false,
      canTrigger: true,
      buttonLabel: 'Try again',
      retryAvailable: true,
    };
  }

  // 3. UNDERSTOOD STATES (Baseline, Changed, or Stable)
  const hasVerifiedData =
    Boolean(latestSnapshot) ||
    effectiveTotalSnapshots > 0 ||
    Boolean(freshestTimestamp);

  if (hasVerifiedData && freshestTimestamp) {
    const verifiedRecency = formatVerifiedRecency(freshestTimestamp, now);
    const verifiedDate = formatVerifiedDate(freshestTimestamp);
    const snapshotId = latestSnapshot?.id || null;

    // A. FIRST UNDERSTANDING (Single snapshot baseline - Baseline ≠ No Changes)
    if (effectiveTotalSnapshots === 1 && !previousSnapshot) {
      return {
        phase: 'BASELINE_ESTABLISHED',
        badge: {
          label: 'BASELINE',
          text: 'text-[#178A68]',
          bg: 'bg-[#EAF7F2]',
          border: 'border-[#B9E5D6]',
          dotColor: 'bg-[#178A68]',
        },
        semanticHeadline: 'Infrastructure understood',
        temporalSubtitle: `Initial baseline established · ${verifiedRecency}`,
        supportingContext:
          'This is the first verified understanding of this domain. There is no previous state to compare against yet.',
        verifiedDateFormatted: verifiedDate,
        snapshotId,
        authoritativeTimestamp: freshestTimestamp,
        lastTrustedTimestamp: freshestTimestamp,
        lastTrustedRelativeTime: formatRelativeTime(freshestTimestamp, now),
        isUnderstanding: false,
        canTrigger: true,
        buttonLabel: 'Understand now',
        retryAvailable: false,
      };
    }

    // B. CHANGED (Multiple snapshots evaluated with ≥ 1 meaningful changes)
    if (meaningfulChangesCount > 0) {
      const changeWord = meaningfulChangesCount === 1 ? 'change' : 'changes';
      return {
        phase: 'CHANGED',
        badge: {
          label: 'CHANGE DETECTED',
          text: 'text-[#B86F18]',
          bg: 'bg-[#FFF4E3]',
          border: 'border-[#F0D3A5]',
          dotColor: 'bg-[#B86F18]',
        },
        semanticHeadline: 'Infrastructure changed',
        temporalSubtitle: `${meaningfulChangesCount} meaningful ${changeWord} · ${verifiedRecency}`,
        supportingContext: `${meaningfulChangesCount} meaningful ${changeWord} detected since the previous understanding.`,
        verifiedDateFormatted: verifiedDate,
        snapshotId,
        authoritativeTimestamp: freshestTimestamp,
        lastTrustedTimestamp: freshestTimestamp,
        lastTrustedRelativeTime: formatRelativeTime(freshestTimestamp, now),
        isUnderstanding: false,
        canTrigger: true,
        buttonLabel: 'Understand now',
        retryAvailable: false,
      };
    }

    // C. STABLE (Multiple snapshots evaluated with 0 meaningful changes)
    return {
      phase: 'STABLE',
      badge: {
        label: 'ACTIVE',
        text: 'text-[#178A68]',
        bg: 'bg-[#EAF7F2]',
        border: 'border-[#B9E5D6]',
        dotColor: 'bg-[#178A68]',
      },
      semanticHeadline: 'Infrastructure understood',
      temporalSubtitle: `${verifiedRecency} · Confidence High`,
      supportingContext:
        'No meaningful changes detected since the previous verified understanding.',
      verifiedDateFormatted: verifiedDate,
      snapshotId,
      authoritativeTimestamp: freshestTimestamp,
      lastTrustedTimestamp: freshestTimestamp,
      lastTrustedRelativeTime: formatRelativeTime(freshestTimestamp, now),
      isUnderstanding: false,
      canTrigger: true,
      buttonLabel: 'Understand now',
      retryAvailable: false,
    };
  }

  // 4. NOT UNDERSTOOD YET
  return {
    phase: 'NOT_UNDERSTOOD',
    badge: {
      label: 'NOT UNDERSTOOD',
      text: 'text-[#5F625F]',
      bg: 'bg-[#F4F4F1]',
      border: 'border-[#E2E2DD]',
      dotColor: 'bg-[#5F625F]/60',
    },
    semanticHeadline: 'Not understood yet',
    temporalSubtitle: 'Run understanding to discover infrastructure facts and topology.',
    supportingContext: "Infrastructure hasn't been understood yet.",
    verifiedDateFormatted: null,
    snapshotId: null,
    authoritativeTimestamp: null,
    lastTrustedTimestamp: null,
    lastTrustedRelativeTime: null,
    isUnderstanding: false,
    canTrigger: true,
    buttonLabel: 'Understand now',
    retryAvailable: false,
  };
}
