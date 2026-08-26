import type {
  InfrastructureSnapshotDto,
  TimelineEventDto,
} from '../../../types/api';
import {
  extractSnapshotInfrastructureState,
  formatSnapshotDate,
  formatSnapshotTimeUtc,
} from './snapshot-history.contract.ts';

/**
 * Authoritative Historical Context Semantic States (WX-505).
 *
 * Defines the 7-tier canonical state matrix:
 * - 'LOADING': Historical context is being retrieved from the backend.
 * - 'READY': Current, previous, and earlier historical relationships are available.
 * - 'EMPTY': Insufficient historical data exists (zero snapshots completed).
 * - 'PARTIAL': Historical records exist, but some context is marked partial by the backend.
 * - 'QUIET': Multiple snapshots verified, but no meaningful changes were detected across them.
 * - 'UNAVAILABLE': Resource or domain boundary prevents authorized access (domain isolation).
 * - 'ERROR': Network or backend API failure during retrieval.
 */
export type HistoricalContextState =
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'PARTIAL'
  | 'QUIET'
  | 'UNAVAILABLE'
  | 'ERROR';

/**
 * Canonical Copy Constants for Historical Context (WX-505).
 * Hard Invariant: Anti-theatrics, calm, truthful language.
 */
export const HISTORICAL_CONTEXT_COPY = {
  TITLE: 'Historical Context',
  SUBTITLE: 'How does the current infrastructure state fit into its history?',
  BASELINE_HEADLINE: 'Initial baseline established.',
  BASELINE_EXPLANATION:
    'No previous infrastructure state is available for comparison.',
  QUIET_HEADLINE: 'Infrastructure has remained stable across observed states.',
  QUIET_EXPLANATION:
    'Multiple snapshots have been verified with no meaningful infrastructure regressions or changes detected.',
  EMPTY_HEADLINE: 'No infrastructure snapshot is available yet.',
  EMPTY_EXPLANATION:
    'Nebula has not established an infrastructure baseline for this domain.',
  PARTIAL_NOTICE:
    'Displaying available historical records. Some historical intervals may be limited.',
} as const;

/**
 * Authoritative Temporal Tier Classification.
 */
export type HistoricalTemporalTier = 'CURRENT' | 'PREVIOUS' | 'EARLIER';

/**
 * Authoritative Snapshot Node in Historical Lineage.
 *
 * Represents an immutable historical point in time with extracted facts.
 */
export interface HistoricalSnapshotNode {
  /** Unique snapshot ID */
  readonly id: string;
  readonly snapshotId: string;
  readonly domainId: string;
  readonly domainName?: string;
  /** Temporal tier position */
  readonly tier: HistoricalTemporalTier;
  /** ISO observation timestamp */
  readonly observedAt: string;
  /** Formatted date (e.g. "Aug 20, 2026") */
  readonly formattedDate: string;
  /** Formatted UTC time (e.g. "14:53 UTC") */
  readonly formattedTime: string;
  /** HTTP status code */
  readonly httpStatus: number | null;
  /** HTTP protocol/version summary (e.g. "HTTP/3", "HTTP 200") */
  readonly httpProtocol: string | null;
  /** Web server name (e.g. "nginx", "Apache") */
  readonly server: string | null;
  /** TLS summary label (e.g. "TLS valid", "TLS Expired") */
  readonly tlsSummary: string;
  /** List of detected technologies */
  readonly technologies: readonly string[];
  /** Underlying immutable snapshot DTO */
  readonly snapshot: InfrastructureSnapshotDto;
  /** Preceding snapshot ID recorded by backend */
  readonly previousSnapshotId: string | null;
}

/**
 * Authoritative Historical Evolution Link connecting snapshots.
 *
 * Sourced strictly from backend-established TimelineEvent / ChangeHistory records.
 * Invariant: React never diffs snapshots or invents causality.
 */
export interface HistoricalEvolutionLink {
  /** Unique change event ID */
  readonly changeId: string;
  /** Backend headline */
  readonly title: string;
  /** Canonical change type */
  readonly changeType: string;
  /** Severity level */
  readonly severity: string;
  /** Preceding value established by backend */
  readonly previousValue: string | null;
  /** Current value established by backend */
  readonly currentValue: string | null;
  /** Formatted transition label (e.g. "HTTP/2 → HTTP/3" or "Apache → nginx") */
  readonly transitionLabel: string;
  /** Originating snapshot ID */
  readonly fromSnapshotId: string | null;
  /** Target snapshot ID */
  readonly toSnapshotId: string;
  /** Detection timestamp */
  readonly detectedAt: string;
  /** Detailed backend narrative */
  readonly explanation?: string;
  /** Associated finding ID if linked */
  readonly findingId?: string | null;
}

