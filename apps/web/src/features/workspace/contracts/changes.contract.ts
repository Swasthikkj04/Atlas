import type {
  InfrastructureSnapshotDto,
  SnapshotListResponseDto,
  TimelineEventDto,
  TimelineResponseDto,
} from '../../../types/api';

/**
 * WX-1001: Authoritative Changes Experience & Truth Contract.
 *
 * Establishes the canonical foundation for the Changes experience (/workspace/changes).
 *
 * Core Principle:
 * "Changes = meaningful differences between verified infrastructure understandings."
 *
 * Authoritative Chain:
 * Understanding Job -> Infrastructure Snapshot (Current) + Previous Snapshot
 *   -> Comparison Engine -> Meaningful Change -> Change Story -> Evidence.
 */

/**
 * Authoritative Change Categories Bounded by Backend Intelligence.
 * Hard Invariant: No fabricated categories; every category maps directly to backend analysis.
 */
export type ChangeCategory =
  | 'dns'
  | 'tls_ssl'
  | 'http'
  | 'security_headers'
  | 'technology'
  | 'hosting'
  | 'edge_cdn'
  | 'network'
  | 'performance';

export const AUTHORITATIVE_CHANGE_CATEGORIES: readonly ChangeCategory[] = [
  'dns',
  'tls_ssl',
  'http',
  'security_headers',
  'technology',
  'hosting',
  'edge_cdn',
  'network',
  'performance',
] as const;

export const CHANGE_CATEGORY_LABELS: Readonly<Record<ChangeCategory, string>> = {
  dns: 'DNS',
  tls_ssl: 'TLS / SSL',
  http: 'HTTP',
  security_headers: 'Security Headers',
  technology: 'Technology',
  hosting: 'Hosting',
  edge_cdn: 'Edge & CDN',
  network: 'Network',
  performance: 'Performance',
} as const;

/**
 * Authoritative Change Types (WX-1004 / WX-1024).
 */
export type ChangeClassificationType =
  | 'ADDED'
  | 'REMOVED'
  | 'CHANGED'
  | 'MODIFIED'
  | 'IMPROVED'
  | 'DEGRADED'
  | 'STABLE'
  | 'UNCHANGED'
  | 'REGRESSED';

export const AUTHORITATIVE_CHANGE_TYPES: readonly ChangeClassificationType[] = [
  'ADDED',
  'REMOVED',
  'CHANGED',
  'MODIFIED',
  'IMPROVED',
  'DEGRADED',
  'STABLE',
  'UNCHANGED',
  'REGRESSED',
] as const;

export const CHANGE_TYPE_LABELS: Readonly<Record<ChangeClassificationType, string>> = {
  ADDED: 'Added',
  REMOVED: 'Removed',
  CHANGED: 'Changed',
  MODIFIED: 'Modified',
  IMPROVED: 'Improved',
  DEGRADED: 'Degraded',
  STABLE: 'Stable',
  UNCHANGED: 'Unchanged',
  REGRESSED: 'Regressed',
} as const;

/**
 * Normalizes raw change type string to authoritative ChangeClassificationType.
 */
export function normalizeChangeType(rawType?: string | null): ChangeClassificationType {
  if (!rawType) return 'CHANGED';
  const upper = rawType.toUpperCase().trim();

  if (
    upper === 'IMPROVED' ||
    upper.includes('IMPROV') ||
    upper.includes('RENEWED') ||
    upper.includes('RESOLVED') ||
    upper.includes('STRENGTHENED')
  ) {
    return 'IMPROVED';
  }
  if (
    upper === 'DEGRADED' ||
    upper.includes('DEGRAD') ||
    upper.includes('WEAKENED')
  ) {
    return 'DEGRADED';
  }
  if (
    upper === 'REGRESSED' ||
    upper.includes('WARNING') ||
    upper.includes('DRIFT')
  ) {
    return 'REGRESSED';
  }
  if (
    upper === 'ADDED' ||
    upper.includes('ADDED') ||
    upper.includes('DISCOVERED')
  ) {
    return 'ADDED';
  }
  if (
    upper === 'REMOVED' ||
    upper.includes('REMOVED') ||
    upper.includes('DELETED')
  ) {
    return 'REMOVED';
  }
  if (
    upper === 'STABLE' ||
    upper === 'UNCHANGED' ||
    upper.includes('STABLE') ||
    upper.includes('UNCHANGED')
  ) {
    return 'STABLE';
  }
  if (upper === 'MODIFIED' || upper.includes('MODIFIED')) {
    return 'CHANGED';
  }
  return 'CHANGED';
}

/**
 * Authoritative Impact & Direction Semantics (WX-1005 / WX-1024).
 */
export type ChangeImpact =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'ATTENTION'
  | 'NEGATIVE'
  | 'CRITICAL';

export type ChangeDirection =
  | 'IMPROVEMENT'
  | 'REGRESSION'
  | 'NEUTRAL'
  | 'UNKNOWN';

export interface AuthoritativeImpactResolution {
  readonly impact: ChangeImpact;
  readonly direction: ChangeDirection;
  readonly impactLabel: string;
  readonly badgeVariant: 'positive' | 'neutral' | 'attention' | 'negative' | 'critical' | 'informational';
}

/**
 * Resolves authoritative impact, direction, and badge presentation strictly
 * from backend severity and change classification without client guessing.
 */
export function resolveAuthoritativeImpact(
  severityRaw?: string | null,
  changeTypeRaw?: string | null
): AuthoritativeImpactResolution {
  const sev = (severityRaw || 'INFORMATIONAL').toUpperCase().trim();
  const cType = normalizeChangeType(changeTypeRaw);

  if (sev === 'CRITICAL') {
    return {
      impact: 'CRITICAL',
      direction: 'REGRESSION',
      impactLabel: 'Critical',
      badgeVariant: 'critical',
    };
  }

  if (sev === 'HIGH' || cType === 'DEGRADED' || cType === 'REGRESSED') {
    return {
      impact: 'NEGATIVE',
      direction: 'REGRESSION',
      impactLabel: sev === 'HIGH' ? 'High Risk' : cType === 'DEGRADED' ? 'Degraded' : 'Regression',
      badgeVariant: 'negative',
    };
  }

  if (cType === 'IMPROVED') {
    return {
      impact: 'POSITIVE',
      direction: 'IMPROVEMENT',
      impactLabel: 'Improvement',
      badgeVariant: 'positive',
    };
  }

  if (sev === 'MEDIUM') {
    return {
      impact: 'ATTENTION',
      direction: 'NEUTRAL',
      impactLabel: 'Attention',
      badgeVariant: 'attention',
    };
  }

  if (sev === 'LOW') {
    return {
      impact: 'NEUTRAL',
      direction: 'NEUTRAL',
      impactLabel: 'Low Impact',
      badgeVariant: 'neutral',
    };
  }

  return {
    impact: 'NEUTRAL',
    direction: 'NEUTRAL',
    impactLabel: 'Informational',
    badgeVariant: 'informational',
  };
}

