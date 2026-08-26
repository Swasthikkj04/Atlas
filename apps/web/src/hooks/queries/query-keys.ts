import type { FindingQueryParams } from '../../services/finding.service';
import type { TimelineQueryDto } from '../../types/api';

/**
 * Authoritative Query Key Factory for TanStack Query Cache.
 */
export const queryKeys = {
  auth: {
    currentUser: () => ['auth', 'currentUser'] as const,
  },
  domains: {
    all: () => ['domains'] as const,
    detail: (domainId: string) => ['domains', domainId] as const,
    overview: (domainId: string) => ['domains', domainId, 'overview'] as const,
  },
  understanding: {
    job: (jobId: string) => ['understanding', 'jobs', jobId] as const,
    domainJobs: (domainId: string) => ['understanding', 'domainJobs', domainId] as const,
  },
  snapshots: {
    byDomain: (domainId: string, params?: { limit?: number; offset?: number }) =>
      params
        ? (['snapshots', 'byDomain', domainId, params] as const)
        : (['snapshots', 'byDomain', domainId] as const),
    detail: (snapshotId: string) => ['snapshots', 'detail', snapshotId] as const,
  },
  findings: {
    byDomain: (domainId: string, params?: FindingQueryParams) =>
      params
        ? (['findings', 'byDomain', domainId, params] as const)
        : (['findings', 'byDomain', domainId] as const),
    detail: (findingId: string) => ['findings', 'detail', findingId] as const,
    evidence: (findingId: string) => ['findings', 'evidence', findingId] as const,
  },
  briefs: {
    bySnapshot: (snapshotId: string) => ['briefs', 'bySnapshot', snapshotId] as const,
    byDomain: (domainId: string) => ['briefs', 'byDomain', domainId] as const,
  },
  timeline: {
    list: (params?: TimelineQueryDto) =>
      params ? (['timeline', 'list', params] as const) : (['timeline', 'list'] as const),
    byDomain: (domainId: string, params?: Omit<TimelineQueryDto, 'domainId'>) =>
      params
        ? (['timeline', 'byDomain', domainId, params] as const)
        : (['timeline', 'byDomain', domainId] as const),
    event: (eventId: string) => ['timeline', 'event', eventId] as const,
  },
  memory: {
    byDomain: (domainId: string) => ['memory', 'byDomain', domainId] as const,
  },
  workspace: {
    overview: (domainId: string) => ['workspace', 'overview', domainId] as const,
  },
  evidence: {
    target: (targetId: string) => ['evidence', targetId] as const,
  },
  search: {
    query: (query: string, options?: Record<string, unknown> | number) =>
      ['search', query, options] as const,
  },
} as const;
