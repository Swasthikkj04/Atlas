import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { timelineService } from '../../services/timeline.service';
import { queryKeys } from './query-keys';
import type {
  TimelineResponseDto,
  TimelineQueryDto,
  TimelineEventDto,
} from '../../types/api';

export function useTimeline(params?: TimelineQueryDto) {
  return useQuery<TimelineResponseDto>({
    queryKey: queryKeys.timeline.list(params),
    queryFn: ({ signal }) => timelineService.getTimeline(params, signal),
  });
}

export function useInfiniteTimeline(params?: TimelineQueryDto) {
  return useInfiniteQuery<TimelineResponseDto>({
    queryKey: ['timeline', 'infinite', params],
    queryFn: ({ pageParam, signal }) =>
      timelineService.getTimeline(
        {
          ...params,
          cursor: (pageParam as string | undefined) || undefined,
          limit: params?.limit || 20,
        },
        signal
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      const next = lastPage?.pagination?.nextCursor || lastPage?.nextCursor;
      return next || undefined;
    },
  });
}

export function useTimelineEvent(eventId: string | null | undefined) {
  return useQuery<TimelineEventDto>({
    queryKey: queryKeys.timeline.event(eventId || ''),
    queryFn: ({ signal }) => timelineService.getTimelineEventDetails(eventId!, signal),
    enabled: Boolean(eventId),
  });
}
