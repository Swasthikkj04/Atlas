import { apiClient } from '../lib/api-client';
import type { WorkspaceOverviewDto } from '../types/api';

export const workspaceService = {
  getWorkspaceOverview: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<WorkspaceOverviewDto>(
      `/workspace/overview?domainId=${encodeURIComponent(domainId)}`,
      { signal }
    ),
};
