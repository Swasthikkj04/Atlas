export type GXState = 'IDLE' | 'UNDERSTANDING' | 'INSIGHTS' | 'CONTINUITY';

export interface CreateJobRequest {
  target: string;
}

export interface CreateJobResponse {
  job_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface JobStatusResponse {
  job_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  current_phase: string;
  snapshot_id: string | null;
  error_message: string | null;
}

export interface SnapshotBriefResponse {
  snapshot_id: string;
  summary: string;
  highlights: string[];
}

export interface FindingFact {
  key: string;
  value: string;
}

export interface Finding {
  id: string;
  category: string;
  headline: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'POSITIVE';
  facts: FindingFact[];
  raw_artifacts: Record<string, any>;
}

export interface SnapshotFindingsResponse {
  findings: Finding[];
}

export interface StreamLogItem {
  id: string;
  phase: string;
  message: string;
  timestamp: string;
}
