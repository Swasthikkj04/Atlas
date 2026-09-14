import type { DomainDto, TimelineEventDto } from '../../../types/api';

/**
 * WX-O-01: Return Intelligence Briefing State Types.
 *
 * Core Principle:
 * "When a user returns, Nebula should tell them what happened before asking them where to go."
 * "GX helps the user understand what exists now. WX helps the user understand what changed."
 */
export type ReturnIntelligenceState =
  | 'NO_DOMAINS'
  | 'UNDERSTANDING_IN_PROGRESS'
  | 'ATTENTION_REQUIRED'
  | 'CHANGES_DETECTED'
  | 'QUIET';

export type DomainBriefStatus = 'STABLE' | 'ATTENTION' | 'CHANGED' | 'VERIFYING';

export interface ReturnIntelligenceChangeItem {
  readonly changeId: string;
  readonly domainId: string;
  readonly domainName: string;
  readonly title: string;
  readonly summary: string;
  readonly significance: string;
  readonly changeType: string;
  readonly impact: string;
  readonly severity: string;
  readonly detectedFormatted: string;
  readonly rawDetectedAt?: string | null;
}

export interface ReturnIntelligenceDomainItem {
  readonly domainId: string;
  readonly domainName: string;
  readonly status: DomainBriefStatus;
  readonly statusLabel: 'Stable' | 'Attention' | 'Changed' | 'Verifying';
  readonly statusVariant: 'positive' | 'attention' | 'neutral' | 'informational';
  readonly lastUnderstoodFormatted: string;
  readonly rawLastUnderstoodAt?: string | null;
  readonly changeCount: number;
  readonly activeFindingCount: number;
  readonly summaryNote: string;
  readonly hasActiveJob: boolean;
}