/**
 * Complete Resolution of Historical Context.
 */
export interface HistoricalContextResolution {
  /** Semantic memory state */
  readonly state: HistoricalContextState;
  /** True if only 1 snapshot exists */
  readonly isInitialBaseline: boolean;
  /** True if multi-snapshot with 0 changes */
  readonly isQuiet: boolean;
  /** Total count of trusted completed snapshots */
  readonly totalSnapshots: number;
  /** Current (latest) snapshot node */
  readonly currentNode: HistoricalSnapshotNode | null;
  /** Previous snapshot node if available */
  readonly previousNode: HistoricalSnapshotNode | null;
  /** Additional earlier snapshot nodes */
  readonly earlierNodes: readonly HistoricalSnapshotNode[];
  /** All structured nodes in authoritative sequence */
  readonly allNodes: readonly HistoricalSnapshotNode[];
  /** Authoritative change evolution links */
  readonly evolutionLinks: readonly HistoricalEvolutionLink[];
}

/**
 * Pure helper to extract protocol summary from snapshot DTO.
 */
function extractHttpProtocolSummary(
  snapshot: InfrastructureSnapshotDto
): string | null {
  if (snapshot.payload && typeof snapshot.payload === 'object') {
    const p = snapshot.payload as Record<string, unknown>;
    if (p.http && typeof p.http === 'object') {
      const http = p.http as { protocol?: string; headers?: Record<string, string> };
      if (http.headers) {
        const altSvc = http.headers['alt-svc'] || http.headers['Alt-Svc'];
        if (typeof altSvc === 'string' && (altSvc.includes('h3') || altSvc.includes('h3-29'))) {
          return 'HTTP/3';
        }
      }
      if (http.protocol) {
        return http.protocol.toUpperCase();
      }
    }
  }
  if (typeof snapshot.httpStatus === 'number') {
    return `HTTP ${snapshot.httpStatus}`;
  }
  return null;
}

/**
 * Pure helper to extract TLS summary label from snapshot.
 */
function extractTlsLabel(snapshot: InfrastructureSnapshotDto): string {
  if (snapshot.tlsCertificate) {
    const cert = snapshot.tlsCertificate;
    if (cert.validTo) {
      const expDate = new Date(cert.validTo);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        return 'TLS expired';
      }
    }
    return 'TLS valid';
  }
  if (snapshot.payload && typeof snapshot.payload === 'object') {
    const p = snapshot.payload as Record<string, unknown>;
    if (p.ssl && typeof p.ssl === 'object') {
      const ssl = p.ssl as { supported?: boolean; authorized?: boolean };
      if (ssl.supported === false) return 'No TLS';
      if (ssl.authorized === true) return 'TLS valid';
      if (ssl.authorized === false) return 'TLS unverified';
    }
  }
  return 'TLS valid';
}

/**
 * Pure extractor converting an immutable Snapshot DTO into a structured HistoricalSnapshotNode.
 */
export function extractHistoricalSnapshotNode(
  snapshot: InfrastructureSnapshotDto,
  tier: HistoricalTemporalTier
): HistoricalSnapshotNode {
  const extracted = extractSnapshotInfrastructureState(snapshot, tier === 'CURRENT');
  const observedAt = snapshot.capturedAt || snapshot.createdAt || '';

  return {
    id: snapshot.id,
    snapshotId: snapshot.id,
    domainId: snapshot.domainId,
    domainName: snapshot.domainName,
    tier,
    observedAt,
    formattedDate: formatSnapshotDate(observedAt),
    formattedTime: formatSnapshotTimeUtc(observedAt),
    httpStatus: extracted.httpStatus,
    httpProtocol: extractHttpProtocolSummary(snapshot),
    server: extracted.server,
    tlsSummary: extractTlsLabel(snapshot),
    technologies: extracted.technologies,
    snapshot,
    previousSnapshotId: snapshot.previousSnapshotId || null,
  };
}

/**
 * Pure extractor converting backend TimelineEventDto change records into HistoricalEvolutionLinks.
 *
 * Invariant: Never compare snapshot JSON payloads in React.
 */
