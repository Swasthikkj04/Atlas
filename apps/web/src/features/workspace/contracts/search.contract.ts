import type { SearchItemDto, SearchResponseDto } from '../../../types/api/search.dto.ts';
import {
  type WorkspaceNavigationTarget,
  buildWorkspaceNavigationUrl,
} from './cross-experience-navigation.contract.ts';

/**
 * Authoritative Workspace Search States (WX-604).
 */
export type WorkspaceSearchState =
  | 'IDLE'        // No search query entered yet (guidance state)
  | 'LOADING'     // Authoritative backend search in progress
  | 'READY'       // Results found and rendered
  | 'NO_RESULTS'  // Query returned 0 results
  | 'ERROR';      // Search query failed

export interface SearchStateResolverParams {
  readonly query: string;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly data?: SearchResponseDto | null;
}

/**
 * Resolves canonical UI state for cross-workspace search surface.
 */
export function resolveSearchState(params: SearchStateResolverParams): WorkspaceSearchState {
  const { query, isLoading, isError, data } = params;

  if (isError) {
    return 'ERROR';
  }

  if (!query.trim()) {
    return 'IDLE';
  }

  if (isLoading) {
    return 'LOADING';
  }

  if (data && data.data && data.data.length > 0) {
    return 'READY';
  }

  return 'NO_RESULTS';
}

/**
 * Authoritative Search UI Copy Contracts (WX-401).
 */
export const SEARCH_UI_COPY = {
  SEARCH_PLACEHOLDER: 'Search your infrastructure...',
  COLLAPSED_PLACEHOLDER: 'Search infrastructure...',
  KEYBOARD_SHORTCUT: '⌘K',
  EMPTY_TITLE: 'Search your infrastructure',
  EMPTY_DESCRIPTION: 'Find domains, findings, changes, and infrastructure signals.',
  NO_RESULTS_TITLE: (query: string) => `No results for "${query}"`,
  NO_RESULTS_DESCRIPTION: 'Try a domain, finding, change, or infrastructure signal.',
  LOADING_LABEL: 'Searching infrastructure intelligence...',
  LOADING_DESCRIPTION: 'Retrieving authoritative matching entities across your domains',
  ERROR_TITLE: 'Search is temporarily unavailable.',
  ERROR_DESCRIPTION: 'Your Workspace remains available.',
} as const;

/**
 * Authoritative Search Result Group Categories (WX-401).
 */
export type SearchResultGroupCategory =
  | 'DOMAINS'
  | 'FINDINGS'
  | 'CHANGES'
  | 'INFRASTRUCTURE'
  | 'INTELLIGENCE';

export interface SearchResultGroup {
  readonly category: SearchResultGroupCategory;
  readonly label: string;
  readonly items: readonly SearchItemDto[];
}

/**
 * Groups authoritative backend search items by entity category.
 *
 * Grouping strictly follows backend result types; the frontend NEVER infers types from strings.
 */
export function groupSearchResults(
  items: readonly SearchItemDto[]
): readonly SearchResultGroup[] {
  const groups: Record<SearchResultGroupCategory, SearchItemDto[]> = {
    DOMAINS: [],
    FINDINGS: [],
    CHANGES: [],
    INFRASTRUCTURE: [],
    INTELLIGENCE: [],
  };

  for (const item of items) {
    switch (item.type) {
      case 'DOMAIN':
        groups.DOMAINS.push(item);
        break;
      case 'FINDING':
      case 'INVESTIGATION':
        groups.FINDINGS.push(item);
        break;
      case 'CHANGE':
      case 'TIMELINE':
        groups.CHANGES.push(item);
        break;
      case 'INFRASTRUCTURE':
        groups.INFRASTRUCTURE.push(item);
        break;
      case 'BRIEF':
      case 'ACTIVITY':
      default:
        groups.INTELLIGENCE.push(item);
        break;
    }
  }

  const result: SearchResultGroup[] = [];

  if (groups.DOMAINS.length > 0) {
    result.push({ category: 'DOMAINS', label: 'Domains', items: groups.DOMAINS });
  }
  if (groups.FINDINGS.length > 0) {
    result.push({ category: 'FINDINGS', label: 'Findings', items: groups.FINDINGS });
  }
  if (groups.CHANGES.length > 0) {
    result.push({ category: 'CHANGES', label: 'Changes', items: groups.CHANGES });
  }
  if (groups.INFRASTRUCTURE.length > 0) {
    result.push({
      category: 'INFRASTRUCTURE',
      label: 'Infrastructure',
      items: groups.INFRASTRUCTURE,
    });
  }
  if (groups.INTELLIGENCE.length > 0) {
    result.push({
      category: 'INTELLIGENCE',
      label: 'Intelligence',
      items: groups.INTELLIGENCE,
    });
  }

  return result;
}

