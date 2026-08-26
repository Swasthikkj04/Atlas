import type { DomainDto } from '../../../types/api';
import {
  type InvestigationSourceType,
  resolveInvestigationTarget,
  buildInvestigationLink,
} from './investigation.contract.ts';

/**
 * Authoritative Major Workspace Experience Types (WX-601).
 *
 * Defines the three primary root presentation views within a domain workspace:
 * - 'current': Current Intelligence ("What matters right now?")
 * - 'overview': Infrastructure Overview ("What exists right now?")
 * - 'memory': Infrastructure Memory ("How did it evolve over time?")
 */
export type WorkspaceExperienceType = 'current' | 'overview' | 'memory';

/**
 * Authoritative Workspace Resource Target Types (WX-601).
 *
 * Sourced strictly from existing frozen Phase 2-5 backend and frontend contracts:
 * - 'story': Primary or secondary intelligence story with underlying findings/changes
 * - 'finding': Operational, security, or compliance finding with observation evidence
 * - 'change': Historical infrastructure change event with before/after state
 * - 'snapshot': Immutable historical infrastructure snapshot state
 * - 'historical_context': Vertical temporal context (Earlier -> Previous -> Current)
 * - 'evidence': Raw protocol capture, DNS records, or cryptographic certificates
 * - 'timeline_event': Authoritative timeline event entry
 */
export type WorkspaceResourceType =
  | 'story'
  | 'finding'
  | 'change'
  | 'snapshot'
  | 'historical_context'
  | 'historical_comparison'
  | 'evidence'
  | 'timeline_event';

/**
 * Canonical Workspace Cross-Experience Navigation Target.
 *
 * Unifies all major experience transitions under one authoritative, typed schema.
 */
export interface WorkspaceNavigationTarget {
  /** The tenant infrastructure domain this navigation is scoped to */
  readonly domainId: string;
  /** Primary root experience view if transitioning at top-level */
  readonly experience?: WorkspaceExperienceType;
  /** Canonical resource classification if drilling into a specific resource */
  readonly resourceType?: WorkspaceResourceType;
  /** Authoritative backend resource identifier */
  readonly resourceId?: string;
  /** Hierarchical return path preserving user origin */
  readonly returnPath?: string;
}

/**
 * Navigation Transition Validation Contract.
 *
 * Formally documents allowed transitions between major Workspace surfaces.
 * Invariant: The frontend presents relationships; it NEVER invents or infers them.
 */
export interface TransitionRule {
  readonly from: WorkspaceExperienceType | WorkspaceResourceType;
  readonly allowedDestinations: readonly (WorkspaceExperienceType | WorkspaceResourceType)[];
  readonly requiresAuthoritativeLink: boolean;
}

/**
 * Authoritative Canonical Transition Matrix (WX-601).
 */
