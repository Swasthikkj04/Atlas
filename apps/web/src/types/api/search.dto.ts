/**
 * Authoritative Search Item Type emitted by Backend (WX-401 / WX-604).
 */
export type SearchItemType =
  | 'DOMAIN'
  | 'FINDING'
  | 'CHANGE'
  | 'TIMELINE'
  | 'INFRASTRUCTURE'
  | 'BRIEF'
  | 'INVESTIGATION'
  | 'ACTIVITY';

/**
 * Authoritative Search Filter Options (WX-404).
 */
export interface SearchQueryOptions {
  readonly type?: SearchItemType | 'ALL';
  readonly domainId?: string;
  readonly severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  readonly timeRange?: '24h' | '7d' | '30d';
  readonly status?: string;
  readonly limit?: number;
  readonly enabled?: boolean;
}

/**
 * Authoritative Search Item DTO.
 * Backed strictly by GET /api/v1/search.
 */
export interface SearchItemDto {
  readonly id: string;
  readonly type: SearchItemType;
  readonly title: string;
  readonly description: string;
  readonly subtitle?: string;
  readonly domainId?: string;
  readonly domainName: string;
  readonly relevanceScore: number;
  readonly metadata?: Record<string, unknown>;
  readonly destination?: string;
}

/**
 * Authoritative Search Contextual Facets DTO (WX-404).
 */
export interface SearchFacetsDto {
  readonly types?: Record<string, number>;
  readonly severities?: Record<string, number>;
  readonly domains?: Record<string, number>;
}

/**
 * Authoritative Global Search Response DTO.
 */
export interface SearchResponseDto {
  readonly query: string;
  readonly total: number;
  readonly data: readonly SearchItemDto[];
  readonly facets?: SearchFacetsDto;
}
