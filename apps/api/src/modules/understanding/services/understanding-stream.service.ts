import {
  Injectable,
  Logger,
  MessageEvent,
  OnModuleDestroy,
} from '@nestjs/common';
import { Observable, Subject, interval, merge, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  UnderstandingJobProgress,
  UnderstandingStage,
  TOTAL_UNDERSTANDING_STAGES,
  UNDERSTANDING_PIPELINE_STAGES,
} from '../contracts/understanding-progress.interface';

export interface UnderstandingStreamEvent {
  type:
    'INIT' | 'PROGRESS' | 'HEARTBEAT' | 'COMPLETED' | 'FAILED' | 'DRIFT_ALERT';
  jobId: string;
  stage?: UnderstandingStage;
  stageLabel?: string;
  stageDetails?: string;
  stageIndex?: number;
  totalStages?: number;
  percent?: number;
  snapshotId?: string;
  durationMs?: number;
  errorMessage?: string;
  driftAlert?: any;
  timestamp: number;
}

interface JobStreamContext {
  subject: Subject<MessageEvent>;
  done$: Subject<void>;
}

@Injectable()
export class UnderstandingStreamService implements OnModuleDestroy {
  private readonly logger = new Logger(UnderstandingStreamService.name);
  private readonly jobContexts = new Map<string, JobStreamContext>();
  private readonly latestProgress = new Map<string, UnderstandingJobProgress>();
  private readonly destroy$ = new Subject<void>();

  private getOrCreateContext(jobId: string): JobStreamContext {
    let ctx = this.jobContexts.get(jobId);
    if (!ctx) {
      ctx = {
        subject: new Subject<MessageEvent>(),
        done$: new Subject<void>(),
      };
      this.jobContexts.set(jobId, ctx);
    }
    return ctx;
  }

