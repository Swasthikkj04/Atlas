import React from 'react';

export interface TimelineSkeletonLoaderProps {
  readonly count?: number;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Calm Timeline Skeleton Loader (WX-1026).
 *
 * Implements the restrained 520ms pulse loading rows without circular spinners:
 * - Hairline skeleton shapes matching card heights
 * - Calm, muted status text
 */
export const TimelineSkeletonLoader: React.FC<TimelineSkeletonLoaderProps> = ({
  count = 2,
  label = 'Loading earlier infrastructure history…',
  className = '',
}) => {
  return (
    <div
      className={`w-full py-4 space-y-3 ${className}`}
      data-testid="timeline-skeleton-loader"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground pb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3568C8] animate-pulse" />
        <span>{label}</span>
      </div>

      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card p-5 space-y-3 animate-pulse opacity-75"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-[#F4F4F1] dark:bg-surface-metadata rounded" />
            <div className="h-4 w-20 bg-[#F4F4F1] dark:bg-surface-metadata rounded" />
          </div>
          <div className="h-5 w-3/4 bg-[#F4F4F1] dark:bg-surface-metadata rounded" />
          <div className="h-3 w-1/2 bg-[#F4F4F1] dark:bg-surface-metadata rounded" />
        </div>
      ))}
    </div>
  );
};

TimelineSkeletonLoader.displayName = 'TimelineSkeletonLoader';
