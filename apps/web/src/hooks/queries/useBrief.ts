import { useQuery } from '@tanstack/react-query';
import { briefService } from '../../services/brief.service';
import { queryKeys } from './query-keys';
import type { InfrastructureBriefDto } from '../../types/api';

export function useSnapshotBrief(snapshotId: string | null | undefined) {
  return useQuery<InfrastructureBriefDto>({
    queryKey: queryKeys.briefs.bySnapshot(snapshotId || ''),
    queryFn: ({ signal }) => briefService.getBriefForSnapshot(snapshotId!, signal),
    enabled: Boolean(snapshotId),
  });
}

export function useDomainBrief(domainId: string | null | undefined) {
  return useQuery<InfrastructureBriefDto>({
    queryKey: queryKeys.briefs.byDomain(domainId || ''),
    queryFn: ({ signal }) => briefService.getLatestBriefForDomain(domainId!, signal),
    enabled: Boolean(domainId),
  });
}