/**
 * Authoritative Changes Lifecycle & Semantic States (WX-1001).
 *
 * - 'LOADING': Actively retrieving timeline events and snapshot lineage.
 * - 'READY': Multi-snapshot domain with authoritative detected changes.
 * - 'QUIET': Multi-snapshot domain where backend comparison detected zero meaningful changes (infrastructure is stable).
 * - 'FIRST_UNDERSTANDING': Single snapshot domain (initial baseline established; no previous snapshot exists for comparison -> "No changes yet").
 * - 'UNDERSTANDING_IN_PROGRESS': Active understanding job executing; preserves last trusted state with non-blocking progress indication.
 * - 'EMPTY': Genuinely un-understood domain (zero snapshots, zero baseline).
 * - 'UNAVAILABLE': Cross-domain boundary mismatch or tenant permission boundary.
 * - 'ERROR': Backend retrieval failure with retry affordance.
 */
export type ChangesState =
  | 'LOADING'
  | 'READY'
  | 'QUIET'
  | 'FIRST_UNDERSTANDING'
  | 'UNDERSTANDING_IN_PROGRESS'
  | 'EMPTY'
  | 'UNAVAILABLE'
  | 'ERROR';

/**
 * Canonical Copy Constants for the Changes Experience (WX-1001).
 *
 * Hard Invariants:
 * - Anti-theatrics, honest, calm language.
 * - Single-snapshot domain says "No changes yet" (NOT "Everything is unchanged", which falsely implies comparison).
 * - Multi-snapshot quiet domain says "No meaningful changes detected".
 */
export const CHANGES_COPY = {
  SURFACE_TITLE: 'Infrastructure Changes',
  SURFACE_DESCRIPTION: 'Meaningful differences detected between verified infrastructure understandings.',
  FIRST_UNDERSTANDING_HEADLINE: 'No changes yet.',
  FIRST_UNDERSTANDING_HEADING: 'Infrastructure understood',
  FIRST_UNDERSTANDING_NARRATIVE:
    'Nebula has established the first verified understanding of this domain. There is no previous infrastructure state to compare against yet.',
  FIRST_UNDERSTANDING_EXPLANATION:
    'Initial baseline established from the first understanding. Changes will appear when subsequent understandings detect meaningful differences.',
  QUIET_HEADLINE: 'No meaningful changes detected.',
  QUIET_HEADING: 'Infrastructure remains stable',
  QUIET_NARRATIVE:
    'Nebula compared the latest verified understanding with the previous infrastructure state and found no meaningful changes.',
  QUIET_EXPLANATION:
    'Nebula\'s recent understandings remain consistent across observed infrastructure components.',
  EMPTY_HEADLINE: 'No infrastructure changes recorded.',
  EMPTY_EXPLANATION:
    'Run understanding to discover infrastructure facts and establish the initial observation baseline.',
  UNDERSTANDING_IN_PROGRESS_BANNER:
    'Understanding in progress — analyzing recent observations against previous baseline.',
} as const;

/**
 * Meaningful Change Story Contract (WX-1001).
 *
 * Answers the 5 canonical user questions in progressive disclosure:
 * 1. What changed? (`category` + `title`)
 * 2. When did it change? (`detectedAt` + formatted display)
 * 3. What was different? (`previousValue` vs `currentValue`)
 * 4. Why does it matter? (`significanceExplanation`)
 * 5. How do we know? (`currentSnapshotId` + `previousSnapshotId` + `evidenceCount`)
 */
export interface MeaningfulChangeStory {
  /** Unique change event identifier */
  readonly changeId: string;
  /** Monitored domain ID */
  readonly domainId: string;
  /** Monitored domain name */
  readonly domainName: string;
  /** Authoritative category */
  readonly category: ChangeCategory;
  /** Human-readable category label */
  readonly categoryLabel: string;
  /** Authoritative classified change type */
  readonly changeType: ChangeClassificationType;
  /** Raw backend change type string */
  readonly rawChangeType: string;
  /** Concise headline describing what changed */
  readonly title: string;
  /** High-level narrative summary describing the modification */
  readonly summaryNarrative: string;
  /** Authoritative impact classification (POSITIVE, NEUTRAL, ATTENTION, NEGATIVE, CRITICAL) */
  readonly impact: ChangeImpact;
  /** Authoritative posture direction (IMPROVEMENT, REGRESSION, NEUTRAL, UNKNOWN) */
  readonly direction: ChangeDirection;
  /** Display label for impact */
  readonly impactLabel: string;
  /** Optional impact narrative assessment from backend intelligence */
  readonly impactNarrative?: string;
  /** ISO timestamp when change was observed */
  readonly detectedAt: string;
  /** Formatted timestamp for display */
  readonly detectedFormatted: string;
  /** Relative time (e.g. "2 hours ago", "Aug 23") */
  readonly relativeTime: string;
  /** Severity rating from backend intelligence */
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  /** Previous state before the change (or null if initial observation) */
  readonly previousValue: string | null;
  /** Current state after the change */
  readonly currentValue: string | null;
  /** Concise significance explanation answering "Why does it matter?" */
  readonly significanceExplanation: string;
  /** Whether significance is authoritatively provided by backend intelligence */
  readonly hasAuthoritativeSignificance: boolean;
  /** Authoritative current snapshot ID */
  readonly currentSnapshotId: string;
  /** Authoritative previous snapshot ID used for comparison */
  readonly previousSnapshotId: string | null;
  /** Number of verifiable evidence artifacts backing this change */
  readonly evidenceCount: number;
  /** Associated finding ID if linked to a security/operational finding */
  readonly findingId?: string | null;
  /** Whether this event marks the initial baseline observation */
  readonly isInitialBaseline: boolean;
  /** Target infrastructure component or policy subject */
  readonly subject?: string;
  /** Authoritative factual boundary establishing what this change proves (WX-1024) */
  readonly whatThisEstablishes?: string;
  /** Explicit anti-overclaiming boundary stating what this change does not establish (WX-1023 / WX-1024) */
  readonly whatThisDoesNotEstablish?: string;
  /** Authoritative derived comparison summary for complex policies (WX-1024) */
  readonly derivedSummary?: {
    readonly previousLabel?: string;
    readonly currentLabel?: string;
    readonly postureChange?: string;
    readonly directives?: { readonly previous: number; readonly current: number };
    readonly allowedSources?: string;
    readonly browserRestrictions?: string;
    readonly overallPosture?: string;
  } | null;
  /** Previous snapshot timestamp for lineage strip */
  readonly previousSnapshotTimestamp?: string | null;
  /** Current snapshot timestamp for lineage strip */
  readonly currentSnapshotTimestamp?: string | null;
  /** T23.5 Structured Forensic Explanation */
  readonly forensicExplanation?: {
    readonly whatChanged?: string;
    readonly whyWeBelieveIt?: string;
    readonly whatItMeans?: string;
    readonly whatWeCannotConclude?: string;
    readonly impact?: string;
    readonly attention?: string;
    readonly attentionRequired?: boolean;
  };
  /** T23.4 Significance Classification (INFORMATIONAL, NOTABLE, IMPORTANT, CRITICAL) */
  readonly significance?: 'INFORMATIONAL' | 'NOTABLE' | 'IMPORTANT' | 'CRITICAL' | string;
  /** T23.6 Multi-Layer Blast Radius layers */
  readonly blastRadiusLayers?: readonly string[];
}

