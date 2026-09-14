import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Network,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import type { UnderstandingJobDto } from '../../../../types/api/understanding.dto';
import {
  UNDERSTANDING_UI_STAGES,
  resolveStageVisualStatus,
  calculateElapsedSeconds,
} from '../../contracts/understanding-stepper.contract';

export interface UnderstandingProgressStepperProps {
  readonly job: UnderstandingJobDto | null | undefined;
  readonly className?: string;
}

const STAGE_ICONS: Record<string, React.ElementType> = {
  PROBING_DNS_NETWORK: Network,
  ANALYZING_TLS_SECURITY: ShieldCheck,
  BEHAVIORAL_FINGERPRINTING: Cpu,
  PERSISTING_SNAPSHOT_DIFF: Layers,
  EVALUATING_FINDINGS_ANOMALIES: AlertTriangle,
  SYNTHESIZING_BRIEF: Sparkles,
};

export const UnderstandingProgressStepper: React.FC<UnderstandingProgressStepperProps> = ({
  job,
  className = '',
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!job || (job.status !== 'RUNNING' && job.status !== 'PENDING')) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [job]);

  if (!job) return null;

  const progress = job.progress;
  const startedAtMs = progress?.startedAt || (job.startedAt ? new Date(job.startedAt).getTime() : null);
  const elapsedSeconds = calculateElapsedSeconds(startedAtMs, now);

  const activeStageIndex = progress?.stageIndex || (job.status === 'RUNNING' ? 1 : 0);
  const totalStages = progress?.totalStages || UNDERSTANDING_UI_STAGES.length;
  const activeStageDef = UNDERSTANDING_UI_STAGES.find((s) => s.stageIndex === activeStageIndex) || UNDERSTANDING_UI_STAGES[0];
  const activeDetails = progress?.stageDetails || activeStageDef.defaultDetails;

  return (
    <div
      className={`w-full rounded-xl border border-border-hairline/80 bg-background-elevated/40 dark:bg-background-elevated/20 p-4 sm:p-5 space-y-4 shadow-2xs backdrop-blur-xs transition-all ${className}`}
      data-testid="understanding-progress-stepper"
      role="region"
      aria-label="Understanding Pipeline Progress"
    >
      {/* Header Stage & Duration Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold uppercase tracking-wider text-primary text-[11px] bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
            Stage {Math.max(1, Math.min(activeStageIndex, totalStages))} / {totalStages}
          </span>
          <span className="font-medium text-foreground font-sans">
            {job.status === 'COMPLETED'
              ? 'Complete'
              : job.status === 'FAILED'
              ? 'Failed'
              : activeStageDef.stageLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-muted-foreground text-[11px]">
          {startedAtMs && (
            <span className="inline-flex items-center gap-1">
              <span className="text-muted-foreground/80">Elapsed:</span>
              <span className="font-semibold text-foreground">{elapsedSeconds}s</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-primary">
            {job.status === 'RUNNING' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{job.status === 'RUNNING' ? 'Live Authoritative Engine' : job.status}</span>
          </span>
        </div>
      </div>

      {/* Live Stage Detail Callout */}
      {job.status === 'RUNNING' && activeDetails && (
        <div className="rounded-lg bg-primary/[0.04] border border-primary/15 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0 mt-0.5" />
          <span className="text-foreground/90 font-mono text-[11px] leading-relaxed">
            {activeDetails}
          </span>
        </div>
      )}

      {/* Step Pipeline Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1"
        role="list"
        aria-label="Discovery Pipeline Steps"
      >
        {UNDERSTANDING_UI_STAGES.map((stageDef) => {
          const status = resolveStageVisualStatus(stageDef, progress, job.status);
          const IconComponent = STAGE_ICONS[stageDef.stage] || Search;

          let statusStyles = 'border-border-hairline/60 bg-muted/20 text-muted-foreground/70 opacity-60';
          let iconBadgeStyles = 'bg-muted text-muted-foreground';

          if (status === 'completed') {
            statusStyles = 'border-emerald-500/30 bg-emerald-500/[0.04] text-foreground dark:text-emerald-300';
            iconBadgeStyles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
          } else if (status === 'active') {
            statusStyles = 'border-primary/40 bg-primary/[0.08] text-foreground ring-1 ring-primary/30 shadow-xs';
            iconBadgeStyles = 'bg-primary/20 text-primary border border-primary/30 animate-pulse';
          } else if (status === 'failed') {
            statusStyles = 'border-destructive/30 bg-destructive/[0.04] text-destructive';
            iconBadgeStyles = 'bg-destructive/10 text-destructive border border-destructive/20';
          }

          return (
            <div
              key={stageDef.stage}
              role="listitem"
              aria-current={status === 'active' ? 'step' : undefined}
              data-testid={`understanding-stage-${stageDef.stage}`}
              className={`flex flex-col gap-2 p-2.5 rounded-lg border text-xs transition-all ${statusStyles}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium ${iconBadgeStyles}`}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : status === 'failed' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <span className="text-[10px]">{stageDef.stageIndex}</span>
                  )}
                </span>
                <IconComponent className="w-3.5 h-3.5 opacity-50" />
              </div>

              <div className="space-y-0.5">
                <span className="font-medium line-clamp-1 text-[11px]">
                  {stageDef.shortLabel}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
