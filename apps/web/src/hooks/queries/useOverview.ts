import { useQuery } from '@tanstack/react-query';
import { overviewService } from '../../services/overview.service';
import { queryKeys } from './query-keys';
import type { DomainOverviewResponseDto } from '../../types/api';

/**
 * Hook to retrieve authoritative domain overview intelligence (WX-401).
 */
export function useDomainOverview(domainId: string | null | undefined) {
  return useQuery<DomainOverviewResponseDto>({
    queryKey: queryKeys.domains.overview(domainId || ''),
    queryFn: ({ signal }) => overviewService.getDomainOverview(domainId!, signal),
    enabled: Boolean(domainId),
  });
}
