export interface CollectorMetadata {
  collectorName: string;
  collectorVersion: string;
  target: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  retryCount: number;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  probeSource?: string;
}
