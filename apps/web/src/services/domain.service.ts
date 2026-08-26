import { apiClient } from '../lib/api-client';
import type {
  DomainDto,
  CreateDomainRequestDto,
} from '../types/api';

export const domainService = {
  getDomains: (signal?: AbortSignal) =>
    apiClient.get<readonly DomainDto[]>('/domains', { signal }),

  getDomainById: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<DomainDto>(`/domains/${encodeURIComponent(domainId)}`, { signal }),

  createDomain: (payload: CreateDomainRequestDto) =>
    apiClient.post<DomainDto>('/domains', payload),

  deleteDomain: (domainId: string) =>
    apiClient.delete<{ success: boolean }>(`/domains/${encodeURIComponent(domainId)}`),
};
