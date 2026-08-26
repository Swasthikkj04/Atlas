import { apiClient } from '../lib/api-client.ts';
import type {
  UnderstandingJobDto,
  TriggerUnderstandingJobResponseDto,
} from '../types/api';

export const understandingService = {
  triggerUnderstandingJob: (domainId: string) =>
    apiClient.post<TriggerUnderstandingJobResponseDto>(
      `/domains/${encodeURIComponent(domainId)}/understand`
    ),

  getJobStatus: (jobId: string, signal?: AbortSignal) =>
    apiClient.get<UnderstandingJobDto>(`/jobs/${encodeURIComponent(jobId)}`, {
      signal,
    }),

  getJobsForDomain: (domainId: string, signal?: AbortSignal) =>
    apiClient.get<readonly UnderstandingJobDto[]>(
      `/domains/${encodeURIComponent(domainId)}/jobs`,
      { signal }
    ),
};