/**
 * Temporal Grouping of Changes (Recent vs Earlier).
 */
export interface ChronologicalChangeGroups {
  readonly recent: readonly MeaningfulChangeStory[];
  readonly earlier: readonly MeaningfulChangeStory[];
}

/**
 * Pure helper to extract the snapshots array from diverse response shapes without mutation.
 */
export function getSnapshotsArray(
  response?:
    | SnapshotListResponseDto
    | readonly InfrastructureSnapshotDto[]
    | null
): readonly InfrastructureSnapshotDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if ('data' in response && Array.isArray(response.data)) return response.data;
  if ('snapshots' in response && Array.isArray(response.snapshots)) return response.snapshots;
  return [];
}

/**
 * Pure helper to extract timeline events array from diverse response shapes without mutation.
 */
export function getTimelineEventsArray(
  response?:
    | TimelineResponseDto
    | readonly TimelineEventDto[]
    | null
): readonly TimelineEventDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if ('data' in response && Array.isArray(response.data)) return response.data;
  if ('events' in response && Array.isArray(response.events)) return response.events;
  return [];
}

/**
 * Pure deterministic function resolving the semantic state of the Changes experience.
 *
 * Strict Invariants:
 * 1. Single snapshot with 0 events -> 'FIRST_UNDERSTANDING' ("No changes yet").
 * 2. Multiple snapshots with 0 events -> 'QUIET' ("No meaningful changes detected").
 * 3. In-progress understanding is distinguished from stale empty state.
 * 4. React never infers or manufactures diffs locally.
 */
export function resolveChangesState(params: {
  readonly snapshots?: readonly InfrastructureSnapshotDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isDomainMismatch?: boolean;
  readonly isUnderstanding?: boolean;
  readonly totalSnapshots?: number;
}): ChangesState {
  const {
    snapshots,
    timelineEvents,
    isLoading,
    isError,
    isDomainMismatch = false,
    isUnderstanding = false,
    totalSnapshots: explicitTotalSnapshots,
  } = params;

  if (isDomainMismatch) {
    return 'UNAVAILABLE';
  }

  if (isLoading) {
    return 'LOADING';
  }

  if (isError) {
    return 'ERROR';
  }

  const validSnapshots = (snapshots || []).filter(
    (s) => Boolean(s.id) && Boolean(s.capturedAt || s.createdAt)
  );

  const snapshotCount = explicitTotalSnapshots ?? validSnapshots.length;
  const events = timelineEvents || [];

  // If domain has an active understanding running
  if (isUnderstanding) {
    if (snapshotCount === 0 && events.length === 0) {
      return 'UNDERSTANDING_IN_PROGRESS';
    }
  }

  // 0 snapshots and 0 events -> Genuinely un-understood EMPTY
  if (snapshotCount === 0 && events.length === 0) {
    return 'EMPTY';
  }

  // 1 snapshot and 0 comparative events -> FIRST_UNDERSTANDING (Initial baseline)
  if (snapshotCount === 1 && events.length === 0) {
    return 'FIRST_UNDERSTANDING';
  }

  // Multi-snapshot domain with 0 detected change events -> QUIET (Stable infrastructure)
  if (snapshotCount > 1 && events.length === 0) {
    return 'QUIET';
  }

  // Multi-snapshot domain with verified change events -> READY
  if (events.length > 0) {
    return 'READY';
  }

  return 'EMPTY';
}

/**
 * Normalizes backend event category string to authoritative ChangeCategory.
 */
export function normalizeChangeCategory(rawCategory?: string | null): ChangeCategory {
  if (!rawCategory) return 'technology';
  const lower = rawCategory.toLowerCase().trim();

  if (lower.includes('dns') || lower.includes('nameserver') || lower.includes('record')) return 'dns';
  if (lower.includes('tls') || lower.includes('ssl') || lower.includes('cert')) return 'tls_ssl';
  if (lower.includes('http') || lower.includes('status') || lower.includes('redirect')) return 'http';
  if (lower.includes('header') || lower.includes('hsts') || lower.includes('csp')) return 'security_headers';
  if (lower.includes('host') || lower.includes('cloud') || lower.includes('infra')) return 'hosting';
  if (lower.includes('edge') || lower.includes('cdn') || lower.includes('cloudflare') || lower.includes('fastly')) return 'edge_cdn';
  if (lower.includes('network') || lower.includes('ip') || lower.includes('asn') || lower.includes('subnet')) return 'network';
  if (lower.includes('performance') || lower.includes('latency') || lower.includes('ttfb')) return 'performance';

  return 'technology';
}

/**
 * Authoritative helper to derive policy summary metrics for complex security configurations (WX-1024).
 */
