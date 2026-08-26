/**
 * Authoritative Public Infrastructure Understanding API DTO Contracts.
 */

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'INITIAL_DISCOVERY';

export interface UnderstandingJobDto {
  readonly id: string;
  readonly domainId: string;
  readonly status: JobStatus;
  readonly triggerType: TriggerType;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
  readonly error?: string | null;
  readonly snapshotId?: string | null;
  readonly progress?: {
    readonly currentPhase?: string;
    readonly totalPhases?: number;
    readonly completedPhases?: number;
  };
}

export interface TriggerUnderstandingJobResponseDto {
  readonly id: string;
  readonly jobId?: string;
  readonly status: JobStatus;
  readonly domainId: string;
  readonly location?: string;
}