/**
 * Deterministic Search Result Ranking (WX-401).
 *
 * Ranking Hierarchy:
 * 1. Exact match on title or domainName (Highest)
 * 2. Prefix match on title or domainName
 * 3. Strong partial match (contains query)
 * 4. Entity relevance score from backend
 */
export function rankSearchResults(
  items: readonly SearchItemDto[],
  query: string
): readonly SearchItemDto[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return [...items].sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aDomain = (a.domainName || '').toLowerCase();
    const bDomain = (b.domainName || '').toLowerCase();

    // 1. Exact match
    const aExact = aTitle === normalizedQuery || aDomain === normalizedQuery;
    const bExact = bTitle === normalizedQuery || bDomain === normalizedQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // 2. Prefix match
    const aPrefix = aTitle.startsWith(normalizedQuery) || aDomain.startsWith(normalizedQuery);
    const bPrefix = bTitle.startsWith(normalizedQuery) || bDomain.startsWith(normalizedQuery);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;

    // 3. Partial match
    const aContains = aTitle.includes(normalizedQuery) || aDomain.includes(normalizedQuery);
    const bContains = bTitle.includes(normalizedQuery) || bDomain.includes(normalizedQuery);
    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;

    // 4. Backend relevance score
    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
  });
}

/**
 * Checks whether a keyboard event corresponds to the Search trigger (⌘K / Ctrl+K).
 */
export function isSearchTriggerKey(event: {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
}): boolean {
  return (
    (Boolean(event.metaKey) || Boolean(event.ctrlKey)) &&
    event.key.toLowerCase() === 'k'
  );
}

/**
 * Computes next keyboard active index with circular wrapping.
 */
export function getNextSearchActiveIndex(
  currentIndex: number,
  total: number,
  direction: 'UP' | 'DOWN'
): number {
  if (total <= 0) return 0;
  if (direction === 'DOWN') {
    return (currentIndex + 1) % total;
  }
  return (currentIndex - 1 + total) % total;
}

/**
 * Maps an authoritative backend SearchItemDto to a WX-601 Navigation Target.
 *
 * Supported Backend Types:
 * - DOMAIN         -> Current Intelligence for domain
 * - FINDING        -> Finding Investigation
 * - CHANGE         -> Change Investigation
 * - TIMELINE       -> Change Investigation
 * - INFRASTRUCTURE -> Infrastructure Overview
 * - BRIEF          -> Executive Brief / Story Investigation
 * - INVESTIGATION  -> Finding Investigation
 * - ACTIVITY       -> Infrastructure Memory
 */
export function mapSearchResultToNavigationTarget(
  item: SearchItemDto,
  domainId: string,
  returnPath: string = '/workspace'
): WorkspaceNavigationTarget {
  const targetDomainId = item.domainId || domainId;

  switch (item.type) {
    case 'DOMAIN':
      return {
        domainId: targetDomainId,
        experience: 'current',
      };
    case 'FINDING':
    case 'INVESTIGATION':
      return {
        domainId: targetDomainId,
        resourceType: 'finding',
        resourceId: item.id,
        returnPath,
      };
    case 'CHANGE':
    case 'TIMELINE':
      return {
        domainId: targetDomainId,
        resourceType: 'change',
        resourceId: item.id,
        returnPath,
      };
    case 'INFRASTRUCTURE':
      return {
        domainId: targetDomainId,
        experience: 'overview',
        returnPath,
      };
    case 'BRIEF':
      return {
        domainId: targetDomainId,
        resourceType: 'story',
        resourceId: item.id,
        returnPath,
      };
    case 'ACTIVITY':
      return {
        domainId: targetDomainId,
        experience: 'memory',
        returnPath,
      };
    default:
      return {
        domainId: targetDomainId,
        experience: 'current',
      };
  }
}

/**
 * Authoritative Search Destination Resolution Result (WX-405).
 */
export interface SearchDestinationResolution {
  readonly targetDomainId: string;
  readonly url: string;
  readonly navigationTarget: WorkspaceNavigationTarget;
}

/**
 * Canonical centralized destination resolution for Search results (WX-405).
 *
 * Resolves the exact canonical Workspace URL and navigation target from an authoritative SearchItemDto.
 * Invariants:
 * - Deterministic, no string heuristics
 * - Preserves authoritative domainId
 * - Preserves authoritative resource identifiers
 * - Does not leak transient query/filter states into URL
 */
export function resolveSearchDestination(
  item: SearchItemDto,
  fallbackDomainId?: string,
  returnPath: string = '/workspace'
): SearchDestinationResolution {
  const targetDomainId = item.domainId || fallbackDomainId || '';
  const navigationTarget = mapSearchResultToNavigationTarget(
    item,
    targetDomainId,
    returnPath
  );
  const url = buildWorkspaceNavigationUrl(navigationTarget);

  return {
    targetDomainId,
    url,
    navigationTarget,
  };
}
