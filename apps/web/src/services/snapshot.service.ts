import { apiClient } from '../lib/api-client';
import type {
  InfrastructureSnapshotDto,
  SnapshotListResponseDto,
} from '../types/api';

export const snapshotService = {
  getSnapshotsForDomain: (
    domainId: string,
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal
  ) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return apiClient.get<SnapshotListResponseDto>(
      `/domains/${encodeURIComponent(domainId)}/snapshots${qs}`,
      { signal }
    );
  },

  getSnapshotById: (snapshotId: string, signal?: AbortSignal) =>
    apiClient.get<InfrastructureSnapshotDto>(
      `/snapshots/${encodeURIComponent(snapshotId)}`,
      { signal }
    ),
};
