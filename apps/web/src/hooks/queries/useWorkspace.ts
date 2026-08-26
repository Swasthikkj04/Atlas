import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../../services/workspace.service';
import { queryKeys } from './query-keys';
import type { WorkspaceOverviewDto } from '../../types/api';

export function useWorkspaceOverview(domainId: string | null | undefined) {
  return useQuery<WorkspaceOverviewDto>({
    queryKey: queryKeys.workspace.overview(domainId || ''),
    queryFn: ({ signal }) => workspaceService.getWorkspaceOverview(domainId!, signal),
    enabled: Boolean(domainId),
  });
}
