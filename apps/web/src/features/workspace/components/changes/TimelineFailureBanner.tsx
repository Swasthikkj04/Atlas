import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Icon } from '../../../../components/icons';

export interface TimelineFailureBannerProps {
  readonly onRetry: () => void;
  readonly isRetrying?: boolean;
  readonly message?: string;
  readonly className?: string;
}

/**
 * Timeline Page Failure Banner (WX-1026).
 *
 * Appears when subsequent historical page fetch fails:
 * - Preserves existing loaded history intact
 * - Provides inline retry trigger
 */
export const TimelineFailureBanner: React.FC<TimelineFailureBannerProps> = ({
  onRetry,
  isRetrying = false,
  message = "Earlier history couldn't be retrieved.",
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl border border-[#F0C3C7] bg-[#FFF0F1] dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${className}`}
      data-testid="timeline-failure-banner"
    >
      <div className="flex items-center gap-2 text-[#C24D57] dark:text-red-400">
        <Icon icon={AlertCircle} size="small" />
        <span>{message}</span>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] dark:bg-card border border-[#F0C3C7] text-[#C24D57] dark:text-red-400 hover:bg-[#FFF0F1] font-medium transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        data-testid="retry-timeline-page-button"
      >
        <Icon icon={RefreshCw} size="small" className={isRetrying ? 'animate-spin' : ''} />
        <span>{isRetrying ? 'Retrying…' : 'Try again'}</span>
      </button>
    </div>
  );
};

TimelineFailureBanner.displayName = 'TimelineFailureBanner';
