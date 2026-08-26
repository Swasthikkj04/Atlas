import type { DomainDto } from '../../../types/api';

/**
 * Authoritative Investigation Source Types (WX-301).
 *
 * Defines the canonical entry points into Phase 3 Investigation:
 * - 'story': A Primary or Secondary Story identified by backend intelligence
 * - 'finding': A specific infrastructure finding with causal lineage
 * - 'change': An authoritative timeline change event with before/after state
 * - 'evidence': Direct raw observation or cryptographic artifact
 * - 'snapshot': Authoritative historical snapshot lineage and temporal baseline
 * - 'historical_context': Authoritative temporal context (Earlier -> Previous -> Current)
 */
export type InvestigationSourceType =
  | 'story'
  | 'finding'
  | 'change'
  | 'evidence'
  | 'snapshot'
  | 'historical_context'
  | 'historical_comparison';

/**
 * Investigation Context Contract.
 *
 * Encapsulates the active investigation target and preserves domain identity
 * and return navigation.
 */
export interface InvestigationContext {
  /** The infrastructure domain this investigation belongs to */
  readonly domainId: string;
  /** The classification of the investigation entry point */
  readonly sourceType: InvestigationSourceType;
  /** The authoritative backend ID of the target resource */
  readonly sourceId: string;
  /** Optional base snapshot ID for historical comparisons */
  readonly baseSnapshotId?: string;
  /** Optional return path to restore user position (default: '/workspace') */
  readonly returnPath?: string;
}

/**
 * Input parameters for verifying and resolving an investigation context.
 */
export interface InvestigationResolutionParams {
  /** Target investigation context */
  readonly context: InvestigationContext;
  /** Active Workspace domain ID */
  readonly activeDomainId: string;
  /** List of all verified domains owned by the authenticated user */
  readonly userDomains?: readonly DomainDto[] | null;
}

/**
 * Result of validating and resolving an investigation context.
 */
export interface InvestigationResolutionResult {
  /** Whether the investigation request is authenticated and authorized */
  readonly isValid: boolean;
  /** Whether a cross-domain access attempt was detected and rejected */
  readonly isDomainMismatch: boolean;
  /** The authoritative domain ID to execute investigation queries against */
  readonly targetDomainId: string;
  /** The canonical source type */
  readonly sourceType: InvestigationSourceType;
  /** The authoritative backend source identifier */
  readonly sourceId: string;
  /** Safe return navigation path */
  readonly returnPath: string;
}

/**
 * Authoritative Investigation Target Resolver (WX-301).
 *
 * Pure, deterministic function that:
 * 1. Enforces tenant/domain ownership boundaries (rejects unowned resource investigation)
 * 2. Prevents cross-domain cache contamination
 * 3. Resolves safe return paths
 * 4. Never calculates intelligence, diffs snapshots, or synthesizes narratives locally
 */
export function resolveInvestigationTarget(
  params: InvestigationResolutionParams
): InvestigationResolutionResult {
  const { context, activeDomainId, userDomains = [] } = params;
  const ownedDomains = userDomains || [];

  const isExplicitlyOwned = ownedDomains.some((d) => d.id === context.domainId);
  const isMatchesActive = context.domainId === activeDomainId;

  // Domain Security Boundary Enforcement:
  // If target domain is not the active domain and not in the user's owned domains, reject
  if (!isMatchesActive && !isExplicitlyOwned && ownedDomains.length > 0) {
    return {
      isValid: false,
      isDomainMismatch: true,
      targetDomainId: activeDomainId,
      sourceType: context.sourceType,
      sourceId: context.sourceId,
      returnPath: context.returnPath || '/workspace',
    };
  }

  return {
    isValid: true,
    isDomainMismatch: false,
    targetDomainId: context.domainId || activeDomainId,
    sourceType: context.sourceType,
    sourceId: context.sourceId,
    returnPath: context.returnPath || '/workspace',
  };
}

/**
 * Constructs a safe, normalized investigation query link.
 */
export function buildInvestigationLink(
  domainId: string,
  sourceType: InvestigationSourceType,
  sourceId: string,
  returnPath: string = '/workspace',
  baseSnapshotId?: string
): string {
  const query = new URLSearchParams({
    domainId,
    sourceType,
    sourceId,
    returnPath,
  });
  if (baseSnapshotId) {
    query.set('baseSnapshotId', baseSnapshotId);
  }
  return `/workspace?${query.toString()}`;
}