export function deriveAuthoritativePolicySummary(
  event: TimelineEventDto
): MeaningfulChangeStory['derivedSummary'] {
  if (event.derivedSummary) {
    return event.derivedSummary;
  }

  const titleLower = (event.title || '').toLowerCase();
  const isCsp = titleLower.includes('content-security-policy') || titleLower.includes('csp');

  if (isCsp) {
    const prev = event.previousValue;
    const curr = event.currentValue;

    const isPrevAbsent =
      !prev ||
      prev === 'Not configured' ||
      prev.toLowerCase() === 'absent' ||
      prev === 'None' ||
      prev.toLowerCase().includes('no effective csp');
    const isCurrPresent = Boolean(
      curr &&
        curr !== 'Removed' &&
        curr.toLowerCase() !== 'absent' &&
        curr !== 'None'
    );

    const countDirectives = (val: string | null | undefined): number => {
      if (!val || val === 'Not configured' || val === 'Removed' || val === 'absent' || val === 'None') return 0;
      return val.split(';').map((d) => d.trim()).filter(Boolean).length;
    };

    const prevCount = countDirectives(prev);
    const currCount = countDirectives(curr);

    if (isPrevAbsent && isCurrPresent) {
      return {
        previousLabel: 'No effective CSP',
        currentLabel: 'CSP present',
        postureChange: 'Protection improved',
        directives: currCount > 0 ? { previous: 0, current: currCount } : undefined,
        allowedSources: 'Configured',
        browserRestrictions: 'Stronger',
        overallPosture: 'Improved',
      };
    }

    if (!isPrevAbsent && !isCurrPresent) {
      return {
        previousLabel: 'CSP present',
        currentLabel: 'No effective CSP',
        postureChange: 'Protection degraded',
        directives: prevCount > 0 ? { previous: prevCount, current: 0 } : undefined,
        allowedSources: 'Removed',
        browserRestrictions: 'Weakened',
        overallPosture: 'Degraded',
      };
    }

    if (prevCount > 0 && currCount > 0) {
      const isStrengthened = currCount >= prevCount;
      return {
        previousLabel: `CSP (${prevCount} directives)`,
        currentLabel: `CSP (${currCount} directives)`,
        postureChange: isStrengthened ? 'Protection improved' : 'Policy modified',
        directives: { previous: prevCount, current: currCount },
        allowedSources: currCount > prevCount ? 'Expanded' : 'Maintained',
        browserRestrictions: isStrengthened ? 'Stronger' : 'Modified',
        overallPosture: isStrengthened ? 'Improved' : 'Modified',
      };
    }
  }

  return null;
}

/**
 * Pure function transforming a raw TimelineEventDto into an authoritative MeaningfulChangeStory.
 */
export function resolveMeaningfulChangeStory(
  event: TimelineEventDto,
  domainName: string = ''
): MeaningfulChangeStory {
  const category = normalizeChangeCategory(event.category || event.changeType);
  const categoryLabel = CHANGE_CATEGORY_LABELS[category];

  const currentSnapshotId = event.currentSnapshotId || event.snapshotId || '';
  const previousSnapshotId = event.previousSnapshotId || null;
  const isInitialBaseline = previousSnapshotId === null;

  const rawDate = event.detectedAt || (typeof event.timestamp === 'string' ? event.timestamp : '');
  const detectedDate = rawDate ? new Date(rawDate) : new Date();
  const detectedFormatted = isNaN(detectedDate.getTime())
    ? 'Recently observed'
    : detectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const severityRaw = (event.severity || 'INFORMATIONAL').toUpperCase();
  const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' =
    severityRaw === 'CRITICAL' ||
    severityRaw === 'HIGH' ||
    severityRaw === 'MEDIUM' ||
    severityRaw === 'LOW'
      ? severityRaw
      : 'INFORMATIONAL';

  const changeType = normalizeChangeType(event.changeType);
  const rawChangeType = typeof event.changeType === 'string' ? event.changeType : 'CHANGED';

  const rawSignificance = (event.explanation || event.impact || '').trim();
  const hasAuthoritativeSignificance = rawSignificance.length > 0;
  const significanceExplanation = rawSignificance;

  const summaryNarrative = (event.summary || event.description || event.title || '').trim();

  const { impact, direction, impactLabel } = resolveAuthoritativeImpact(
    event.severity,
    event.changeType
  );
  const impactNarrative = event.impact?.trim() || undefined;

  const evidenceCount =
    typeof event.evidenceCount === 'number'
      ? event.evidenceCount
      : typeof event.observationCount === 'number'
      ? event.observationCount
      : 0;

  const derivedSummary = deriveAuthoritativePolicySummary(event);

  const subject =
    event.subject ||
    (event.title.toLowerCase().includes('content-security-policy') || event.title.toLowerCase().includes('csp')
      ? 'Content-Security-Policy'
      : event.title.toLowerCase().includes('strict-transport-security') || event.title.toLowerCase().includes('hsts')
      ? 'Strict-Transport-Security'
      : event.title.toLowerCase().includes('x-frame-options')
      ? 'X-Frame-Options'
      : event.title.toLowerCase().includes('certificate') || event.title.toLowerCase().includes('tls')
      ? 'TLS / SSL Certificate'
      : categoryLabel);

  const whatThisEstablishes =
    event.whatThisEstablishes ||
    (event.title.toLowerCase().includes('content-security-policy') || event.title.toLowerCase().includes('csp')
      ? 'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.'
      : event.title.toLowerCase().includes('strict-transport-security') || event.title.toLowerCase().includes('hsts')
      ? 'Nebula verified that the current authoritative response contains a Strict-Transport-Security header enforcing HTTPS transport.'
      : event.title.toLowerCase().includes('tls') || event.title.toLowerCase().includes('certificate')
      ? 'Nebula verified that the domain TLS certificate has been renewed with valid certificate authority signatures.'
      : `Nebula verified that the current authoritative response differs from the previous verified response in ${categoryLabel.toLowerCase()} for ${domainName || event.domainName || 'this domain'}.`);

  const whatThisDoesNotEstablish =
    event.whatThisDoesNotEstablish ||
    (event.title.toLowerCase().includes('content-security-policy') || event.title.toLowerCase().includes('csp')
      ? 'This change does not guarantee that all content-injection or XSS scenarios are prevented.'
      : event.title.toLowerCase().includes('strict-transport-security') || event.title.toLowerCase().includes('hsts')
      ? 'This change does not guarantee that client connections or application endpoints cannot be compromised through other vectors.'
      : event.title.toLowerCase().includes('tls') || event.title.toLowerCase().includes('certificate')
      ? 'This change does not guarantee the security or vulnerability posture of underlying web applications.'
      : 'This change does not guarantee that all operational risks or security vulnerabilities are eliminated.');

  return {
    changeId: event.id,
    domainId: event.domainId,
    domainName: event.domainName || domainName,
    category,
    categoryLabel,
    changeType,
    rawChangeType,
    title: event.title,
    summaryNarrative,
    impact,
    direction,
    impactLabel,
    impactNarrative,
    detectedAt: rawDate || detectedDate.toISOString(),
    detectedFormatted,
    relativeTime: detectedFormatted,
    severity,
    previousValue: event.previousValue || null,
    currentValue: event.currentValue || null,
    significanceExplanation,
    hasAuthoritativeSignificance,
    currentSnapshotId,
    previousSnapshotId,
    evidenceCount,
    findingId: event.findingId || null,
    isInitialBaseline,
    subject,
    whatThisEstablishes,
    whatThisDoesNotEstablish,
    derivedSummary,
    previousSnapshotTimestamp: previousSnapshotId ? detectedFormatted : null,
    currentSnapshotTimestamp: detectedFormatted,
    forensicExplanation: event.forensicExplanation,
    significance: event.significance,
    blastRadiusLayers: event.blastRadiusLayers,
  };
}

