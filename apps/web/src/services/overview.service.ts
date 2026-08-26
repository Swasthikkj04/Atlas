import { apiClient } from '../lib/api-client';
import type { DomainOverviewResponseDto } from '../types/api';

/**
 * Authoritative Infrastructure Overview API Service (WX-401).
 */
export const overviewService = {
  getDomainOverview: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<DomainOverviewResponseDto>(
      `/domains/${encodeURIComponent(domainId)}/overview`,
      { signal }
    ),
};
