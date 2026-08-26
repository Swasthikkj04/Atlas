import type { UserDto, DomainDto } from '../../../types/api';

/**
 * Authoritative Canonical Entry Types for Nebula Workspace (WX-201).
 *
 * 1. 'direct': New registered user with no claimed guest domain and no established domains.
 * 2. 'guestClaim': User registered with an active/pending guest claim context.
 * 3. 'returning': Previously established account with existing Workspace domains.
 */
export type WorkspaceEntryType = 'direct' | 'guestClaim' | 'returning';

/**
 * Context of a Guest session transitioned to registration.
 */
export interface GuestClaimContext {
  readonly domain: string;
  readonly jobId?: string;
  readonly snapshotId?: string;
  readonly briefId?: string;
  readonly claimedAt?: string;
}

/**
 * Input parameters supplied to the Workspace Entry Resolver.
 */
export interface WorkspaceEntryResolutionParams {
  /** Current authenticated user */
  readonly user: UserDto | null;
  /** List of domains owned by the user's workspace */
  readonly domains?: readonly DomainDto[] | null;
  /** Guest claim context if user originated from Guest Experience */
  readonly guestClaimContext?: GuestClaimContext | null;
  /** Explicit domain ID in URL/search params if requested */
  readonly requestedDomainId?: string | null;
}

/**
 * Resolved Workspace Entry State Result.
 */
export interface WorkspaceEntryResolutionResult {
  /** Canonical entry classification */
  readonly type: WorkspaceEntryType;
  /** Authoritative active domain resolved for the session */
  readonly activeDomain: DomainDto | null;
  /** Guest claim context if preserved */
  readonly guestClaim: GuestClaimContext | null;
  /** Whether the workspace has at least one established domain */
  readonly hasEstablishedDomains: boolean;
  /** Whether the user should be directed to the first-run domain setup flow */
  readonly requiresFirstRunSetup: boolean;
}

/**
 * Authoritative Workspace Entry Resolver (WX-201).
 *
 * Pure function that deterministically resolves how an authenticated user
 * enters the Workspace without calculating or modifying intelligence.
 *
 * Evaluation Rules:
 * 1. If guestClaimContext exists with a domain -> 'guestClaim'
 * 2. Else if user has 1 or more established domains -> 'returning'
 * 3. Otherwise -> 'direct'
 */
export function resolveWorkspaceEntry(
  params: WorkspaceEntryResolutionParams
): WorkspaceEntryResolutionResult {
  const { domains = [], guestClaimContext = null, requestedDomainId = null } = params;

  const establishedDomains = domains || [];
  const hasEstablishedDomains = establishedDomains.length > 0;

  // 1. Guest Claim Entry State (Continuity from Guest Experience)
  if (guestClaimContext && guestClaimContext.domain) {
    // Look up if the claimed domain already exists in the user's domains
    const matchingDomain =
      establishedDomains.find(
        (d) => d.domainName.toLowerCase() === guestClaimContext.domain.toLowerCase()
      ) || null;

    return {
      type: 'guestClaim',
      activeDomain: matchingDomain,
      guestClaim: guestClaimContext,
      hasEstablishedDomains,
      requiresFirstRunSetup: false,
    };
  }

  // 2. Returning Registered User Entry State
  if (hasEstablishedDomains) {
    // Resolve active domain: requestedDomainId > first active domain > first domain
    let activeDomain: DomainDto | null = null;

    if (requestedDomainId) {
      activeDomain = establishedDomains.find((d) => d.id === requestedDomainId) || null;
    }

    if (!activeDomain) {
      activeDomain = establishedDomains.find((d) => d.status === 'ACTIVE') || establishedDomains[0] || null;
    }

    return {
      type: 'returning',
      activeDomain,
      guestClaim: null,
      hasEstablishedDomains: true,
      requiresFirstRunSetup: false,
    };
  }

  // 3. New Direct Registered User Entry State
  return {
    type: 'direct',
    activeDomain: null,
    guestClaim: null,
    hasEstablishedDomains: false,
    requiresFirstRunSetup: true,
  };
}
