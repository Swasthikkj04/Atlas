import type { UserDto, DomainDto } from '../../../types/api';
import {
  type WorkspaceEntryType,
  type GuestClaimContext,
  resolveWorkspaceEntry,
} from './entry-state.contract.ts';

/**
 * Parameters supplied to the authoritative Workspace Context Resolver (WX-202).
 */
export interface WorkspaceContextResolutionParams {
  /** Current authenticated user */
  readonly user: UserDto | null;
  /** List of domains owned by the user's workspace */
  readonly domains?: readonly DomainDto[] | null;
  /** Guest claim context if user originated from Guest Experience */
  readonly guestClaimContext?: GuestClaimContext | null;
  /** Explicit domain ID in URL/query parameter if requested */
  readonly requestedDomainId?: string | null;
}

/**
 * Authoritative Workspace Context Resolution Result (WX-202).
 *
 * Exposes the verified, deterministic active infrastructure context
 * consumed by all Phase 2 Workspace experiences.
 */
export interface WorkspaceContextResolutionResult {
  /** Resolved entry classification (direct | guestClaim | returning) */
  readonly entryType: WorkspaceEntryType;
  /** Authoritative active domain object */
  readonly activeDomain: DomainDto | null;
  /** Authoritative active domain ID */
  readonly activeDomainId: string | null;
  /** Whether the workspace requires the first-run domain setup experience */
  readonly requiresFirstRunSetup: boolean;
  /** Whether this session originates from a Guest claim */
  readonly isGuestClaim: boolean;
  /** True if client requested a domain ID that does not belong to the user */
  readonly isRequestedDomainMismatch: boolean;
  /** List of all verified domains owned by the user */
  readonly availableDomains: readonly DomainDto[];
}

/**
 * Authoritative Workspace Context Resolver (WX-202).
 *
 * Deterministic, side-effect-free, intelligence-free pure function that converts
 * user, domain, and claim state into an authoritative active Workspace context.
 *
 * Security Invariants:
 * 1. Never activates an arbitrary requestedDomainId without ownership verification.
 * 2. Does not mutate server or client state.
 * 3. Does not calculate finding metrics, severity, or historical significance.
 */
export function resolveWorkspaceContext(
  params: WorkspaceContextResolutionParams
): WorkspaceContextResolutionResult {
  const { domains = [], requestedDomainId = null } = params;
  const establishedDomains = domains || [];

  // 1. Ownership & Security Check for requestedDomainId
  let isRequestedDomainMismatch = false;
  let verifiedRequestedDomainId: string | null = null;

  if (requestedDomainId) {
    const isOwned = establishedDomains.some((d) => d.id === requestedDomainId);
    if (isOwned) {
      verifiedRequestedDomainId = requestedDomainId;
    } else {
      isRequestedDomainMismatch = true;
    }
  }

  // 2. Resolve Canonical Entry State using WX-201
  const entryResult = resolveWorkspaceEntry({
    ...params,
    requestedDomainId: verifiedRequestedDomainId,
  });

  const activeDomain = entryResult.activeDomain;

  return {
    entryType: entryResult.type,
    activeDomain,
    activeDomainId: activeDomain ? activeDomain.id : null,
    requiresFirstRunSetup: entryResult.requiresFirstRunSetup,
    isGuestClaim: entryResult.type === 'guestClaim',
    isRequestedDomainMismatch,
    availableDomains: establishedDomains,
  };
}