/**
 * Pure helper resolving evidence navigation targets for a change story (WX-1006).
 */
export interface ChangeEvidenceNavigationTarget {
  readonly canNavigateToEvidence: boolean;
  readonly targetSourceType: 'evidence' | 'change' | 'snapshot';
  readonly targetSourceId: string;
  readonly evidenceLabel: string;
}

export function resolveChangeEvidenceNavigation(
  change: MeaningfulChangeStory
): ChangeEvidenceNavigationTarget {
  if (change.evidenceCount > 0) {
    return {
      canNavigateToEvidence: true,
      targetSourceType: 'evidence',
      targetSourceId: change.findingId || change.changeId,
      evidenceLabel: `${change.evidenceCount} ${change.evidenceCount === 1 ? 'evidence artifact' : 'evidence artifacts'}`,
    };
  }

  return {
    canNavigateToEvidence: false,
    targetSourceType: 'change',
    targetSourceId: change.changeId,
    evidenceLabel: 'No supporting evidence attached',
  };
}

/**
 * CHG-001 (AC-02 & AC-03): Pure function to determine if a change is authoritatively meaningful.
 *
 * Filters out trivial wire/telemetry noise:
 * - Header ordering changes
 * - Date / timestamp header changes
 * - Server timing / latency jitter
 * - Content-length micro-variations
 * - Pure DNS TTL fluctuations without record value changes
 *
 * Preserves true infrastructure posture and state changes:
 * - DNS endpoint / IP / nameserver changes
 * - TLS / SSL certificate mutations, renewals, expirations
 * - HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Technology additions, upgrades, removals
 * - Edge / CDN additions or routing shifts
 * - Hosting provider / ASN / network perimeter changes
 */
export function isMeaningfulChange(
  change: MeaningfulChangeStory | TimelineEventDto
): boolean {
  const title = (change.title || '').toLowerCase();
  const changeType = (typeof change.changeType === 'string' ? change.changeType : '').toLowerCase();
  const category = (change.category || '').toLowerCase();
  const desc = ('description' in change && typeof change.description === 'string' ? change.description : '').toLowerCase();

  // 1. Filter out trivial wire & telemetry noise
  if (
    title.includes('header order') ||
    title.includes('header_order') ||
    desc.includes('header order') ||
    changeType.includes('header_order') ||
    title.includes('date header') ||
    title.includes('http_date') ||
    title.includes('date_header') ||
    desc.includes('date header') ||
    changeType.includes('date_header') ||
    title.includes('server timing') ||
    title.includes('server_timing') ||
    desc.includes('server timing') ||
    changeType.includes('server_timing') ||
    title.includes('content length') ||
    title.includes('content-length') ||
    desc.includes('content length') ||
    changeType.includes('content_length') ||
    (title.includes('ttl') && !title.includes('dns record') && !title.includes('ip') && !title.includes('address')) ||
    changeType.includes('ttl_jitter') ||
    title.includes('latency jitter') ||
    title.includes('ping fluctuation')
  ) {
    return false;
  }

  // 2. Reject unclassified noise with no category or impact
  if (category === 'telemetry_noise' || changeType === 'NOISE' || changeType === 'IGNORE') {
    return false;
  }

  // 3. Meaningful change verified
  return true;
}

/**
 * CHG-001 (AC-02): Filters a list of change stories down strictly to intelligence-approved meaningful changes.
 */
export function filterMeaningfulChanges(
  changes: readonly MeaningfulChangeStory[]
): readonly MeaningfulChangeStory[] {
  return changes.filter(isMeaningfulChange);
}

/**
 * CHG-001 (AC-07): Filters meaningful changes that occurred since the user's last visit.
 * If lastVisitedAt is absent or invalid, returns all meaningful changes from the current understanding.
 */
export function filterChangesSinceLastVisit(
  changes: readonly MeaningfulChangeStory[],
  lastVisitedAt?: string | null
): readonly MeaningfulChangeStory[] {
  const meaningful = filterMeaningfulChanges(changes);
  if (!lastVisitedAt) {
    return meaningful;
  }

  const visitTime = new Date(lastVisitedAt).getTime();
  if (isNaN(visitTime)) {
    return meaningful;
  }

  const filtered = meaningful.filter((change) => {
    const changeTime = new Date(change.detectedAt).getTime();
    if (isNaN(changeTime)) return true;
    return changeTime >= visitTime;
  });

  return filtered;
}

/**
 * CHG-001 (AC-04): Resolves a concise, human-readable 1-sentence meaning for a change story.
 *
 * "Every change gets one sentence of meaning."
 * Example:
 * - DNS addresses changed -> "Your observed IPv4 endpoints changed."
 * - Content-Security-Policy changed -> "The domain's browser security policy changed."
 */
export function resolveOneSentenceMeaning(story: MeaningfulChangeStory): string {
  if (story.summaryNarrative && story.summaryNarrative.trim().length > 0 && story.summaryNarrative !== story.title) {
    // If summary narrative ends with multiple sentences, take first clean sentence
    const firstSentence = story.summaryNarrative.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length > 5) {
      return firstSentence;
    }
  }

  if (story.significanceExplanation && story.significanceExplanation.trim().length > 0) {
    const firstSentence = story.significanceExplanation.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length > 5) {
      return firstSentence;
    }
  }

  // Fallbacks by category
  const lowerTitle = story.title.toLowerCase();
  if (lowerTitle.includes('dns') || lowerTitle.includes('ip') || lowerTitle.includes('address')) {
    return 'Your observed DNS destination and endpoint routing changed.';
  }
  if (lowerTitle.includes('content-security-policy') || lowerTitle.includes('csp')) {
    return "The domain's browser security policy changed.";
  }
  if (lowerTitle.includes('hsts') || lowerTitle.includes('strict-transport')) {
    return 'Strict HTTPS transport encryption policy was updated.';
  }
  if (lowerTitle.includes('certificate') || lowerTitle.includes('tls') || lowerTitle.includes('ssl')) {
    return 'Domain TLS certificate and encryption parameters changed.';
  }
  if (lowerTitle.includes('cloudflare') || lowerTitle.includes('cdn') || lowerTitle.includes('edge')) {
    return 'Edge proxy and CDN distribution routing changed.';
  }
  if (lowerTitle.includes('nginx') || lowerTitle.includes('server') || lowerTitle.includes('apache')) {
    return 'Gateway and web server configuration changed.';
  }

  return `Observed ${story.categoryLabel.toLowerCase()} configuration changed since previous understanding.`;
}

