import { apiClient } from '../lib/api-client';
import type {
  TimelineResponseDto,
  TimelineQueryDto,
  TimelineEventDto,
} from '../types/api';

export const timelineService = {
  getTimeline: (params?: TimelineQueryDto, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params?.domainId) query.set('domainId', params.domainId);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.changeType) query.set('changeType', params.changeType);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString() ? `?${query.toString()}` : '';

    return apiClient.get<TimelineResponseDto>(`/timeline${qs}`, { signal });
  },

  getTimelineEventDetails: (eventId: string, signal?: AbortSignal) =>
    apiClient.get<TimelineEventDto>(`/timeline/${encodeURIComponent(eventId)}/details`, {
      signal,
    }),

  getTimelineEventEvidence: (eventId: string, signal?: AbortSignal) =>
    apiClient.get<any>(`/timeline/${encodeURIComponent(eventId)}/evidence`, {
      signal,
    }),
};
