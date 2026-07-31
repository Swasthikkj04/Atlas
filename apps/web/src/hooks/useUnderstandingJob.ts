import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  SnapshotBriefResponse,
  SnapshotFindingsResponse,
  StreamLogItem,
  Finding,
  JobStatusResponse,
} from '../types/gx';
import { apiClient } from '../services/api/client';

export interface UseUnderstandingJobReturn {
  jobId: string | null;
  snapshotId: string | null;
  status: 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  currentPhase: string | null;
  progressLogs: StreamLogItem[];
  brief: SnapshotBriefResponse | null;
  findings: SnapshotFindingsResponse | null;
  errorMessage: string | null;
  submitTarget: (target: string) => Promise<void>;
  resetJob: () => void;
}

// Microcopy Execution Map mapped strictly to backend phase names
export const PHASE_MESSAGES: Record<string, string> = {
  INGRESS_DISCOVERY: 'Observing global edge routing and ingress paths',
  DNS_DISCOVERY: 'Observing DNS topology and edge routing',
  HTTP_FINGERPRINT: 'Analyzing protocol signatures and TLS configurations',
  TOPOLOGY_MAP: 'Mapping structural topology and multi-region footprints',
  PATTERN_MATCH: 'Analyzing historical deployment shifts and delta changes',
  RULE_SYNTHESIS: 'Synthesizing executive infrastructure brief',
  BRIEF_SYNTHESIS: 'Synthesizing executive infrastructure brief',
};

export function useUnderstandingJob(): UseUnderstandingJobReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [progressLogs, setProgressLogs] = useState<StreamLogItem[]>([]);
  const [brief, setBrief] = useState<SnapshotBriefResponse | null>(null);
  const [findings, setFindings] = useState<SnapshotFindingsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const resetJob = useCallback(() => {
    cleanup();
    setJobId(null);
    setSnapshotId(null);
    setStatus('IDLE');
    setCurrentPhase(null);
    setProgressLogs([]);
    setBrief(null);
    setFindings(null);
    setErrorMessage(null);
  }, [cleanup]);

  const submitTarget = useCallback(
    async (target: string) => {
      resetJob();
      setStatus('PENDING');

      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      try {
        // Step 1: Create Understanding Job via backend POST /api/v1/jobs
        const jobData = await apiClient.post<{ job_id?: string; id?: string }>(
          '/api/v1/jobs',
          { target },
          controller.signal
        );

        const activeJobId = jobData.job_id || jobData.id;
        if (!activeJobId) {
          throw new Error('Backend job response did not return a valid job_id');
        }

        setJobId(activeJobId);
        setStatus('RUNNING');

        // Step 2: Poll backend status endpoint GET /api/v1/jobs/:id
        const pollJobStatus = async () => {
          try {
            const pollData = await apiClient.get<JobStatusResponse & { id?: string; phase?: string; snapshotId?: string }>(
              `/api/v1/jobs/${activeJobId}`,
              activeAbortControllerRef.current?.signal
            );

            const phase = pollData.current_phase || pollData.phase || 'PROCESSING';
            const jobStatus = pollData.status;

            setCurrentPhase(phase);

            // Append progress log entry when phase transitions
            setProgressLogs((prev) => {
              if (prev.length > 0 && prev[prev.length - 1].phase === phase) {
                return prev;
              }
              const msg = PHASE_MESSAGES[phase] || `Executing ${phase}...`;
              return [
                ...prev,
                {
                  id: `log-${Date.now()}-${prev.length}`,
                  phase,
                  message: msg,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ];
            });

            if (jobStatus === 'FAILED') {
              cleanup();
              setStatus('FAILED');
              setErrorMessage(
                pollData.error_message ||
                  `Understanding job failed during ${phase} processing.`
              );
              return;
            }

            if (jobStatus === 'COMPLETED') {
              cleanup();
              const activeSnapshotId = pollData.snapshot_id || pollData.snapshotId;

              if (!activeSnapshotId) {
                throw new Error('Completed job response did not return a valid snapshot_id');
              }

              setSnapshotId(activeSnapshotId);

              // Step 3: Fetch Snapshot Brief and Findings in parallel from backend APIs
              const [briefData, rawFindingsData] = await Promise.all([
                apiClient.get<SnapshotBriefResponse>(
                  `/api/v1/snapshots/${activeSnapshotId}/brief`,
                  activeAbortControllerRef.current?.signal
                ),
                apiClient.get<SnapshotFindingsResponse | Finding[]>(
                  `/api/v1/snapshots/${activeSnapshotId}/findings`,
                  activeAbortControllerRef.current?.signal
                ),
              ]);

              const findingsList: Finding[] = Array.isArray(rawFindingsData)
                ? rawFindingsData
                : rawFindingsData.findings || [];

              setBrief(briefData);
              setFindings({ findings: findingsList });
              setStatus('COMPLETED');
            }
          } catch (err: any) {
            if (err.name === 'AbortError') return;
            cleanup();
            setStatus('FAILED');
            setErrorMessage(err.message || 'Error occurred while polling understanding job.');
          }
        };

        // Trigger immediate first poll, then set 1000ms interval
        await pollJobStatus();
        pollIntervalRef.current = setInterval(pollJobStatus, 1000);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        cleanup();
        setStatus('FAILED');
        setErrorMessage(
          err.message ||
            `Unable to establish infrastructure understanding for ${target}. Backend service is currently unavailable.`
        );
      }
    },
    [cleanup, resetJob]
  );

  return {
    jobId,
    snapshotId,
    status,
    currentPhase,
    progressLogs,
    brief,
    findings,
    errorMessage,
    submitTarget,
    resetJob,
  };
}