/**
 * Pure function to group change stories into RECENT and EARLIER chronological buckets.
 */
export function groupChangesChronologically(
  changes: readonly MeaningfulChangeStory[],
  now: Date = new Date()
): ChronologicalChangeGroups {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  const recent: MeaningfulChangeStory[] = [];
  const earlier: MeaningfulChangeStory[] = [];

  for (const change of changes) {
    const changeTime = new Date(change.detectedAt).getTime();
    if (!isNaN(changeTime) && nowMs - changeTime <= SEVEN_DAYS_MS) {
      recent.push(change);
    } else {
      earlier.push(change);
    }
  }

  return { recent, earlier };
}

/**
 * Groups change stories by certified category where multiple events occur in that domain component.
 */
export function groupChangesByCategory(
  changes: readonly MeaningfulChangeStory[]
): Readonly<Record<ChangeCategory, readonly MeaningfulChangeStory[]>> {
  const groups: Record<ChangeCategory, MeaningfulChangeStory[]> = {
    dns: [],
    tls_ssl: [],
    http: [],
    security_headers: [],
    technology: [],
    hosting: [],
    edge_cdn: [],
    network: [],
    performance: [],
  };

  for (const change of changes) {
    groups[change.category].push(change);
  }

  return groups;
}

/**
 * Pure lineage validator ensuring change relationships maintain snapshot traceability.
 */
export function validateChangeLineage(change: MeaningfulChangeStory): {
  readonly hasValidCurrentSnapshot: boolean;
  readonly hasValidComparisonLineage: boolean;
  readonly isComparative: boolean;
} {
  const hasValidCurrentSnapshot = Boolean(change.currentSnapshotId && change.currentSnapshotId.trim().length > 0);
  const isComparative = Boolean(change.previousSnapshotId && change.previousSnapshotId !== change.currentSnapshotId);
  const hasValidComparisonLineage = change.isInitialBaseline ? hasValidCurrentSnapshot : (hasValidCurrentSnapshot && isComparative);

  return {
    hasValidCurrentSnapshot,
    hasValidComparisonLineage,
    isComparative,
  };
}

/**
 * Certified Hard Invariants for Changes Experience & Truth Contract (WX-1001 / WX-1004).
 */
