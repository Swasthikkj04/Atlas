import { apiClient } from '../lib/api-client.ts';
import type {
  DriftAlertDto,
  InfrastructureSnapshotDto,
  SnapshotDriftForensicsDto,
  SnapshotListResponseDto,
} from '../types/api/index.ts';

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

  getSnapshotDiff: (
    domainId: string,
    targetSnapshotId: string,
    baseSnapshotId?: string,
    signal?: AbortSignal
  ) => {
    const qs = baseSnapshotId ? `?baseSnapshotId=${encodeURIComponent(baseSnapshotId)}` : '';
    return apiClient.get<SnapshotDriftForensicsDto>(
      `/domains/${encodeURIComponent(domainId)}/snapshots/${encodeURIComponent(targetSnapshotId)}/diff${qs}`,
      { signal }
    );
  },

  getDomainDriftAlerts: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<DriftAlertDto[]>(
      `/domains/${encodeURIComponent(domainId)}/drift-alerts`,
      { signal }
    ),

  getWorkspaceDriftAlerts: (signal?: AbortSignal) =>
    apiClient.get<DriftAlertDto[]>(
      `/workspace/drift-alerts`,
      { signal }
    ),

  acknowledgeDriftAlert: (domainId: string, alertId: string) =>
    apiClient.patch<DriftAlertDto>(
      `/domains/${encodeURIComponent(domainId)}/drift-alerts/${encodeURIComponent(alertId)}/ack`,
      {}
    ),

  resolveDriftAlert: (domainId: string, alertId: string) =>
    apiClient.patch<DriftAlertDto>(
      `/domains/${encodeURIComponent(domainId)}/drift-alerts/${encodeURIComponent(alertId)}/resolve`,
      {}
    ),
};

