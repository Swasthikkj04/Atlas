import type {
  WorkspaceExperienceType,
  WorkspaceResourceType,
  WorkspaceNavigationTarget,
} from './cross-experience-navigation.contract.ts';

/**
 * Validates and sanitizes a return path to ensure it remains strictly within safe Workspace boundaries.
 *
 * Rejects malicious schemes (javascript:, data:), protocol-relative URLs (//evil.com),
 * and external redirects, safely defaulting to the fallback.
 */
export function validateReturnPath(
  returnPath: string | null | undefined,
  fallback = '/workspace'
): string {
  if (!returnPath || typeof returnPath !== 'string') {
    return fallback;
  }

  const trimmed = returnPath.trim();

  // Must start with a single '/'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('file:')
  ) {
    return fallback;
  }

  return trimmed;
}

/**
 * Authoritative Navigation Recovery Hierarchy.
 *
 * When an exploratory resource (e.g. Evidence) becomes stale or unavailable,
 * gracefully degrades to the nearest parent logical context rather than collapsing to root.
 */
export function resolveNearestValidNavigationContext(params: {
  readonly domainId: string;
  readonly failedResourceType?: WorkspaceResourceType;
  readonly availableParentResourceType?: WorkspaceResourceType;
  readonly availableParentResourceId?: string;
  readonly fallbackExperience?: WorkspaceExperienceType;
}): WorkspaceNavigationTarget {
  const {
    domainId,
    failedResourceType,
    availableParentResourceType,
    availableParentResourceId,
    fallbackExperience = 'current',
  } = params;

  // 1. If an explicit valid parent resource was provided, recover to it
  if (availableParentResourceType && availableParentResourceId) {
    return {
      domainId,
      resourceType: availableParentResourceType,
      resourceId: availableParentResourceId,
      returnPath: '/workspace',
    };
  }

  // 2. Hierarchical logical degradation
  switch (failedResourceType) {
    case 'evidence':
    case 'historical_context':
      // Degrade to Memory/Timeline
      return {
        domainId,
        experience: 'memory',
        returnPath: '/workspace',
      };

    case 'finding':
    case 'story':
      // Degrade to Current Intelligence
      return {
        domainId,
        experience: 'current',
        returnPath: '/workspace',
      };

    case 'change':
    case 'snapshot':
    case 'timeline_event':
      // Degrade to Memory
      return {
        domainId,
        experience: 'memory',
        returnPath: '/workspace',
      };

    default:
      return {
        domainId,
        experience: fallbackExperience,
        returnPath: '/workspace',
      };
  }
}

export interface HydrateWorkspaceParams {
  readonly searchParams: URLSearchParams | string;
  readonly activeDomainId?: string;
  readonly knownDomainIds?: readonly string[];
}

export interface HydratedWorkspaceContext {
  readonly domainId?: string;
  readonly experience: WorkspaceExperienceType;
  readonly resourceType?: WorkspaceResourceType;
  readonly resourceId?: string;
  readonly returnPath: string;
  readonly isDomainValid: boolean;
}

/**
 * Pure, authoritative URL search params hydrator for Workspace experiences.
 */
export function hydrateWorkspaceUrlParams(
  params: HydrateWorkspaceParams
): HydratedWorkspaceContext {
  const { searchParams, activeDomainId, knownDomainIds } = params;

  const urlParams =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams.startsWith('?') ? searchParams : `?${searchParams}`)
      : searchParams;

  const rawDomainId = urlParams.get('domainId') || activeDomainId;
  const isDomainValid =
    !knownDomainIds || (rawDomainId ? knownDomainIds.includes(rawDomainId) : false);

  const rawView = urlParams.get('view');
  let experience: WorkspaceExperienceType = 'current';
  if (rawView === 'overview') {
    experience = 'overview';
  } else if (rawView === 'memory') {
    experience = 'memory';
  }

  const rawSourceType = urlParams.get('sourceType') as WorkspaceResourceType | null;
  const rawSourceId = urlParams.get('sourceId') || undefined;
  const rawReturnPath = urlParams.get('returnPath');

  const validResourceTypes: readonly WorkspaceResourceType[] = [
    'story',
    'finding',
    'change',
    'snapshot',
    'historical_context',
    'evidence',
    'timeline_event',
  ];

  const resourceType =
    rawSourceType && validResourceTypes.includes(rawSourceType) ? rawSourceType : undefined;

  const resourceId = resourceType ? rawSourceId : undefined;
  const returnPath = validateReturnPath(rawReturnPath, '/workspace');

  return {
    domainId: rawDomainId || undefined,
    experience,
    resourceType,
    resourceId,
    returnPath,
    isDomainValid,
  };
}

/**
 * Validates that an asynchronous query or mutation response belongs strictly to the currently active domain context.
 *
 * Prevents late in-flight responses from previously selected domains from polluting the active UI state.
 */
export function isResponseValidForActiveContext(
  responseDomainId: string | null | undefined,
  activeDomainId: string | null | undefined
): boolean {
  if (!responseDomainId || !activeDomainId) {
    return false;
  }
  return responseDomainId === activeDomainId;
}