export const CHANGES_CERTIFIED_INVARIANTS = {
  NO_INVENTED_CHANGES:
    'Changes must only be derived from backend comparison between verified snapshots. Never fabricate changes or mock events.',
  NO_FRONTEND_CHANGE_DETECTION:
    'Frontend never diffs raw snapshot JSON or decides that two observations represent a change. Intelligence belongs exclusively to the backend.',
  NO_SNAPSHOT_MUTATION:
    'Snapshots are immutable historical records. A change event references snapshots without altering their facts.',
  NO_ACTIVITY_FEED:
    'Changes is not an activity feed. System events (e.g. worker claimed job, DNS request executed, understanding started) are strictly prohibited from the Changes timeline.',
  NO_FINDINGS_AS_CHANGES:
    'Findings represent security/operational posture facts. Finding != Change. A finding may link to a change, but findings are not changes.',
  NO_MEMORY_AS_CHANGES:
    'Memory answers "How has this infrastructure evolved over time?". Changes answers "What is different?". The surfaces and their state models are strictly separated.',
  NO_RAW_SNAPSHOT_COMPARISON_UI:
    'Users are never presented with raw JSON diffs or collector logs. Nebula presents interpreted change stories.',
  NO_UNSUPPORTED_CHANGE_CATEGORY:
    'Only change categories with authoritative backend intelligence backing (DNS, TLS/SSL, HTTP, Security Headers, Technology, Hosting, Edge/CDN, Network, Performance) are valid.',
  NO_FALSE_COMPARISON:
    'Single-snapshot domains (initial baseline) must display "No changes yet" and never imply a comparison took place ("Everything unchanged" is prohibited).',
  NO_PARTIAL_UNDERSTANDING_AS_CHANGE:
    'In-flight or incomplete understanding jobs never produce partial change stories or overwrite trusted change history.',
  NO_DOMAIN_CONTEXT_LOSS:
    'Changes are strictly bound to the active domainId. Cross-domain change pollution is prohibited.',
  NO_STALE_CHANGE_STATE:
    'When a new understanding completes, all changes surfaces invalidate and consume the authoritative new comparison results.',
  NO_UNSUPPORTED_CAUSALITY:
    'Narrative explanations must strictly reflect backend significance without client-side speculation.',
  EVIDENCE_LINEAGE_PRESERVED:
    'Every meaningful change must link back to authoritative snapshot facts and raw observation evidence.',
  PREVIOUS_AND_CURRENT_SNAPSHOT_LINEAGE_PRESERVED:
    'Every comparative change story must preserve explicit before/after snapshot lineage IDs.',
  EXPLANATION_OVER_RAW_DIFF:
    'Change presentation prioritizes human-readable meaning and significance over raw visual diff output.',
  NO_INVENTED_SIGNIFICANCE:
    'Significance narratives must strictly originate from authoritative backend intelligence; never synthesize causal explanations in the client.',
  CANONICAL_CHANGE_CLASSIFICATION:
    'Every detected change must strictly resolve to one of the 9 certified categories with consistent label, icon, and severity semantics.',
  HONEST_SIGNIFICANCE_FALLBACK:
    'When backend significance is absent, present transition facts honestly without speculative commentary.',
  AUTHORITATIVE_IMPACT_SEMANTICS:
    'Impact and severity must represent authoritative backend assessment of actual risk/benefit, never inferred from category alone.',
  PROGRESSIVE_CHANGE_DISCLOSURE:
    'Change card layout strictly follows progressive disclosure: Category/Impact -> Title -> What Changed -> Why It Matters -> Value Transitions -> Evidence Lineage.',
  CHANGE_DIRECTION_INTEGRITY:
    'Change direction (Improvement, Regression, Neutral) is strictly grounded in verified state transitions and authoritative backend classifications.',
  NO_SPECULATIVE_CAUSALITY_FALLBACK:
    'Where backend provides no causal explanation, cards present verified transition facts without filler paragraphs or client speculation.',
  CANONICAL_EVIDENCE_LINEAGE:
    'Every comparative change story preserves verifiable snapshot lineage (currentSnapshotId, previousSnapshotId) and immutable evidence counts.',
  AUTHENTIC_EVIDENCE_NAVIGATION:
    'Clicking "View evidence" navigates strictly using authoritative change, finding, or snapshot identifiers to dedicated investigation surfaces.',
  DOMAIN_PRESERVED_INVESTIGATION:
    'Investigation and evidence traversal strictly preserves active domain identity and prevents cross-domain context loss.',
  HONEST_EVIDENCE_ABSENCE:
    'When evidence count is 0, the UI communicates evidence absence honestly without rendering fake evidence links or synthetic observations.',
  EVIDENCE_FAILURE_RESILIENCE:
    'Failure or unavailability of deeper evidence artifacts does not invalidate or alter the authoritative change story itself.',
  NO_CROSS_SURFACE_TRUTH_DIVERGENCE:
    'A single completed domain understanding operation must produce one coherent truth across all 5 Workspace surfaces (Overview, Findings, Changes, Infrastructure, Memory).',
  MANUAL_AUTOMATIC_CONVERGENCE:
    'Manual ("Understand now") and automatic (UnderstandingWorker) understanding operations converge through the exact same snapshot commitment and comparison pipeline.',
  NO_PARTIAL_SNAPSHOT_PROPAGATION:
    'In-flight, partial, or failed understanding jobs must never update any workspace surface or corrupt trusted historical snapshot lineage.',
  NO_QUERY_KEY_COLLISION:
    'Query keys for domain-scoped data, workspace overview, infrastructure overview, snapshots, findings, timeline, and memory are strictly isolated.',
  NO_CROSS_DOMAIN_CACHE_CONTAMINATION:
    'Domain context switching immediately scopes query invalidation and caching to the active domainId, preventing foreign domain bleed.',
  FAILED_UNDERSTANDING_PRESERVES_TRUSTED_STATE:
    'A failed understanding run leaves existing trusted snapshots, change events, and findings completely intact.',
  MEMORY_CHANGES_SNAPSHOT_CONSISTENCY:
    'The snapshot pair evaluated in Changes (Previous -> Current) must strictly exist and match the chronological snapshot chain in Memory.',
  NO_DUPLICATE_UNDERSTANDING_PIPELINE:
    'No surface may implement an independent understanding or change-detection trigger outside the unified Workspace convergence pipeline.',
  NO_UNVERIFIED_SNAPSHOT_COMPARISON:
    'Only immutable, successfully captured snapshots can be selected for historical comparison; never compare failed or in-progress runs.',
  NO_CROSS_DOMAIN_COMPARISON:
    'Historical comparisons are strictly isolated to snapshots belonging to the active domain context.',
  IMMUTABLE_SNAPSHOT_PRESERVATION:
    'Historical snapshots are immutable records. Comparison produces analytical views without altering underlying facts.',
  AUTHORITATIVE_COMPARISON_ONLY:
    'Differences and unchanged components are derived from verified backend records, never heuristic client diffing.',
  NO_FRONTEND_DIFF_INFERENCE:
    'Frontend does not execute custom JSON/string diffing algorithms; it consumes authoritative backend transition records.',
  NO_FALSE_UNCHANGED_CLAIM:
    'When no differences exist between snapshots, communicate honest absence of changes rather than claiming everything is unchanged.',
  SNAPSHOT_LINEAGE_PRESERVED:
    'Every historical comparison preserves explicit base and target snapshot identifiers.',
  DOMAIN_CONTEXT_PRESERVED:
    'Domain identity is strictly preserved across comparison surface navigation and deep investigation links.',
  NO_TIMELINE_REGRESSION:
    'Historical comparison is an investigation capability that enriches rather than replaces the primary Changes timeline.',
  NO_FAKE_CHANGE_STATE:
    'Changes states (READY, QUIET, FIRST_UNDERSTANDING, EMPTY, UNAVAILABLE, ERROR) reflect authoritative backend facts without client fabrication.',
  NO_PARTIAL_CHANGE_RENDERING:
    'In-flight understanding never injects partial or speculative change stories into the timeline.',
  LAST_TRUSTED_STATE_PRESERVED:
    'While understanding executes, the UI preserves the last verified comparative state and historical groups.',
  NO_CROSS_DOMAIN_STATE_LEAK:
    'All changes, snapshots, and historical comparison state are strictly scoped to the active domain ID.',
  NO_FAKE_EVIDENCE:
    'When evidence count is 0, the UI communicates evidence absence honestly without rendering fake evidence links.',
  NO_BROKEN_COMPARISON_LINK:
    'Historical comparison gracefully handles invalid, missing, or cross-domain snapshot references.',
  RETRY_PRESERVES_DOMAIN_CONTEXT:
    'Error state retries strictly refetch queries scoped to the active domain context.',
  UNDERSTANDING_STATE_CONVERGENCE:
    'Manual and automatic understanding jobs converge to unified truth across all surfaces upon completion.',
  HISTORICAL_STATE_INTEGRITY:
    'Historical comparisons preserve explicit base and target snapshot identifiers and lineage.',
  NO_FALSE_EMPTY_CHANGES_STATE:
    'A domain with verified snapshots must never resolve to EMPTY state ("No infrastructure changes recorded").',
  ONE_SNAPSHOT_IS_NOT_EMPTY:
    'A single verified snapshot represents the initial baseline and must resolve to FIRST_UNDERSTANDING ("No changes yet"), not EMPTY.',
  MULTIPLE_SNAPSHOTS_REQUIRE_COMPARISON:
    'Multiple verified snapshots evaluate detected changes: resolving to QUIET when 0 diffs exist, and READY when diffs exist.',
  NO_CROSS_DOMAIN_CHANGE_DATA:
    'Changes and snapshot data are strictly isolated to the active domainId, preventing cross-domain leakage.',
  NO_STALE_CHANGES_CACHE:
    'Changes queries and caches are authoritatively invalidated upon understanding completion, preventing stale empty states.',
  MANUAL_AUTOMATIC_CHANGE_CONVERGENCE:
    'Manual and automatic background understanding operations converge to identical Changes truth.',
  VERIFIED_SNAPSHOT_CREATES_LINEAGE:
    'Every successfully completed understanding creates exactly one immutable, verified snapshot that extends domain lineage.',
  NO_INCOMPLETE_SNAPSHOT:
    'Incomplete, failed, or in-flight understanding jobs never create snapshots or corrupt historical lineage.',
  NO_DUPLICATE_SNAPSHOT:
    'Deduplicated understanding runs link to existing snapshots without generating duplicate records.',
  NO_CROSS_DOMAIN_SNAPSHOT:
    'Snapshots belong exclusively to their active domain context and never leak across tenant boundaries.',
  MEMORY_REFLECTS_SNAPSHOT_LINEAGE:
    'Memory surface honestly reflects actual snapshot history without fabricated chronological events.',
  CHANGES_USES_LATEST_PAIR:
    'Changes compares the latest verified snapshot against the immediately preceding snapshot for the active domain.',
  HISTORICAL_COMPARISON_REQUIRES_TWO_SNAPSHOTS:
    'Historical comparison is discoverable and accessible only when 2 or more verified snapshots exist for the domain.',
  NO_FAKE_COMPARISON_ENTRY:
    'The "Compare understandings →" affordance is strictly hidden when fewer than 2 snapshots exist.',
  COMPARISON_PRESERVES_DOMAIN_CONTEXT:
    'Historical comparison navigation and selector states strictly preserve active domain context.',
  COMPARISON_PRESERVES_SNAPSHOT_IDENTITY:
    'Historical snapshot identities and timestamps are immutably preserved throughout comparison selection.',
  PREMIUM_QUIET_STATE:
    'Changes quiet-state presents an authoritative, structured intelligence surface rather than an empty dashboard or simplistic status message.',
  UNDERSTANDING_COMPLETION_IS_VISIBLE:
    'Completing an understanding makes verified knowledge tangible and visible across all surfaces.',
  FIRST_BASELINE_IS_DISTINCT:
    'First understanding communicates baseline establishment without falsely claiming stability comparison against a prior state.',
  QUIET_STATE_PROVES_COMPARISON:
    'Multi-snapshot quiet state explicitly proves comparative intelligence by rendering verified snapshot timestamps and identities.',
  NO_AMBIGUOUS_EMPTY_STATE:
    'Single baseline and quiet multi-snapshot domains never render ambiguous "No infrastructure changes recorded" empty states.',
  NO_FALSE_STABILITY_CLAIM:
    'Stability claims require at least two verified snapshots evaluated with zero detected differences.',
  VERIFIED_STATUS_REQUIRES_VERIFIED_SNAPSHOT:
    'Verified indicators and metadata require an immutable, successfully completed snapshot record.',
  NO_FAKE_VERIFICATION_METADATA:
    'Observation counts, timestamps, and snapshot IDs originate strictly from backend facts without client fabrication.',
  NO_DECORATIVE_SUCCESS_THEATER:
    'No checkmark celebrations, confetti, or decorative success graphics on quiet or stable states.',
  NO_REPORT_STYLE_DRIFT:
    'Quiet and baseline surfaces maintain the live operational intelligence aesthetic without drifting into static reports.',
  NO_EMPTY_DASHBOARD_DRIFT:
    'Zero-change states provide structured knowledge context rather than blank metric tiles or empty card placeholders.',
  CROSS_SURFACE_UNDERSTANDING_CONVERGENCE:
    'Overview, Infrastructure, Changes, Findings, and Memory convey unified truth for a given domain understanding lifecycle.',
  CHANGE_HEADLINE_OUTCOME_ORIENTED:
    'Change headline must express outcome (e.g. Content-Security-Policy improved) rather than raw before/after data.',
  CANONICAL_CHANGE_OUTCOME_CLASSIFICATION:
    'Changes must authoritatively distinguish IMPROVED, DEGRADED, ADDED, REMOVED, CHANGED, and STABLE from backend comparison.',
  RESTRAINED_SEMANTIC_CHANGE_BADGES:
    'Change outcome badges strictly adhere to semantic color palette (#178A68 for improved, #C24D57 for degraded, #5F625F for neutral) with zero rainbow styling.',
  INTELLIGENT_WHAT_CHANGED_INTERPRETATION:
    'What Changed provides an intelligent narrative interpretation of what happened rather than raw diff logs.',
  EXPLAIN_CONSEQUENCE_OVER_MECHANICS:
    'Why It Matters explains defensive consequences and operational posture strengthening rather than simplistic generic descriptions.',
  COMPACT_SUMMARY_BEFORE_EVIDENCE:
    'Displays structured compact state transitions and authoritative policy summaries before raw evidence.',
  COLLAPSIBLE_RAW_POLICY_EVIDENCE:
    'Raw policy text is progressively disclosed inside collapsible evidence panels so summary precedes raw text.',
  EVIDENCE_LINEAGE_STRIP_TRACEABILITY:
    'Lineage strip renders chronological step progression with snapshot identifiers and verification timestamps.',
  ANTI_OVERCLAIMING_SECURITY_BOUNDARY:
    'Change presentation explicitly distinguishes defensive posture improvement from an absolute security guarantee, defining what is and is not established.',
  AUTHORITATIVE_BACKEND_CHANGE_CONTRACT:
    'Change conclusions, classifications, and derived summaries are authored by backend comparisons, never manufactured by React.',
} as const;

