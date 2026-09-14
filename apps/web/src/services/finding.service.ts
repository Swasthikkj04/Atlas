import { apiClient } from '../lib/api-client';
import type {
  InfrastructureFindingDto,
  FindingListResponseDto,
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  FindingEvidenceResponseDto,
} from '../types/api';

export interface FindingQueryParams {
  category?: FindingCategory;
  severity?: FindingSeverity;
  status?: FindingStatus;
  limit?: number;
  offset?: number;
}

export const findingService = {
  getFindingsForDomain: async (
    domainId: string,
    params?: FindingQueryParams,
    signal?: AbortSignal
  ): Promise<FindingListResponseDto> => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString() ? `?${query.toString()}` : '';

    const response = await apiClient.get<any>(
      `/domains/${encodeURIComponent(domainId)}/findings${qs}`,
      { signal }
    );

    const items = response?.findings ?? response?.data ?? [];
    const total =
      response?.total ?? response?.pagination?.total ?? items.length;

    return {
      findings: items,
      total,
    };
  },

  getFindingById: (findingId: string, signal?: AbortSignal) =>
    apiClient.get<InfrastructureFindingDto>(
      `/findings/${encodeURIComponent(findingId)}`,
      { signal }
    ),

  getFindingEvidence: (findingId: string, signal?: AbortSignal) =>
    apiClient.get<FindingEvidenceResponseDto>(
      `/findings/${encodeURIComponent(findingId)}/evidence`,
      { signal }
    ),
};
