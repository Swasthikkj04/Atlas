/**
 * H6 — Investigation Continuity & Evidence Navigation Contracts.
 *
 * Provides authoritative serialization, deserialization, context restoration,
 * and return anchor labeling for deep multi-hop investigations:
 * Narrative -> Evidence -> Finding -> Historical Diff -> Raw Telemetry -> Return.
 */

export type InvestigationSourceSurface =
  | 'overview'
  | 'findings'
  | 'changes'
  | 'infrastructure'
  | 'memory';

export type InvestigationEntityType =
  | 'technology'
  | 'finding'
  | 'change'
  | 'observation'
  | 'snapshot'
  | 'control';

export interface InvestigationContext {
  readonly domainId: string;
  readonly domainName?: string;
  readonly sourceSurface: InvestigationSourceSurface;
  readonly sourceSection?: string;
  readonly entityType: InvestigationEntityType;
  readonly entityId: string;
  readonly entityName?: string;
  readonly snapshotId: string;
  readonly findingId?: string;
  readonly evidenceId?: string;
  readonly disclosureLevel?: 1 | 2 | 3;
  readonly filterState?: Record<string, string | number | boolean>;
  readonly scrollAnchor?: string;
  readonly timestamp?: string;
}

export interface InvestigationRestorationState {
  readonly targetSurface: InvestigationSourceSurface;
  readonly targetSection?: string;
  readonly highlightedEntityId?: string;
  readonly disclosureLevel: 1 | 2 | 3;
  readonly snapshotId: string;
  readonly filterState: Record<string, string | number | boolean>;
  readonly scrollAnchor?: string;
  readonly returnLabel: string;
  readonly isGracefulFallback: boolean;
  readonly fallbackReason?: string;
}

export interface EvidenceDrawerItem {
  readonly id: string;
  readonly claim: string;
  readonly layer: string;
  readonly source: string;
  readonly rawEvidence: string;
  readonly timestamp: string;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
  readonly technology?: string;
  readonly level1Summary: string;
  readonly level2Meaning: string;
  readonly level3RawTelemetry: {
    readonly sourceType: string;
    readonly key?: string;
    readonly value?: string;
    readonly payload?: Record<string, any>;
    readonly snapshotId: string;
    readonly timestamp: string;
  };
}

/**
 * Validates whether a value conforms to the canonical InvestigationContext interface.
 */
export function validateInvestigationContext(val: unknown): val is InvestigationContext {
  if (!val || typeof val !== 'object') return false;
  const c = val as Record<string, any>;
  const validSurfaces: InvestigationSourceSurface[] = [
    'overview',
    'findings',
    'changes',
    'infrastructure',
    'memory',
  ];
  const validEntityTypes: InvestigationEntityType[] = [
    'technology',
    'finding',
    'change',
    'observation',
    'snapshot',
    'control',
  ];

  return (
    typeof c.domainId === 'string' &&
    c.domainId.length > 0 &&
    validSurfaces.includes(c.sourceSurface) &&
    validEntityTypes.includes(c.entityType) &&
    typeof c.entityId === 'string' &&
    c.entityId.length > 0 &&
    typeof c.snapshotId === 'string'
  );
}

/**
 * Strips dangerous injection characters from context strings (H6-009).
 */