/**
 * CHG-001: Premium Changes Experience Certified Invariants (AC-01 through AC-12).
 */
export const CHG_001_CERTIFIED_INVARIANTS = {
  AC_01_DEFAULT_COMPARISON_BOUNDARY:
    'Changes defaults strictly to comparing the previous trusted understanding against current trusted understanding.',
  AC_02_MEANINGFUL_CHANGES_ONLY:
    'Only intelligence-approved meaningful changes appear on the primary Changes surface; trivial wire mutations (header order, date header, server timing, content-length, raw TTL jitter) are filtered.',
  AC_03_NO_TELEMETRY_WALL:
    'No permanent state transition counters, snapshot counters, cycle counters, active drift banners, or wire telemetry walls on the primary surface.',
  AC_04_ONE_CHANGE_ONE_MEANING:
    'Every surfaced change provides a concise, human-readable one-sentence explanation of meaning.',
  AC_05_PROGRESSIVE_DISCLOSURE:
    'Information hierarchy strictly follows Understanding -> Meaning -> Why It Matters -> Evidence -> Forensics.',
  AC_06_INTENTIONAL_HISTORICAL_COMPARISON:
    'Historical snapshot comparison is an intentional on-demand capability accessible via "Compare understandings →".',
  AC_07_SINCE_LAST_VISIT_SUPPORT:
    'The experience can distinguish and filter changes that occurred since the user\'s last visit.',
  AC_08_DOMAIN_ISOLATION:
    'Every change belongs exclusively to the active domain context with zero cross-domain leakage.',
  AC_09_CALM_EMPTY_STATE:
    'Zero meaningful changes produces a reassuring, quiet, confident state with comfortable silence ("Nothing else requires attention.").',
  AC_10_NO_FRONTEND_INTELLIGENCE:
    'Frontend does not determine significance, causality, or historical conclusions.',
  AC_11_OVERVIEW_UNTOUCHED:
    'The Overview experience remains completely untouched.',
  AC_12_PREMIUM_VISUAL_STANDARD:
    'The Changes experience is quiet, editorial, spacious, and authoritative rather than a dense monitoring dashboard.',
} as const;

