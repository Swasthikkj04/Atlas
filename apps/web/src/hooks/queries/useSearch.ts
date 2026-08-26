import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { searchService } from '../../services/search.service';
import type { SearchQueryOptions, SearchResponseDto } from '../../types/api/search.dto';

/**
 * Authoritative Cross-Workspace Search Query Hook (WX-402 / WX-404 / WX-604).
 */
export const useSearch = (query: string, options: SearchQueryOptions = {}) => {
  const { enabled = true } = options;
  const trimmed = query.trim();

  return useQuery<SearchResponseDto, Error>({
    queryKey: queryKeys.search.query(trimmed, options as Record<string, unknown>),
    queryFn: ({ signal }) => searchService.search(trimmed, options, signal),
    enabled: enabled && trimmed.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};