export interface ReturnIntelligenceAttentionItem {
  readonly domainId: string;
  readonly domainName: string;
  readonly reason: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface ReturnIntelligenceBrief {
  readonly state: ReturnIntelligenceState;
  readonly totalDomains: number;
  readonly verifiedUnderstandingsCount: number;
  readonly verifyingCount: number;
  readonly domainsWithChangesCount: number;
  readonly totalChangesCount: number;
  readonly domainsWithAttentionCount: number;
  readonly headline: string;
  readonly subtitle: string;
  readonly explanation: string;
  readonly changes: readonly ReturnIntelligenceChangeItem[];
  readonly domains: readonly ReturnIntelligenceDomainItem[];
  readonly attentionItems: readonly ReturnIntelligenceAttentionItem[];
  readonly isQuiet: boolean;
  readonly hasChanges: boolean;
  readonly hasAttentionRequired: boolean;
  readonly isVerifying: boolean;
}

export interface ResolveReturnIntelligenceParams {
  readonly domains?: readonly DomainDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly activeJobDomainIds?: readonly string[] | null;
}

/**
 * Formats a timestamp into human-readable relative time or short date format (e.g., "Sep 5", "Just now", "2 hours ago").
 */
export function formatReturnEventDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently observed';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently observed';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatReturnRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return 'Pending understanding';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently verified';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Pure function resolving the Return Intelligence Brief from authoritative backend state (WX-O-01).
 *
 * Invariants:
 * 1. Prioritizes cross-domain change intelligence over static inventory lists.
 * 2. Surfaces attention conditions cleanly without overwhelming or inducing panic.
 * 3. Treats Quiet/Stable baseline as a first-class, verified positive state.
 * 4. Never fabricates synthetic changes, fake metrics, or conversational greetings.
 */
export function resolveReturnIntelligenceBrief(
  params: ResolveReturnIntelligenceParams
): ReturnIntelligenceBrief {
  const domains = params.domains || [];
  const events = params.timelineEvents || [];
  const activeJobDomainIds = new Set(params.activeJobDomainIds || []);

  const totalDomains = domains.length;

  if (totalDomains === 0) {
    return {
      state: 'NO_DOMAINS',
      totalDomains: 0,
      verifiedUnderstandingsCount: 0,
      verifyingCount: 0,
      domainsWithChangesCount: 0,
      totalChangesCount: 0,
      domainsWithAttentionCount: 0,
      headline: 'Your infrastructure, understood.',
      subtitle: 'Your infrastructure, since you last looked.',
      explanation: 'Add a domain to begin establishing persistent infrastructure memory.',
      changes: [],
      domains: [],
      attentionItems: [],
      isQuiet: false,
      hasChanges: false,
      hasAttentionRequired: false,
      isVerifying: false,
    };
  }

  // 1. Group events by domain
  const eventsByDomain = new Map<string, TimelineEventDto[]>();
  for (const evt of events) {
    const list = eventsByDomain.get(evt.domainId) || [];
    list.push(evt);
    eventsByDomain.set(evt.domainId, list);
  }

  // 2. Build domain intelligence items and attention items
  let verifyingCount = 0;
  let domainsWithChangesCount = 0;
  let domainsWithAttentionCount = 0;
  let totalChangesCount = 0;
  const attentionItems: ReturnIntelligenceAttentionItem[] = [];

  const domainItems: ReturnIntelligenceDomainItem[] = domains.map((domain) => {
    const isActivelyVerifying =
      activeJobDomainIds.has(domain.id) ||
      domain.understandingStatus === 'RUNNING' ||
      domain.understandingStatus === 'PENDING';

    const domainEvents = eventsByDomain.get(domain.id) || [];
    const changeCount = domainEvents.length;
    const activeFindingCount = domain.activeFindingCount || 0;

    const hasDegradation = domainEvents.some(
      (e) =>
        (e.changeType || '').toUpperCase() === 'DEGRADED' ||
        (e.changeType || '').toUpperCase() === 'REGRESSED' ||
        (e.severity || '').toUpperCase() === 'CRITICAL' ||
        (e.severity || '').toUpperCase() === 'HIGH'
    );

    const hasImprovement = domainEvents.some(
      (e) =>
        (e.changeType || '').toUpperCase() === 'IMPROVED' ||
        (e.title || '').toLowerCase().includes('improved') ||
        (e.changeType || '').toUpperCase() === 'TLS_CERT_RENEWED'
    );

    let status: DomainBriefStatus = 'STABLE';
    let statusLabel: 'Stable' | 'Attention' | 'Changed' | 'Verifying' = 'Stable';
    let statusVariant: 'positive' | 'attention' | 'neutral' | 'informational' = 'positive';
    let summaryNote = 'No significant changes';

    if (changeCount > 0) {
      domainsWithChangesCount++;
      totalChangesCount += changeCount;
    }

    if (isActivelyVerifying) {
      verifyingCount++;
      status = 'VERIFYING';
      statusLabel = 'Verifying';
      statusVariant = 'informational';
      summaryNote = 'Understanding in progress';
    } else if (hasDegradation || activeFindingCount > 0) {
      domainsWithAttentionCount++;
      status = 'ATTENTION';
      statusLabel = 'Attention';
      statusVariant = 'attention';
      const reason =
        activeFindingCount > 0
          ? `${activeFindingCount} ${activeFindingCount === 1 ? 'condition' : 'conditions'} worth reviewing`
          : 'Security posture modification';
      summaryNote = reason;

      attentionItems.push({
        domainId: domain.id,
        domainName: domain.domainName,
        reason,
        severity: hasDegradation ? 'HIGH' : 'MEDIUM',
      });
    } else if (changeCount > 0) {
      status = 'CHANGED';
      statusLabel = 'Changed';
      statusVariant = hasImprovement ? 'positive' : 'neutral';
      summaryNote = hasImprovement
        ? 'Defensive posture improved'
        : domainEvents[0]?.summary ||
          domainEvents[0]?.title ||
          'Infrastructure technology changed';
    }

    const lastUnderstoodRaw = domain.lastUnderstoodAt || domain.lastScanAt || domain.updatedAt;
    const relativeTime = formatReturnRelativeTime(lastUnderstoodRaw);
    const lastUnderstoodFormatted = `Understood ${relativeTime.toLowerCase()}`;

    return {
      domainId: domain.id,
      domainName: domain.domainName,
      status,
      statusLabel,
      statusVariant,
      lastUnderstoodFormatted,
      rawLastUnderstoodAt: lastUnderstoodRaw,
      changeCount,
      activeFindingCount,
      summaryNote,
      hasActiveJob: isActivelyVerifying,
    };
  });

  const verifiedUnderstandingsCount = totalDomains - verifyingCount;

  // 3. Build cross-domain change stories (latest changes ordered by detected time)
  const changes: ReturnIntelligenceChangeItem[] = events.slice(0, 10).map((e) => {
    const rawDate = e.detectedAt || (typeof e.timestamp === 'string' ? e.timestamp : '');
    const detectedFormatted = formatReturnEventDate(rawDate);

    return {
      changeId: e.id,
      domainId: e.domainId,
      domainName: e.domainName || domains.find((d) => d.id === e.domainId)?.domainName || 'Monitored Domain',
      title: e.title,
      summary: (e.summary || e.description || e.title || '').trim(),
      significance: (e.explanation || e.impact || 'Infrastructure transition verified between snapshots.').trim(),
      changeType: String(e.changeType || 'CHANGED'),
      impact: String(e.impact || 'NEUTRAL'),
      severity: String(e.severity || 'LOW'),
      detectedFormatted,
      rawDetectedAt: rawDate,
    };
  });

  // 4. Resolve overall return briefing state
  let state: ReturnIntelligenceState = 'QUIET';
  let headline = 'No significant changes detected.';
  const subtitle = 'Your infrastructure, since you last looked.';
  let explanation =
    'Nebula reviewed your monitored infrastructure and found no drift requiring attention since your previous visit.';

  if (verifyingCount > 0) {
    state = 'UNDERSTANDING_IN_PROGRESS';
    headline = 'Nebula is updating your understanding.';
    explanation = `${verifyingCount} of ${totalDomains} ${totalDomains === 1 ? 'domain is' : 'domains are'} being verified.`;
  } else if (domainsWithAttentionCount > 0) {
    state = 'ATTENTION_REQUIRED';
    headline = `${domainsWithAttentionCount} ${domainsWithAttentionCount === 1 ? 'domain may require' : 'domains may require'} attention.`;
    explanation = 'Nebula identified security posture conditions worth reviewing across your monitored infrastructure.';
  } else if (changes.length > 0) {
    state = 'CHANGES_DETECTED';
    headline = `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} detected across your infrastructure.`;
    explanation = `Nebula verified infrastructure modifications across ${domainsWithChangesCount} of your ${domainsWithChangesCount === 1 ? 'domain' : 'domains'} since their previous snapshots.`;
  }

  return {
    state,
    totalDomains,
    verifiedUnderstandingsCount,
    verifyingCount,
    domainsWithChangesCount,
    totalChangesCount: changes.length,
    domainsWithAttentionCount,
    headline,
    subtitle,
    explanation,
    changes,
    domains: domainItems,
    attentionItems,
    isQuiet: state === 'QUIET',
    hasChanges: state === 'CHANGES_DETECTED',
    hasAttentionRequired: state === 'ATTENTION_REQUIRED',
    isVerifying: state === 'UNDERSTANDING_IN_PROGRESS',
  };
}

/**
 * Authoritative Return Intelligence Invariants (WX-O-01).
 */
export const RETURN_INTELLIGENCE_INVARIANTS = {
  FROZEN_PRODUCT_PRINCIPLE: 'GX helps the user understand what exists now. WX helps the user understand what changed.',
  PRIMARY_PURPOSE: 'What changed across my monitored domains since I was last here?',
  DOMINANT_SURFACE: 'WHAT CHANGED ACROSS DOMAINS',
  INVESTIGATION_INTENT: 'Domain selection establishes clear domain context for investigation rather than orienting where the user is.',
  PERSISTENT_SIDEBAR_INTACT: 'The persistent WX sidebar (Overview, Findings, Changes, Infrastructure, Security, Memory, Settings) remains completely unchanged.',
} as const;
