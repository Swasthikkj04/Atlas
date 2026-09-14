/**
 * Authoritative Public Infrastructure Understanding API DTO Contracts.
 */

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type TriggerType = 'MANUAL' | 'SCHEDULED' | 'WEBHOOK' | 'INITIAL_DISCOVERY';

export type UnderstandingExecutionStage =
  | 'QUEUED'
  | 'PROBING_DNS_NETWORK'
  | 'ANALYZING_TLS_SECURITY'
  | 'BEHAVIORAL_FINGERPRINTING'
  | 'PERSISTING_SNAPSHOT_DIFF'
  | 'EVALUATING_FINDINGS_ANOMALIES'
  | 'SYNTHESIZING_BRIEF'
  | 'COMPLETED'
  | 'FAILED';

export interface UnderstandingJobProgressDto {
  readonly currentStage: UnderstandingExecutionStage;
  readonly stageLabel: string;
  readonly stageDetails?: string;
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly completedStages: readonly UnderstandingExecutionStage[];
  readonly startedAt?: number;
  readonly lastHeartbeatAt?: number;
  // Legacy phase support for backward compatibility
  readonly currentPhase?: string;
  readonly totalPhases?: number;
  readonly completedPhases?: number;
}

export interface UnderstandingJobDto {
  readonly id: string;
  readonly domainId: string;
  readonly status: JobStatus;
  readonly triggerType: TriggerType;
  readonly startedAt?: string | null;
  readonly completedAt?: string | null;
  readonly error?: string | null;
  readonly snapshotId?: string | null;
  readonly progress?: UnderstandingJobProgressDto;
}

export interface TriggerUnderstandingJobResponseDto {
  readonly id: string;
  readonly jobId?: string;
  readonly status: JobStatus;
  readonly domainId: string;
  readonly location?: string;
}