  /**
   * Retrieves or creates an Observable SSE stream for a given understanding job.
   * If the job is already running or completed, it replays the current state immediately on connection.
   */
  getJobStream(
    jobId: string,
    initialProgress?: UnderstandingJobProgress | null,
  ): Observable<MessageEvent> {
    const ctx = this.getOrCreateContext(jobId);

    const currentProgress = this.latestProgress.get(jobId) || initialProgress;
    const initialEvent$: Observable<MessageEvent> = of(
      this.formatInitEvent(jobId, currentProgress),
    );

    // 15-second keepalive heartbeat to prevent proxy & load balancer timeouts
    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: {
          type: 'HEARTBEAT',
          jobId,
          timestamp: Date.now(),
        },
      })),
      takeUntil(ctx.done$),
      takeUntil(this.destroy$),
    );

    return merge(initialEvent$, ctx.subject.asObservable(), heartbeat$).pipe(
      takeUntil(this.destroy$),
    );
  }

  /**
   * Publishes granular stage progress to all active streaming subscribers for a job.
   */
  publishProgress(
    jobId: string,
    stage: UnderstandingStage,
    stageDetails?: string,
    progressOverride?: Partial<UnderstandingJobProgress>,
  ): void {
    const stageDef = UNDERSTANDING_PIPELINE_STAGES.find(
      (s) => s.stage === stage,
    );
    const stageIndex =
      stageDef?.stageIndex ??
      (stage === 'COMPLETED' ? TOTAL_UNDERSTANDING_STAGES : 0);
    const stageLabel =
      stageDef?.stageLabel ??
      (stage === 'COMPLETED'
        ? 'Understanding Complete'
        : stage === 'FAILED'
          ? 'Understanding Interrupted'
          : 'Processing');
    const details = stageDetails || stageDef?.defaultDetails || '';

    const completedStages: UnderstandingStage[] =
      UNDERSTANDING_PIPELINE_STAGES.filter(
        (s) => s.stageIndex < stageIndex,
      ).map((s) => s.stage);

    const percent = Math.min(
      100,
      Math.round((stageIndex / TOTAL_UNDERSTANDING_STAGES) * 100),
    );

    const progress: UnderstandingJobProgress = {
      currentStage: stage,
      stageLabel,
      stageDetails: details,
      stageIndex,
      totalStages: TOTAL_UNDERSTANDING_STAGES,
      completedStages,
      startedAt: progressOverride?.startedAt || Date.now(),
      lastHeartbeatAt: Date.now(),
    };

    this.latestProgress.set(jobId, progress);

    const ctx = this.jobContexts.get(jobId);
    if (ctx) {
      const eventPayload: UnderstandingStreamEvent = {
        type: 'PROGRESS',
        jobId,
        stage,
        stageLabel,
        stageDetails: details,
        stageIndex,
        totalStages: TOTAL_UNDERSTANDING_STAGES,
        percent,
        timestamp: Date.now(),
      };

      ctx.subject.next({
        type: 'progress',
        data: eventPayload,
      });
    }
  }

  /**
   * Publishes job completion event and cleans up the job stream.
   */
  publishComplete(
    jobId: string,
    snapshotId?: string,
    durationMs?: number,
  ): void {
    const ctx = this.jobContexts.get(jobId);
    const eventPayload: UnderstandingStreamEvent = {
      type: 'COMPLETED',
      jobId,
      stage: 'COMPLETED',
      stageLabel: 'Understanding Complete',
      stageDetails:
        'All discovery, fingerprinting, diff, and synthesis stages completed successfully.',
      stageIndex: TOTAL_UNDERSTANDING_STAGES,
      totalStages: TOTAL_UNDERSTANDING_STAGES,
      percent: 100,
      snapshotId,
      durationMs,
      timestamp: Date.now(),
    };

    if (ctx) {
      ctx.subject.next({
        type: 'complete',
        data: eventPayload,
      });
      ctx.done$.next();
      ctx.done$.complete();
      ctx.subject.complete();
    }

    this.cleanup(jobId);
  }

  /**
   * Publishes job failure event and cleans up the job stream.
   */
  publishError(jobId: string, errorMessage: string, durationMs?: number): void {
    const ctx = this.jobContexts.get(jobId);
    const eventPayload: UnderstandingStreamEvent = {
      type: 'FAILED',
      jobId,
      stage: 'FAILED',
      stageLabel: 'Understanding Interrupted',
      stageDetails: errorMessage,
      stageIndex: 0,
      totalStages: TOTAL_UNDERSTANDING_STAGES,
      percent: 0,
      errorMessage,
      durationMs,
      timestamp: Date.now(),
    };

    if (ctx) {
      ctx.subject.next({
        type: 'failed',
        data: eventPayload,
      });
      ctx.done$.next();
      ctx.done$.complete();
      ctx.subject.complete();
    }

    this.cleanup(jobId);
  }

  /**
   * Publishes real-time drift alert event to active streaming subscribers.
   */
  publishDriftAlert(jobId: string, alert: any): void {
    const ctx = this.jobContexts.get(jobId);
    if (ctx) {
      const eventPayload: UnderstandingStreamEvent = {
        type: 'DRIFT_ALERT',
        jobId,
        driftAlert: alert,
        timestamp: Date.now(),
      };

      ctx.subject.next({
        type: 'drift_alert',
        data: eventPayload,
      });
    }
  }

  /**
   * Formats the initial connection message event.
   */
  private formatInitEvent(
    jobId: string,
    progress?: UnderstandingJobProgress | null,
  ): MessageEvent {
    const stageIndex = progress?.stageIndex ?? 0;
    const percent = Math.min(
      100,
      Math.round((stageIndex / TOTAL_UNDERSTANDING_STAGES) * 100),
    );

    const eventPayload: UnderstandingStreamEvent = {
      type: 'INIT',
      jobId,
      stage: progress?.currentStage ?? 'QUEUED',
      stageLabel: progress?.stageLabel ?? 'Queued for Understanding',
      stageDetails:
        progress?.stageDetails ??
        'Awaiting available background discovery worker.',
      stageIndex,
      totalStages: TOTAL_UNDERSTANDING_STAGES,
      percent,
      timestamp: Date.now(),
    };

    return {
      type: 'init',
      data: eventPayload,
    };
  }

  /**
   * Memory safe cleanup for finished jobs.
   */
  cleanup(jobId: string): void {
    this.jobContexts.delete(jobId);
    // Keep progress in cache for a brief window so post-completion connects receive completed state
    const timer = setTimeout(() => {
      this.latestProgress.delete(jobId);
    }, 60000); // Retain for 60 seconds
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  onModuleDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    for (const ctx of this.jobContexts.values()) {
      ctx.done$.next();
      ctx.done$.complete();
      ctx.subject.complete();
    }
    this.jobContexts.clear();
    this.latestProgress.clear();
  }
}
