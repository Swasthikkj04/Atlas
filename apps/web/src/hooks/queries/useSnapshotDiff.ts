import { useQuery } from '@tanstack/react-query';
import { snapshotService } from '../../services/snapshot.service';
import { queryKeys } from './query-keys';
import type { SnapshotDriftForensicsDto } from '../../types/api';

export function useSnapshotDiff(
  domainId: string | null | undefined,
  targetSnapshotId: string | null | undefined,
  baseSnapshotId?: string | null
) {
  return useQuery<SnapshotDriftForensicsDto>({
    queryKey: queryKeys.snapshots.diff(
      domainId || '',
      targetSnapshotId || '',
      baseSnapshotId || undefined
    ),
    queryFn: ({ signal }) =>
      snapshotService.getSnapshotDiff(
        domainId!,
        targetSnapshotId!,
        baseSnapshotId || undefined,
        signal
      ),
    enabled: Boolean(domainId && targetSnapshotId),
  });
}
