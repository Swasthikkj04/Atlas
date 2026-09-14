import {
  apiClient,
  ApiError,
  NetworkError,
  InsufficientSignalError,
  RateLimitError,
} from './client';
import type { InfrastructureOverviewDto } from '../../types/api/overview.dto';

export interface StartGuestUnderstandingRequest {
  domain: string;
}

export interface StartGuestUnderstandingResponse {
  jobId: string;
  sessionId: string;
  status: string;
}


export class InvalidDomainError extends ApiError {
  constructor(message = 'INVALID_DOMAIN_INPUT') {
    super(message, 400, 'INVALID_DOMAIN_INPUT');
    this.name = 'InvalidDomainError';
  }
}

export class PlatformError extends ApiError {
  constructor(message = 'PLATFORM_FAILURE') {
    super(message, 500, 'PLATFORM_FAILURE');
    this.name = 'PlatformError';
  }
}

export async function startGuestUnderstanding(
  domain: string,
  signal?: AbortSignal
): Promise<StartGuestUnderstandingResponse> {
  try {
    return await apiClient.post<StartGuestUnderstandingResponse, StartGuestUnderstandingRequest>(
      '/api/v1/guest/understand',
      { domain },
      signal
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400) throw new InvalidDomainError(err.message);
      if (err.status === 429) throw new RateLimitError(err.message);
      if (err.status === 500) throw new PlatformError(err.message);
      if (err.status === 404 || err.status === 422) throw new InsufficientSignalError();
      throw err;
    }
    throw new NetworkError();
  }
}

export interface GuestJobStatusResponse {
  jobId: string;
  sessionId: string;
  status: string;
  error?: string | null;
}

export async function getGuestUnderstandingJob(
  jobId: string,
  signal?: AbortSignal
): Promise<GuestJobStatusResponse> {
  try {
    return await apiClient.get<GuestJobStatusResponse>(
      `/api/v1/jobs/${encodeURIComponent(jobId)}`,
      signal
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400) throw new InvalidDomainError(err.message);
      if (err.status === 429) throw new RateLimitError(err.message);
      if (err.status === 500) throw new PlatformError(err.message);
      if (err.status === 404) throw new ApiError('Job not found', 404, 'JOB_NOT_FOUND');
      throw err;
    }
    throw new NetworkError();
  }
}

export interface GuestUnderstandingResult {
  jobId: string;
  sessionId: string;
  domain: string;
  brief: {
    paragraphs: string[];
    stats: {
      techCount: number;
      observationCount: number;
      evidenceCount: number;
      timelineCount: number;
      criticalCount: number;
    };
  };
  technologies: Array<{
    name: string;
    role: string;
    confidence: 'high' | 'medium' | 'low';
    category?: string;
    version?: string;
    evidenceCount?: number;
  }>;
  observations: Array<{
    label: string;
    body: string;
    whyItMatters?: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    confidence?: 'high' | 'medium' | 'low';
    evidenceCount?: number;
    category?: string;
    firstObserved?: string;
  }>;
  timeline: Array<{
    date: string;
    headline: string;
    narrative: string;
    observationBasis?: string;
    category?: string;
  }>;
  evidence: Array<{
    id: string;
    category: string;
    title: string;
    summary: string;
    source?: string;
    collectedAt: string;
    payload: string;
    hash?: string;
    collector?: string;
    relatedTechnologies?: string[];
    relatedObservations?: string[];
  }>;
  infrastructure?: InfrastructureOverviewDto;
}

export async function getGuestUnderstandingResult(
  jobId: string,
  signal?: AbortSignal
): Promise<GuestUnderstandingResult> {
  try {
    return await apiClient.get<GuestUnderstandingResult>(
      `/api/v1/guest/result/${encodeURIComponent(jobId)}`,
      signal
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 400) throw new InvalidDomainError(err.message);
      if (err.status === 429) throw new RateLimitError(err.message);
      if (err.status === 500) throw new PlatformError(err.message);
      if (err.status === 404) throw new ApiError('Result not found', 404, 'RESULT_NOT_FOUND');
      throw err;
    }
    throw new NetworkError();
  }
}

export interface ClaimGuestSessionRequest {
  sessionToken: string;
}

export interface ClaimGuestSessionResponse {
  success: boolean;
  message: string;
  domainId: string;
  domainName: string;
  jobId: string;
}

export async function claimGuestSession(
  sessionToken: string,
  signal?: AbortSignal
): Promise<ClaimGuestSessionResponse> {
  return apiClient.post<ClaimGuestSessionResponse, ClaimGuestSessionRequest>(
    '/api/v1/guest/claim',
    { sessionToken },
    signal
  );
}