export const WORKSPACE_TRANSITION_MATRIX: readonly TransitionRule[] = [
  {
    from: 'current',
    allowedDestinations: ['overview', 'memory', 'finding', 'change', 'story'],
    requiresAuthoritativeLink: false,
  },
  {
    from: 'overview',
    allowedDestinations: ['current', 'memory', 'finding', 'snapshot'],
    requiresAuthoritativeLink: false,
  },
  {
    from: 'memory',
    allowedDestinations: ['current', 'overview', 'timeline_event', 'change', 'snapshot', 'historical_context'],
    requiresAuthoritativeLink: false,
  },
  {
    from: 'story',
    allowedDestinations: ['finding', 'change', 'evidence'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'finding',
    allowedDestinations: ['evidence', 'change', 'snapshot'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'change',
    allowedDestinations: ['snapshot', 'evidence', 'finding', 'historical_context'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'snapshot',
    allowedDestinations: ['evidence', 'historical_context', 'change'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'historical_context',
    allowedDestinations: ['snapshot', 'change', 'evidence'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'evidence',
    allowedDestinations: ['finding', 'change', 'snapshot', 'historical_context'],
    requiresAuthoritativeLink: true,
  },
  {
    from: 'timeline_event',
    allowedDestinations: ['change', 'snapshot', 'evidence'],
    requiresAuthoritativeLink: true,
  },
];

/**
 * Resolution parameters for cross-experience navigation.
 */
export interface CrossExperienceResolutionParams {
  readonly target: WorkspaceNavigationTarget;
  readonly activeDomainId: string;
  readonly userDomains?: readonly DomainDto[] | null;
}

/**
 * Resolution result for cross-experience navigation.
 */
export interface CrossExperienceResolutionResult {
  /** Whether the navigation target is authenticated, authorized, and well-formed */
  readonly isValid: boolean;
  /** Whether a cross-domain access attempt was detected and rejected (P0) */
  readonly isDomainMismatch: boolean;
  /** The authorized domain ID to execute queries against */
  readonly targetDomainId: string;
  /** Target top-level experience view */
  readonly experience: WorkspaceExperienceType;
  /** Target resource type if deep-investigating */
  readonly resourceType?: WorkspaceResourceType;
  /** Target resource ID if deep-investigating */
  readonly resourceId?: string;
  /** Safe return path */
  readonly returnPath: string;
}

/**
 * Pure function to validate and resolve a Cross-Experience Navigation Target.
 *
 * Invariants:
 * 1. Domain context is mandatory for all domain-scoped transitions.
 * 2. Cross-domain requests are strictly intercepted as UNAVAILABLE without leaking metadata.
 * 3. Never synthesizes client-side relationships or causality.
 */
export function resolveCrossExperienceNavigation(
  params: CrossExperienceResolutionParams
): CrossExperienceResolutionResult {
  const { target, activeDomainId, userDomains = [] } = params;
  const ownedDomains = userDomains || [];

  if (!target.domainId) {
    return {
      isValid: false,
      isDomainMismatch: false,
      targetDomainId: activeDomainId,
      experience: 'current',
      returnPath: '/workspace',
    };
  }

  const isExplicitlyOwned = ownedDomains.length === 0 || ownedDomains.some((d) => d.id === target.domainId);
  const isMatchesActive = target.domainId === activeDomainId;

  // P0 Security Boundary: Cross-domain or unowned target rejection
  if (!isMatchesActive && !isExplicitlyOwned && ownedDomains.length > 0) {
    return {
      isValid: false,
      isDomainMismatch: true,
      targetDomainId: activeDomainId,
      experience: 'current',
      returnPath: '/workspace',
    };
  }

  // Handle resource-scoped deep investigations
  if (target.resourceType && target.resourceId) {
    const investigationResult = resolveInvestigationTarget({
      context: {
        domainId: target.domainId,
        sourceType: target.resourceType as InvestigationSourceType,
        sourceId: target.resourceId,
        returnPath: target.returnPath,
      },
      activeDomainId,
      userDomains,
    });

    return {
      isValid: investigationResult.isValid,
      isDomainMismatch: investigationResult.isDomainMismatch,
      targetDomainId: investigationResult.targetDomainId,
      experience: target.experience || 'current',
      resourceType: target.resourceType,
      resourceId: target.resourceId,
      returnPath: investigationResult.returnPath,
    };
  }

  // Top-level experience view navigation
  return {
    isValid: true,
    isDomainMismatch: false,
    targetDomainId: target.domainId,
    experience: target.experience || 'current',
    returnPath: target.returnPath || '/workspace',
  };
}

/**
 * Pure function to construct a canonical Workspace URL from a navigation target.
 */
export function buildWorkspaceNavigationUrl(target: WorkspaceNavigationTarget): string {
  const { domainId, experience, resourceType, resourceId, returnPath } = target;

  if (resourceType && resourceId) {
    return buildInvestigationLink(
      domainId,
      resourceType as InvestigationSourceType,
      resourceId,
      returnPath || '/workspace'
    );
  }

  if (experience === 'memory') {
    return domainId ? `/workspace/memory?domainId=${encodeURIComponent(domainId)}` : '/workspace/memory';
  }

  if (experience === 'overview') {
    return domainId ? `/workspace?view=overview&domainId=${encodeURIComponent(domainId)}` : '/workspace?view=overview';
  }

  return domainId ? `/workspace?domainId=${encodeURIComponent(domainId)}` : '/workspace';
}

/**
 * Pure function to parse a URL search string or pathname into a WorkspaceNavigationTarget.
 */
export function parseWorkspaceNavigationUrl(
  pathname: string,
  search: string
): WorkspaceNavigationTarget {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const domainId = params.get('domainId') || '';
  const sourceType = params.get('sourceType') as WorkspaceResourceType | null;
  const sourceId = params.get('sourceId') || undefined;
  const returnPath = params.get('returnPath') || undefined;
  const viewParam = params.get('view');

  let experience: WorkspaceExperienceType = 'current';
  if (pathname === '/workspace/memory' || viewParam === 'memory') {
    experience = 'memory';
  } else if (viewParam === 'overview') {
    experience = 'overview';
  }

  return {
    domainId,
    experience,
    resourceType: sourceType || undefined,
    resourceId: sourceId,
    returnPath,
  };
}

/**
 * Pure function to unwind the next return target from a hierarchical returnPath string.
 */
export function unwindWorkspaceNavigationReturnPath(
  returnPath?: string | null,
  activeDomainId?: string
): WorkspaceNavigationTarget {
  if (!returnPath || returnPath === '/workspace') {
    return {
      domainId: activeDomainId || '',
      experience: 'current',
      returnPath: '/workspace',
    };
  }

  if (returnPath === '/workspace/memory' || returnPath.includes('view=memory')) {
    return {
      domainId: activeDomainId || '',
      experience: 'memory',
      returnPath: '/workspace',
    };
  }

  if (returnPath.includes('view=overview')) {
    return {
      domainId: activeDomainId || '',
      experience: 'overview',
      returnPath: '/workspace',
    };
  }

  const queryStr = returnPath.includes('?') ? returnPath.split('?')[1] : '';
  const params = new URLSearchParams(queryStr);
  const sourceType = params.get('sourceType') as WorkspaceResourceType | null;
  const sourceId = params.get('sourceId');
  const domainId = params.get('domainId') || activeDomainId || '';
  const nextReturnPath = params.get('returnPath') || '/workspace';

  if (sourceType && sourceId) {
    return {
      domainId,
      resourceType: sourceType,
      resourceId: sourceId,
      returnPath: nextReturnPath,
    };
  }

  return {
    domainId,
    experience: 'current',
    returnPath: '/workspace',
  };
}
