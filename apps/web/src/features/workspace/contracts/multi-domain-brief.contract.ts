import type { DomainDto, TimelineEventDto } from '../../../types/api';

/**
 * Authoritative Workspace Landing State Types (WX-1025).
 *
 * 1. 'NO_DOMAINS': 0 domains exist in user workspace.
 * 2. 'UNDERSTANDING_IN_PROGRESS': 1 or more domains actively executing understanding.
 * 3. 'ATTENTION_REQUIRED': 1 or more domains have high/critical findings or regressions requiring attention.
 * 4. 'CHANGES_DETECTED': 1 or more domains have verified changes since previous understanding.
 * 5. 'QUIET': Monitored infrastructure is quiet / stable with 0 urgent changes or warnings.
 */
export type MultiDomainLandingState =
  | 'NO_DOMAINS'
  | 'UNDERSTANDING_IN_PROGRESS'
  | 'ATTENTION_REQUIRED'
  | 'CHANGES_DETECTED'
  | 'QUIET';

export type DomainBriefStatus = 'STABLE' | 'ATTENTION' | 'CHANGED' | 'VERIFYING';

export interface DomainIntelligenceItem {
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

export interface CrossDomainChangeItem {
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
}

export interface MultiDomainBriefResult {
  readonly state: MultiDomainLandingState;
  readonly totalDomains: number;
  readonly verifiedUnderstandingsCount: number;
  readonly verifyingCount: number;
  readonly domainsWithChangesCount: number;
  readonly totalChangesCount: number;
  readonly domainsWithAttentionCount: number;
  readonly headline: string;
  readonly subtitle: string;
  readonly explanation: string;
  readonly domains: readonly DomainIntelligenceItem[];
  readonly crossDomainChanges: readonly CrossDomainChangeItem[];
  readonly isQuiet: boolean;
  readonly hasChanges: boolean;
  readonly hasAttentionRequired: boolean;
  readonly isVerifying: boolean;
}

export interface ResolveMultiDomainBriefParams {
  readonly domains?: readonly DomainDto[] | null;
  readonly timelineEvents?: readonly TimelineEventDto[] | null;
  readonly activeJobDomainIds?: readonly string[] | null;
}

/**
 * Formats a timestamp into human-readable relative time (e.g., "12 min ago", "2 hours ago", "today").
 */
export function formatBriefRelativeTime(dateStr?: string | null): string {
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
 * Pure function resolving the multi-domain brief from authoritative backend state (WX-1025).
 *
 * Invariants:
 * 1. Never manufactures synthetic findings, metrics, or fake changes.
 * 2. Uses actual backend domain statuses, snapshots, and timeline events.
 * 3. Treats Quiet / No significant changes as a premier, positive state.
 */
export function resolveMultiDomainBrief(
  params: ResolveMultiDomainBriefParams
): MultiDomainBriefResult {
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
      subtitle: '0 domains monitored',
      explanation: 'Add a domain to begin building your infrastructure memory.',
      domains: [],
      crossDomainChanges: [],
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

  // 2. Build domain intelligence items
  let verifyingCount = 0;
  let domainsWithChangesCount = 0;
  let domainsWithAttentionCount = 0;
  let totalChangesCount = 0;

  const domainItems: DomainIntelligenceItem[] = domains.map((domain) => {
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
      summaryNote =
        activeFindingCount > 0
          ? `${activeFindingCount} ${activeFindingCount === 1 ? 'condition' : 'conditions'} worth reviewing`
          : 'Security posture modification';
    } else if (changeCount > 0) {
      domainsWithChangesCount++;
      totalChangesCount += changeCount;
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
    const relativeTime = formatBriefRelativeTime(lastUnderstoodRaw);
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

  // 3. Build cross-domain change stories (latest 10 distinct changes across domains)
  const crossDomainChanges: CrossDomainChangeItem[] = events.slice(0, 8).map((e) => {
    const rawDate = e.detectedAt || (typeof e.timestamp === 'string' ? e.timestamp : '');
    const detectedDate = rawDate ? new Date(rawDate) : new Date();
    const detectedFormatted = isNaN(detectedDate.getTime())
      ? 'Recently observed'
      : detectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
    };
  });

  // 4. Resolve overall briefing landing state
  let state: MultiDomainLandingState = 'QUIET';
  let headline = 'No significant changes detected.';
  let subtitle = `${totalDomains} ${totalDomains === 1 ? 'domain' : 'domains'} · ${verifiedUnderstandingsCount} verified ${verifiedUnderstandingsCount === 1 ? 'understanding' : 'understandings'}`;
  let explanation =
    'Nebula reviewed your monitored infrastructure and found no changes requiring your attention since the previous verified understandings.';

  if (verifyingCount > 0) {
    state = 'UNDERSTANDING_IN_PROGRESS';
    headline = 'Nebula is updating your understanding.';
    explanation = `${verifyingCount} of ${totalDomains} ${totalDomains === 1 ? 'domain is' : 'domains are'} being verified.`;
  } else if (domainsWithAttentionCount > 0) {
    state = 'ATTENTION_REQUIRED';
    headline = `${domainsWithAttentionCount} ${domainsWithAttentionCount === 1 ? 'domain may require' : 'domains may require'} attention.`;
    explanation = 'Nebula found conditions worth reviewing across your monitored infrastructure.';
  } else if (domainsWithChangesCount > 0) {
    state = 'CHANGES_DETECTED';
    headline = `${totalChangesCount} significant ${totalChangesCount === 1 ? 'change' : 'changes'} detected.`;
    explanation = `Nebula identified meaningful infrastructure changes across ${domainsWithChangesCount} of your ${domainsWithChangesCount === 1 ? 'domain' : 'domains'} since their previous verified understandings.`;
  }

  return {
    state,
    totalDomains,
    verifiedUnderstandingsCount,
    verifyingCount,
    domainsWithChangesCount,
    totalChangesCount,
    domainsWithAttentionCount,
    headline,
    subtitle,
    explanation,
    domains: domainItems,
    crossDomainChanges,
    isQuiet: state === 'QUIET',
    hasChanges: state === 'CHANGES_DETECTED',
    hasAttentionRequired: state === 'ATTENTION_REQUIRED',
    isVerifying: state === 'UNDERSTANDING_IN_PROGRESS',
  };
}

export const MULTI_DOMAIN_BRIEF_CERTIFIED_INVARIANTS = {
  NO_AUTOMATIC_DOMAIN_CAPTURE:
    '/workspace must not automatically open a single domain for a returning user who has multiple monitored domains.',
  CROSS_DOMAIN_INTELLIGENCE_SURFACE:
    '/workspace serves as the cross-domain intelligence surface answering what Nebula knows across all monitored infrastructure.',
  AUTHORITATIVE_SNAPSHOT_AGGREGATION:
    'Cross-domain intelligence is aggregated strictly from authoritative verified snapshots, never heuristic client guessing.',
  QUIET_STATE_IS_PREMIER_FEATURE:
    'Silence and stability ("No significant changes detected") is a first-class successful intelligence outcome.',
  ONE_CLICK_DOMAIN_NAVIGATION:
    'Navigating from cross-domain intelligence into an individual domain workspace is strictly 1 click away.',
  NO_CROSS_DOMAIN_DATA_CONTAMINATION:
    'No domain fact, finding, or snapshot can appear to belong to another domain.',
  NO_GREETING_CHATBOT_THEATER:
    'Landing communicates directly and objectively as an expert briefing without personality theater or chatbot greetings.',
  EXPLICIT_VERIFICATION_TRANSPARENCY:
    'When understanding is executing, communicate active verification honestly without pretending state is static.',
  RESTRAINED_SURFACE_HIERARCHY:
    'Visual authority adheres strictly to WX-1017 tokens (Canvas #F7F7F5, Hero #FFFFFF, Metadata #F4F4F1, Borders #E1E1DC).',
  CANONICAL_WORKSPACE_CONVERGENCE:
    'The landing briefing consumes canonical Workspace truth preserving ONE_UNDERSTANDING_ONE_WORKSPACE_STATE.',
} as const;
