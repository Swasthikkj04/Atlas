import React from 'react';
import {
  evaluateWorkspaceQuotaUsage,
  formatRetryAfterDuration,
  getQuotaUsageColorClass,
  type WorkspaceTier,
} from '../../contracts/workspace-quota-rate-limit.contract';

interface WorkspaceQuotaUsageWidgetProps {
  readonly tier?: WorkspaceTier;
  readonly currentDomains?: number;
  readonly activeScans?: number;
  readonly scansCompletedThisHour?: number;
  readonly apiRateRemaining?: number;
  readonly apiResetSeconds?: number;
  readonly retryAfterSeconds?: number;
  readonly className?: string;
  readonly onUpgradeClick?: () => void;
}

export const WorkspaceQuotaUsageWidget: React.FC<WorkspaceQuotaUsageWidgetProps> = ({
  tier = 'FREE',
  currentDomains = 0,
  activeScans = 0,
  scansCompletedThisHour = 0,
  apiRateRemaining,
  apiResetSeconds,
  retryAfterSeconds,
  className = '',
  onUpgradeClick,
}) => {
  const usage = evaluateWorkspaceQuotaUsage({
    tier,
    currentDomains,
    activeScans,
    scansCompletedThisHour,
    apiRateRemaining,
    apiResetSeconds,
    retryAfterSeconds,
  });

  const domainColor = getQuotaUsageColorClass(usage.domainUsageRatio);
  const scanColor = getQuotaUsageColorClass(usage.scanQuotaUsageRatio);

  return (
    <div
      data-testid="workspace-quota-widget"
      className={`rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              Workspace Quotas &amp; Throughput
            </h4>
            <p className="text-[11px] text-slate-400">
              Operational limits, scan capacity &amp; rate controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            data-testid="workspace-tier-badge"
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
              usage.tier === 'ENTERPRISE'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : usage.tier === 'PRO'
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {usage.tier} Tier
          </span>

          {usage.tier === 'FREE' && onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Upgrade &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Rate Limit / Backpressure Alert Banner */}
      {usage.isRateLimited && (
        <div
          data-testid="rate-limit-alert-banner"
          className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 shrink-0 text-amber-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Request limit reached or discovery queue saturated. Cooldown active.
            </span>
          </div>
          <span
            data-testid="cooldown-timer"
            className="font-mono font-semibold text-amber-200"
          >
            Retry in {formatRetryAfterDuration(usage.retryAfterSeconds || 0)}
          </span>
        </div>
      )}

      {/* Quota Meters Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Monitored Domains */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Monitored Domains</span>
            <span data-testid="domain-quota-text" className={domainColor.textClass}>
              {usage.currentDomains} / {usage.maxDomains}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${domainColor.barClass}`}
              style={{ width: `${usage.domainUsageRatio * 100}%` }}
            />
          </div>
          {usage.isDomainLimitReached && (
            <p className="mt-1 text-[10px] text-rose-400">Limit reached</p>
          )}
        </div>

        {/* Metric 2: Scans / Hour */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Hourly Scans</span>
            <span data-testid="scan-quota-text" className={scanColor.textClass}>
              {usage.scansCompletedThisHour} / {usage.scansPerHourLimit}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${scanColor.barClass}`}
              style={{ width: `${usage.scanQuotaUsageRatio * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Concurrency: {usage.activeScans}/{usage.maxConcurrentScans} active</span>
          </div>
        </div>

        {/* Metric 3: API Rate Limit */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">API Throughput</span>
            <span data-testid="api-rate-text" className="text-slate-300 font-mono text-xs">
              {usage.apiRateRemaining} / {usage.apiRateLimit}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${
                  usage.apiRateLimit > 0
                    ? Math.max(5, (usage.apiRateRemaining / usage.apiRateLimit) * 100)
                    : 100
                }%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Reset window: 60s</span>
            {usage.apiResetSeconds > 0 && (
              <span>Reset in {usage.apiResetSeconds}s</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
