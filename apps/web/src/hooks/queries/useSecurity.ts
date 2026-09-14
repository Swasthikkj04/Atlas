import { useQuery } from '@tanstack/react-query';
import { securityService } from '../../services/security.service';
import { queryKeys } from './query-keys';
import type { WorkspaceSecurityOverviewDto } from '../../features/workspace/contracts/security-experience.contract';

export function useWorkspaceSecurity(domainId: string | null | undefined) {
  return useQuery<WorkspaceSecurityOverviewDto>({
    queryKey: queryKeys.workspace.security(domainId || ''),
    queryFn: ({ signal }) => securityService.getWorkspaceSecurity(domainId!, signal),
    enabled: Boolean(domainId),
  });
}
