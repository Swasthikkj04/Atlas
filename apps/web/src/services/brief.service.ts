import { apiClient } from '../lib/api-client';
import type { InfrastructureBriefDto } from '../types/api';

export const briefService = {
  getBriefForSnapshot: (snapshotId: string, signal?: AbortSignal) =>
    apiClient.get<InfrastructureBriefDto>(
      `/snapshots/${encodeURIComponent(snapshotId)}/brief`,
      { signal }
    ),

  getLatestBriefForDomain: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<InfrastructureBriefDto>(
      `/domains/${encodeURIComponent(domainId)}/brief`,
      { signal }
    ),
};