export function extractHistoricalEvolutionLinks(
  events?: readonly TimelineEventDto[] | null
): readonly HistoricalEvolutionLink[] {
  if (!events || events.length === 0) return [];

  return events.map((evt) => {
    const fromId = evt.previousSnapshotId || null;
    const toId = evt.currentSnapshotId || evt.snapshotId || '';
    const prevVal = evt.previousValue ?? null;
    const currVal = evt.currentValue ?? null;

    let transitionLabel = evt.title;
    if (prevVal && currVal) {
      transitionLabel = `${prevVal} → ${currVal}`;
    }

    return {
      changeId: evt.id,
      title: evt.title,
      changeType: evt.changeType || 'MODIFIED',
      severity: evt.severity || 'INFORMATIONAL',
      previousValue: prevVal,
      currentValue: currVal,
      transitionLabel,
      fromSnapshotId: fromId,
      toSnapshotId: toId,
      detectedAt:
        evt.detectedAt ||
        (typeof evt.timestamp === 'string'
          ? evt.timestamp
          : evt.timestamp instanceof Date
          ? evt.timestamp.toISOString()
          : new Date().toISOString()),
      explanation: evt.explanation || evt.description || evt.summary,
      findingId: evt.findingId || null,
    };
  });
}

/**
 * Pure deterministic function to resolve the complete Historical Context.
 *
 * Preserves backend-authoritative temporal ordering (Current -> Previous -> Earlier).
 * Strictly forbids client-side sorting or diffing.
 */
export function resolveHistoricalContext(params: {
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isPartial?: boolean;
}): HistoricalContextResolution {
  const {
    snapshots = [],
    timelineEvents = [],
    isLoading,
    isError,
    isDomainMismatch = false,
    isPartial = false,
  } = params;

  if (isDomainMismatch) {
    return {
      state: 'UNAVAILABLE',
      isInitialBaseline: false,
      isQuiet: false,
      totalSnapshots: 0,
      currentNode: null,
      previousNode: null,
      earlierNodes: [],
      allNodes: [],
      evolutionLinks: [],
    };
  }

  if (isLoading) {
    return {
      state: 'LOADING',
      isInitialBaseline: false,
      isQuiet: false,
      totalSnapshots: 0,
      currentNode: null,
      previousNode: null,
      earlierNodes: [],
      allNodes: [],
      evolutionLinks: [],
    };
  }

  if (isError) {
    return {
      state: 'ERROR',
      isInitialBaseline: false,
      isQuiet: false,
      totalSnapshots: 0,
      currentNode: null,
      previousNode: null,
      earlierNodes: [],
      allNodes: [],
      evolutionLinks: [],
    };
  }

  const validSnapshots = (snapshots || []).filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  const total = validSnapshots.length;

  // 1. Zero Snapshots -> EMPTY
  if (total === 0) {
    return {
      state: 'EMPTY',
      isInitialBaseline: false,
      isQuiet: false,
      totalSnapshots: 0,
      currentNode: null,
      previousNode: null,
      earlierNodes: [],
      allNodes: [],
      evolutionLinks: [],
    };
  }

  // 2. Single Snapshot -> INITIAL BASELINE (EMPTY comparative history)
  if (total === 1) {
    const currentNode = extractHistoricalSnapshotNode(validSnapshots[0], 'CURRENT');
    return {
      state: 'EMPTY',
      isInitialBaseline: true,
      isQuiet: false,
      totalSnapshots: 1,
      currentNode,
      previousNode: null,
      earlierNodes: [],
      allNodes: [currentNode],
      evolutionLinks: [],
    };
  }

  // 3. Multi-Snapshot Domain (Current, Previous, Earlier)
  const currentNode = extractHistoricalSnapshotNode(validSnapshots[0], 'CURRENT');
  const previousNode = extractHistoricalSnapshotNode(validSnapshots[1], 'PREVIOUS');
  const earlierNodes = validSnapshots
    .slice(2)
    .map((s) => extractHistoricalSnapshotNode(s, 'EARLIER'));

  const allNodes = [currentNode, previousNode, ...earlierNodes];
  const evolutionLinks = extractHistoricalEvolutionLinks(timelineEvents);

  const isQuiet = evolutionLinks.length === 0;

  let state: HistoricalContextState = 'READY';
  if (isPartial) {
    state = 'PARTIAL';
  } else if (isQuiet) {
    state = 'QUIET';
  }

  return {
    state,
    isInitialBaseline: false,
    isQuiet,
    totalSnapshots: total,
    currentNode,
    previousNode,
    earlierNodes,
    allNodes,
    evolutionLinks,
  };
}
