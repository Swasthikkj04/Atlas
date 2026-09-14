/**
 * Authoritative Infrastructure Understanding Pipeline Stages & Progress Contracts.
 *
 * Defines the real execution phases of the backend discovery and intelligence engine.
 * No simulated delays or fake narratives — strictly drives from actual pipeline execution.
 */

export type UnderstandingStage =
  | 'QUEUED'
  | 'PROBING_DNS_NETWORK'
  | 'ANALYZING_TLS_SECURITY'
  | 'BEHAVIORAL_FINGERPRINTING'
  | 'PERSISTING_SNAPSHOT_DIFF'
  | 'EVALUATING_FINDINGS_ANOMALIES'
  | 'SYNTHESIZING_BRIEF'
  | 'COMPLETED'
  | 'FAILED';

export interface UnderstandingStageDefinition {
  readonly stage: UnderstandingStage;
  readonly stageIndex: number;
  readonly stageLabel: string;
  readonly defaultDetails: string;
}

export const UNDERSTANDING_PIPELINE_STAGES: readonly UnderstandingStageDefinition[] =
  [
    {
      stage: 'PROBING_DNS_NETWORK',
      stageIndex: 1,
      stageLabel: 'DNS & Perimeter Routing',
      defaultDetails:
        'Probing authoritative nameservers, Anycast routing, and DNSSEC records',
    },
    {
      stage: 'ANALYZING_TLS_SECURITY',
      stageIndex: 2,
      stageLabel: 'TLS & Wire Protocols',
      defaultDetails:
        'Analyzing SSL/TLS certificates, cipher suites, ALPN, and HTTP response headers',
    },
    {
      stage: 'BEHAVIORAL_FINGERPRINTING',
      stageIndex: 3,
      stageLabel: 'Deep Behavioral Fingerprinting',
      defaultDetails:
        'Extracting behavioral wire signatures, serverless edge markers, and framework evidence',
    },
    {
      stage: 'PERSISTING_SNAPSHOT_DIFF',
      stageIndex: 4,
      stageLabel: 'Snapshot Persistence & Drift',
      defaultDetails:
        'Persisting immutable snapshot and computing infrastructure wire diffs against previous state',
    },
    {
      stage: 'EVALUATING_FINDINGS_ANOMALIES',
      stageIndex: 5,
      stageLabel: 'Architectural Anomaly Detection',
      defaultDetails:
        'Evaluating security posture rules, origin bypass leakage, and debug exposures',
    },
    {
      stage: 'SYNTHESIZING_BRIEF',
      stageIndex: 6,
      stageLabel: 'Architecture Brief & Topology',
      defaultDetails:
        'Synthesizing ingress hop topology and executive intelligence brief',
    },
  ] as const;

export const TOTAL_UNDERSTANDING_STAGES = UNDERSTANDING_PIPELINE_STAGES.length;

export interface UnderstandingJobProgress {
  readonly currentStage: UnderstandingStage;
  readonly stageLabel: string;
  readonly stageDetails?: string;
  readonly stageIndex: number; // 1-based index (1 to 6) or 0 if QUEUED
  readonly totalStages: number; // 6
  readonly completedStages: readonly UnderstandingStage[];
  readonly startedAt: number;
  readonly lastHeartbeatAt: number;
}
