import { apiClient } from '../lib/api-client';
import type { SearchQueryOptions, SearchResponseDto } from '../types/api/search.dto';

/**
 * Authoritative Global Search Service (WX-402 / WX-404 / WX-604).
 * Backed strictly by backend GET /api/v1/search.
 */
export const searchService = {
  /**
   * Performs global search across user-owned infrastructure domains, findings, timeline, and briefs.
   */
  async search(
    query: string,
    options: SearchQueryOptions = {},
    signal?: AbortSignal
  ): Promise<SearchResponseDto> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query: '', total: 0, data: [] };
    }

    const params = new URLSearchParams();
    params.set('q', trimmed);

    if (options.limit) params.set('limit', String(options.limit));
    if (options.type && options.type !== 'ALL') params.set('type', options.type);
    if (options.domainId) params.set('domainId', options.domainId);
    if (options.severity) params.set('severity', options.severity);
    if (options.timeRange) params.set('timeRange', options.timeRange);
    if (options.status) params.set('status', options.status);

    return apiClient.get<SearchResponseDto>(`/search?${params.toString()}`, { signal });
  },
};
