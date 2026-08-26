import { useQuery } from '@tanstack/react-query';
import { snapshotService } from '../../services/snapshot.service';
import { queryKeys } from './query-keys';
import type {
  InfrastructureSnapshotDto,
  SnapshotListResponseDto,
} from '../../types/api';

export function useSnapshots(
  domainId: string | null | undefined,
  params?: { limit?: number; offset?: number }
) {
  return useQuery<SnapshotListResponseDto>({
    queryKey: queryKeys.snapshots.byDomain(domainId || '', params),
    queryFn: ({ signal }) => snapshotService.getSnapshotsForDomain(domainId!, params, signal),
    enabled: Boolean(domainId),
  });
}

export function useSnapshot(snapshotId: string | null | undefined) {
  return useQuery<InfrastructureSnapshotDto>({
    queryKey: queryKeys.snapshots.detail(snapshotId || ''),
    queryFn: ({ signal }) => snapshotService.getSnapshotById(snapshotId!, signal),
    enabled: Boolean(snapshotId),
  });
}
