import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { snapshotService } from '../../services/snapshot.service';
import { queryKeys } from './query-keys';
import type { DriftAlertDto } from '../../types/api';

export function useDomainDriftAlerts(domainId: string | null | undefined) {
  return useQuery<DriftAlertDto[]>({
    queryKey: queryKeys.driftAlerts.byDomain(domainId || ''),
    queryFn: ({ signal }) => snapshotService.getDomainDriftAlerts(domainId!, signal),
    enabled: Boolean(domainId),
  });
}

export function useWorkspaceDriftAlerts() {
  return useQuery<DriftAlertDto[]>({
    queryKey: queryKeys.driftAlerts.workspace(),
    queryFn: ({ signal }) => snapshotService.getWorkspaceDriftAlerts(signal),
  });
}

export function useAcknowledgeDriftAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ domainId, alertId }: { domainId: string; alertId: string }) =>
      snapshotService.acknowledgeDriftAlert(domainId, alertId),
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driftAlerts.byDomain(domainId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driftAlerts.workspace() });
    },
  });
}

export function useResolveDriftAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ domainId, alertId }: { domainId: string; alertId: string }) =>
      snapshotService.resolveDriftAlert(domainId, alertId),
    onSuccess: (_, { domainId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.driftAlerts.byDomain(domainId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.driftAlerts.workspace() });
    },
  });
}
