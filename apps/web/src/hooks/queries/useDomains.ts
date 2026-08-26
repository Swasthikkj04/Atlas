import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainService } from '../../services/domain.service';
import { queryKeys } from './query-keys';
import type { DomainDto, CreateDomainRequestDto } from '../../types/api';

export function useDomains() {
  return useQuery<readonly DomainDto[]>({
    queryKey: queryKeys.domains.all(),
    queryFn: ({ signal }) => domainService.getDomains(signal),
  });
}

export function useDomain(domainId: string | null | undefined) {
  return useQuery<DomainDto>({
    queryKey: queryKeys.domains.detail(domainId || ''),
    queryFn: ({ signal }) => domainService.getDomainById(domainId!, signal),
    enabled: Boolean(domainId),
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation<DomainDto, Error, CreateDomainRequestDto>({
    mutationFn: (payload) => domainService.createDomain(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() });
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: (domainId: string) => domainService.deleteDomain(domainId),
    onSuccess: (_, domainId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all() });
      queryClient.removeQueries({ queryKey: queryKeys.domains.detail(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.domains.overview(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.workspace.overview(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.briefs.byDomain(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.findings.byDomain(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.snapshots.byDomain(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.timeline.byDomain(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.memory.byDomain(domainId) });
      queryClient.removeQueries({ queryKey: queryKeys.understanding.domainJobs(domainId) });
    },
  });
}
