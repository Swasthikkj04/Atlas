import React from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  GitCommit,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import {
  resolveWhatMattersNow,
  type WhatMattersNowResolution,
} from '../../contracts/adaptive-infrastructure.contract';
import type { DomainOverviewResponseDto } from '../../../../types/api/overview.dto';

export interface WhatMattersSectionProps {
  data?: DomainOverviewResponseDto | null;
  onNavigateToChanges?: () => void;
  onNavigateToFindings?: () => void;
  className?: string;
}

/**
 * "What Matters Now" Architectural Intelligence Layer.
 *
 * Implements WX-4XX Section 11 & 19:
 * - Detects everything, surfaces only what matters
 * - Communicates stable infrastructure as reassuring intelligence
 * - Directs attention only when actionable changes or critical exposures exist
 */
export const WhatMattersSection: React.FC<WhatMattersSectionProps> = ({
  data,
  onNavigateToChanges,
  onNavigateToFindings,
  className = '',
}) => {
  const resolution: WhatMattersNowResolution = resolveWhatMattersNow(data);

  return (
    <div
      className={`w-full rounded-2xl border p-5 lg:p-6 transition-all shadow-[0_1px_3px_rgba(16,24,20,0.03)] ${
        resolution.status === 'STABLE' || resolution.status === 'RESOLVED'
          ? 'border-[#B9E5D6] dark:border-emerald-800/40 bg-gradient-to-r from-[#F4FAF7] to-[#FFFFFF] dark:from-emerald-950/10 dark:to-card'
          : resolution.status === 'CHANGED'
          ? 'border-[#C8D8F6] dark:border-primary/30 bg-gradient-to-r from-[#EEF4FF] to-[#FFFFFF] dark:from-primary/10 dark:to-card'
          : 'border-[#FCE1B4] dark:border-amber-700/30 bg-gradient-to-r from-[#FEF9EE] to-[#FFFFFF] dark:from-amber-950/10 dark:to-card'
      } ${className}`}
      data-testid="what-matters-section"
      role="region"
      aria-label="What Matters Now"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <Cluster gap="xs" align="center">
            {(resolution.status === 'STABLE' || resolution.status === 'RESOLVED') && (
              <Icon icon={CheckCircle2} size="small" className="text-[#178A68] dark:text-emerald-400" />
            )}
            {resolution.status === 'CHANGED' && (
              <Icon icon={GitCommit} size="small" className="text-[#3568C8] dark:text-primary" />
            )}
            {resolution.status === 'ATTENTION' && (
              <Icon icon={ShieldAlert} size="small" className="text-[#8C6B00] dark:text-amber-400" />
            )}
            <span className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
              WHAT MATTERS NOW
            </span>
          </Cluster>

          <h3 className="font-display text-base sm:text-lg font-medium text-foreground tracking-tight">
            {resolution.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground leading-relaxed font-sans">
            {resolution.subtitle}
          </p>

          {resolution.lastVerified && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/80 pt-0.5">
              <Clock className="w-3 h-3 inline" />
              <span>Last verified · {resolution.lastVerified}</span>
            </div>
          )}
        </div>

        {/* Action button if actionable change or finding exists */}
        {resolution.actionText && (
          <div className="shrink-0 pt-2 sm:pt-0">
            {resolution.actionTarget === 'changes' && onNavigateToChanges && (
              <button
                type="button"
                onClick={onNavigateToChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#3568C8] bg-[#3568C8] text-white hover:bg-[#2B54A3] text-xs font-mono font-medium transition-colors cursor-pointer shadow-sm select-none"
                data-testid="what-matters-action-btn"
              >
                <span>{resolution.actionText}</span>
                <Icon icon={ArrowRight} size="small" />
              </button>
            )}

            {resolution.actionTarget === 'findings' && onNavigateToFindings && (
              <button
                type="button"
                onClick={onNavigateToFindings}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#8C6B00] bg-[#8C6B00] text-white hover:bg-[#705500] text-xs font-mono font-medium transition-colors cursor-pointer shadow-sm select-none"
                data-testid="what-matters-action-btn"
              >
                <span>{resolution.actionText}</span>
                <Icon icon={ArrowRight} size="small" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

WhatMattersSection.displayName = 'WhatMattersSection';
