import { env } from '../../config/env.config.ts';

export type UnderstandingStreamStage =
  | 'QUEUED'
  | 'PROBING_DNS_NETWORK'
  | 'ANALYZING_TLS_SECURITY'
  | 'BEHAVIORAL_FINGERPRINTING'
  | 'PERSISTING_SNAPSHOT_DIFF'
  | 'EVALUATING_FINDINGS_ANOMALIES'
  | 'SYNTHESIZING_BRIEF'
  | 'COMPLETED'
  | 'FAILED';

export interface UnderstandingStreamPayload {
  type: 'INIT' | 'PROGRESS' | 'HEARTBEAT' | 'COMPLETED' | 'FAILED';
  jobId: string;
  stage?: UnderstandingStreamStage;
  stageLabel?: string;
  stageDetails?: string;
  stageIndex?: number;
  totalStages?: number;
  percent?: number;
  snapshotId?: string;
  durationMs?: number;
  errorMessage?: string;
  timestamp: number;
}

export interface UnderstandingStreamCallbacks {
  onInit?: (payload: UnderstandingStreamPayload) => void;
  onProgress?: (payload: UnderstandingStreamPayload) => void;
  onComplete?: (payload: UnderstandingStreamPayload) => void;
  onError?: (error: Error | UnderstandingStreamPayload) => void;
}

/**
 * Subscribes to real-time Server-Sent Events (SSE) stream for an infrastructure understanding job.
 * Automatically manages EventSource lifecycle and provides typed callbacks.
 * Returns an unsubscribe function to cleanly close the stream.
 */
export function subscribeToUnderstandingStream(
  jobId: string,
  callbacks: UnderstandingStreamCallbacks,
): () => void {
  const EventSourceImpl =
    typeof window !== 'undefined' && window.EventSource
      ? window.EventSource
      : typeof globalThis !== 'undefined'
      ? (globalThis as any).EventSource
      : undefined;

  if (!EventSourceImpl) {
    callbacks.onError?.(new Error('EventSource is not supported in this environment.'));
    return () => {};
  }

  const baseUrl = env.apiBaseUrl || '';
  const url = `${baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/stream`;

  let eventSource: EventSource | null = null;
  let isClosed = false;

  const closeStream = () => {
    if (eventSource && !isClosed) {
      isClosed = true;
      eventSource.close();
      eventSource = null;
    }
  };

  try {
    eventSource = new EventSourceImpl(url, { withCredentials: true });

    const handlePayload = (raw: string, defaultType?: UnderstandingStreamPayload['type']) => {
      try {
        const payload: UnderstandingStreamPayload = JSON.parse(raw);
        const eventType = payload.type || defaultType;

        switch (eventType) {
          case 'INIT':
            callbacks.onInit?.(payload);
            if (payload.stage === 'COMPLETED') {
              callbacks.onComplete?.(payload);
              closeStream();
            } else if (payload.stage === 'FAILED') {
              callbacks.onError?.(payload);
              closeStream();
            }
            break;
          case 'PROGRESS':
            callbacks.onProgress?.(payload);
            break;
          case 'COMPLETED':
            callbacks.onComplete?.(payload);
            closeStream();
            break;
          case 'FAILED':
            callbacks.onError?.(payload);
            closeStream();
            break;
          case 'HEARTBEAT':
            // Keepalive ack - no state transition needed
            break;
        }
      } catch (err) {
        // Ignore unparseable raw frame
      }
    };

    eventSource.onmessage = (event: MessageEvent) => {
      handlePayload(event.data);
    };

    eventSource.addEventListener('init', (event: MessageEvent) => {
      handlePayload(event.data, 'INIT');
    });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      handlePayload(event.data, 'PROGRESS');
    });

    eventSource.addEventListener('complete', (event: MessageEvent) => {
      handlePayload(event.data, 'COMPLETED');
    });

    eventSource.addEventListener('failed', (event: MessageEvent) => {
      handlePayload(event.data, 'FAILED');
    });

    eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      handlePayload(event.data, 'HEARTBEAT');
    });

    eventSource.onerror = () => {
      if (!isClosed) {
        closeStream();
        callbacks.onError?.(new Error('SSE connection closed or interrupted.'));
      }
    };
  } catch (err) {
    closeStream();
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
  }

  return closeStream;
}