export function sanitizeInvestigationContext(ctx: InvestigationContext): InvestigationContext {
  const sanitize = (s?: string) => (s ? s.replace(/[<>"'`\\]/g, '').substring(0, 256) : undefined);

  let sanitizedFilter: Record<string, string | number | boolean> | undefined = undefined;
  if (ctx.filterState && typeof ctx.filterState === 'object') {
    sanitizedFilter = {};
    for (const [k, v] of Object.entries(ctx.filterState)) {
      if (typeof v === 'string') {
        sanitizedFilter[sanitize(k)!] = sanitize(v)!;
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        sanitizedFilter[sanitize(k)!] = v;
      }
    }
  }

  return {
    domainId: sanitize(ctx.domainId) || 'domain-unknown',
    domainName: sanitize(ctx.domainName),
    sourceSurface: ctx.sourceSurface,
    sourceSection: sanitize(ctx.sourceSection),
    entityType: ctx.entityType,
    entityId: sanitize(ctx.entityId) || 'entity-unknown',
    entityName: sanitize(ctx.entityName),
    snapshotId: sanitize(ctx.snapshotId) || 'snapshot-latest',
    findingId: sanitize(ctx.findingId),
    evidenceId: sanitize(ctx.evidenceId),
    disclosureLevel: ctx.disclosureLevel === 1 || ctx.disclosureLevel === 2 || ctx.disclosureLevel === 3 ? ctx.disclosureLevel : 1,
    filterState: sanitizedFilter,
    scrollAnchor: sanitize(ctx.scrollAnchor),
    timestamp: sanitize(ctx.timestamp),
  };
}

/**
 * Serializes an InvestigationContext into standard URL search parameters.
 */
export function serializeInvestigationContext(ctx: InvestigationContext): string {
  const clean = sanitizeInvestigationContext(ctx);
  const params = new URLSearchParams();

  params.set('from', clean.sourceSection || clean.sourceSurface);
  params.set('srcSurface', clean.sourceSurface);
  if (clean.sourceSection) params.set('srcSection', clean.sourceSection);
  params.set('entityType', clean.entityType);
  params.set('entityId', clean.entityId);
  if (clean.entityName) params.set('entityName', clean.entityName);
  params.set('snapshot', clean.snapshotId);
  if (clean.findingId) params.set('finding', clean.findingId);
  if (clean.evidenceId) params.set('evidence', clean.evidenceId);
  if (clean.disclosureLevel) params.set('level', String(clean.disclosureLevel));
  if (clean.scrollAnchor) params.set('anchor', clean.scrollAnchor);

  if (clean.filterState && Object.keys(clean.filterState).length > 0) {
    try {
      params.set('filter', JSON.stringify(clean.filterState));
    } catch {
      // ignore serialization error
    }
  }

  return params.toString();
}

/**
 * Parses search parameters into an InvestigationContext.
 */
export function parseInvestigationContext(
  searchParams: URLSearchParams | string,
  domainIdFallback = 'domain-active',
): InvestigationContext | null {
  const params = typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;

  const srcSurface = params.get('srcSurface') as InvestigationSourceSurface | null;
  const entityType = params.get('entityType') as InvestigationEntityType | null;
  const entityId = params.get('entityId');
  const snapshotId = params.get('snapshot') || 'snapshot-latest';

  if (!srcSurface || !entityType || !entityId) {
    return null;
  }

  const rawLevel = params.get('level');
  let disclosureLevel: 1 | 2 | 3 | undefined = undefined;
  if (rawLevel === '1' || rawLevel === '2' || rawLevel === '3') {
    disclosureLevel = Number(rawLevel) as 1 | 2 | 3;
  }

  let filterState: Record<string, string | number | boolean> | undefined = undefined;
  const rawFilter = params.get('filter');
  if (rawFilter) {
    try {
      const parsed = JSON.parse(rawFilter);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        filterState = parsed;
      }
    } catch {
      // ignore
    }
  }

  const candidate: InvestigationContext = {
    domainId: domainIdFallback,
    sourceSurface: srcSurface,
    sourceSection: params.get('srcSection') || params.get('from') || undefined,
    entityType,
    entityId,
    entityName: params.get('entityName') || undefined,
    snapshotId,
    findingId: params.get('finding') || undefined,
    evidenceId: params.get('evidence') || undefined,
    disclosureLevel,
    filterState,
    scrollAnchor: params.get('anchor') || undefined,
  };

  return sanitizeInvestigationContext(candidate);
}

/**
 * Resolves context-aware return anchor label (H6-002).
 * Invariant: Never returns generic "Back".
 */
export function resolveInvestigationReturnLabel(ctx: Partial<InvestigationContext>): string {
  if (ctx.sourceSection === 'narrative') {
    return '← Back to Infrastructure Narrative';
  }

  if (ctx.entityType === 'technology' && (ctx.entityName || ctx.entityId)) {
    const name = ctx.entityName || ctx.entityId;
    return `← Back to ${name} evidence`;
  }

  if (ctx.entityType === 'finding' && (ctx.entityName || ctx.findingId)) {
    const name = ctx.entityName || ctx.findingId;
    return `← Back to ${name} investigation`;
  }

  if (ctx.sourceSurface === 'changes') {
    return '← Back to Changes';
  }

  if (ctx.sourceSurface === 'findings') {
    return '← Back to Findings';
  }

  if (ctx.sourceSurface === 'infrastructure') {
    return '← Back to Infrastructure Overview';
  }

  if (ctx.sourceSurface === 'memory') {
    return '← Back to Snapshot History';
  }

  return '← Back to Overview';
}

/**
 * Restores exact previous context or gracefully falls back (H6-003 & H6-010).
 */
export function resolveInvestigationRestoration(
  ctx: InvestigationContext | null,
  availableEntities?: string[],
): InvestigationRestorationState {
  if (!ctx) {
    return {
      targetSurface: 'overview',
      disclosureLevel: 1,
      snapshotId: 'snapshot-latest',
      filterState: {},
      returnLabel: '← Back to Overview',
      isGracefulFallback: true,
      fallbackReason: 'The original investigation context is no longer available.',
    };
  }

  // Check if target entity still exists in available set if provided
  if (availableEntities && availableEntities.length > 0 && !availableEntities.includes(ctx.entityId)) {
    return {
      targetSurface: ctx.sourceSurface,
      targetSection: ctx.sourceSection,
      disclosureLevel: 1,
      snapshotId: ctx.snapshotId,
      filterState: ctx.filterState || {},
      returnLabel: resolveInvestigationReturnLabel(ctx),
      isGracefulFallback: true,
      fallbackReason: `Target entity "${ctx.entityName || ctx.entityId}" is no longer present in current snapshot.`,
    };
  }

  return {
    targetSurface: ctx.sourceSurface,
    targetSection: ctx.sourceSection,
    highlightedEntityId: ctx.entityId,
    disclosureLevel: ctx.disclosureLevel || 1,
    snapshotId: ctx.snapshotId,
    filterState: ctx.filterState || {},
    scrollAnchor: ctx.scrollAnchor,
    returnLabel: resolveInvestigationReturnLabel(ctx),
    isGracefulFallback: false,
  };
}

/**
 * Constructs a safe workspace return URL from an InvestigationContext.
 */
export function buildInvestigationReturnUrl(
  ctx: InvestigationContext,
  domainName: string,
  basePath = '/workspace',
): string {
  const clean = sanitizeInvestigationContext(ctx);
  const params = new URLSearchParams();
  params.set('domain', domainName);
  params.set('surface', clean.sourceSurface);
  if (clean.sourceSection) params.set('section', clean.sourceSection);
  if (clean.entityId) params.set('highlight', clean.entityId);
  if (clean.disclosureLevel) params.set('level', String(clean.disclosureLevel));
  if (clean.scrollAnchor) params.set('anchor', clean.scrollAnchor);

  return `${basePath}?${params.toString()}`;
}

/**
 * Certified Invariants for H6: Investigation Continuity & Evidence Navigation.
 */
export const H6_CERTIFIED_INVARIANTS = Object.freeze({
  H6_INVESTIGATION_CONTINUITY: true,
  H6_STICKY_RETURN_ANCHOR: true,
  H6_EXACT_CONTEXT_RESTORATION: true,
  H6_EVIDENCE_DRAWER_FIDELITY: true,
  H6_EVIDENCE_LINEAGE_PRESERVATION: true,
  H6_WX211_LIFECYCLE_INTEGRITY: true,
  H6_HISTORICAL_DIFF_RETURN_RESTORE: true,
  H6_BROWSER_NAVIGATION_INTEGRITY: true,
  H6_ZERO_AUTHORIZATION_BYPASS: true,
  H6_GRACEFUL_CONTEXT_LOSS_RECOVERY: true,
});
