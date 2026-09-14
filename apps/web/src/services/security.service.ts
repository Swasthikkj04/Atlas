import { apiClient } from '../lib/api-client';
import type { WorkspaceSecurityOverviewDto } from '../features/workspace/contracts/security-experience.contract';

export const securityService = {
  getWorkspaceSecurity: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<WorkspaceSecurityOverviewDto>(
      `/workspace/security?domainId=${encodeURIComponent(domainId)}`,
      { signal },
    ),
};
