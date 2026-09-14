import type {
  JobStatus,
  UnderstandingExecutionStage,
  UnderstandingJobProgressDto,
} from '../../../types/api/understanding.dto';

/**
 * Authoritative UI Stage Representation for Understanding Discovery.
 */
export interface UnderstandingStageUiDefinition {
  readonly stage: UnderstandingExecutionStage;
  readonly stageIndex: number;
  readonly stageLabel: string;
  readonly shortLabel: string;
  readonly defaultDetails: string;
  readonly category: 'NETWORK' | 'SECURITY' | 'BEHAVIORAL' | 'STATE' | 'INTELLIGENCE' | 'SYNTHESIS';
}

export const UNDERSTANDING_UI_STAGES: readonly UnderstandingStageUiDefinition[] = [
  {
    stage: 'PROBING_DNS_NETWORK',
    stageIndex: 1,
    stageLabel: 'DNS & Perimeter Routing',
    shortLabel: 'DNS & Routing',
    defaultDetails: 'Probing authoritative nameservers, Anycast routing, and DNSSEC records',
    category: 'NETWORK',
  },
  {
    stage: 'ANALYZING_TLS_SECURITY',
    stageIndex: 2,
    stageLabel: 'TLS & Wire Protocols',
    shortLabel: 'TLS & HTTP',
    defaultDetails: 'Analyzing SSL/TLS certificates, cipher suites, ALPN, and HTTP response headers',
    category: 'SECURITY',
  },
  {
    stage: 'BEHAVIORAL_FINGERPRINTING',
    stageIndex: 3,
    stageLabel: 'Deep Behavioral Fingerprinting',
    shortLabel: 'Fingerprinting',
    defaultDetails: 'Extracting behavioral wire signatures, serverless edge markers, and framework evidence',
    category: 'BEHAVIORAL',
  },
  {
    stage: 'PERSISTING_SNAPSHOT_DIFF',
    stageIndex: 4,
    stageLabel: 'Snapshot Persistence & Drift',
    shortLabel: 'Snapshot & Drift',
    defaultDetails: 'Persisting immutable snapshot and computing infrastructure wire diffs against previous state',
    category: 'STATE',
  },
  {
    stage: 'EVALUATING_FINDINGS_ANOMALIES',
    stageIndex: 5,
    stageLabel: 'Architectural Anomaly Detection',
    shortLabel: 'Security & Anomalies',
    defaultDetails: 'Evaluating security posture rules, origin bypass leakage, and debug exposures',
    category: 'INTELLIGENCE',
  },
  {
    stage: 'SYNTHESIZING_BRIEF',
    stageIndex: 6,
    stageLabel: 'Architecture Brief & Topology',
    shortLabel: 'Synthesis & Topology',
    defaultDetails: 'Synthesizing ingress hop topology and executive intelligence brief',
    category: 'SYNTHESIS',
  },
] as const;

export type StageVisualStatus = 'completed' | 'active' | 'pending' | 'failed';

/**
 * Resolves the truthful, non-simulated visual status for a given stage in the pipeline.
 */
export function resolveStageVisualStatus(
  stageDef: UnderstandingStageUiDefinition,
  progress: UnderstandingJobProgressDto | undefined,
  jobStatus: JobStatus,
): StageVisualStatus {
  if (jobStatus === 'FAILED') {
    if (progress?.currentStage === stageDef.stage) {
      return 'failed';
    }
    if (progress?.completedStages?.includes(stageDef.stage)) {
      return 'completed';
    }
    return 'pending';
  }

  if (jobStatus === 'COMPLETED') {
    return 'completed';
  }

  if (!progress) {
    if (jobStatus === 'PENDING') {
      return 'pending';
    }
    return stageDef.stageIndex === 1 ? 'active' : 'pending';
  }

  if (progress.completedStages?.includes(stageDef.stage)) {
    return 'completed';
  }

  if (progress.currentStage === stageDef.stage) {
    return 'active';
  }

  if (progress.stageIndex > stageDef.stageIndex) {
    return 'completed';
  }

  return 'pending';
}

/**
 * Calculates current human-readable elapsed seconds from startedAt.
 */
export function calculateElapsedSeconds(startedAtMs?: number | null, nowMs: number = Date.now()): number {
  if (!startedAtMs || startedAtMs <= 0) return 0;
  const elapsed = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  return elapsed;
}
