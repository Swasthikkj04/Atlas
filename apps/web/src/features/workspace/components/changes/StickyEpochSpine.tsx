import React from 'react';
import { Calendar } from 'lucide-react';
import { Icon } from '../../../../components/icons';

export interface StickyEpochSpineProps {
  readonly epochLabel: string;
  readonly className?: string;
}

/**
 * Sticky Chronological Epoch Spine (WX-1026).
 *
 * Implements the dockable time anchor header with hairline timeline spine:
 * - Subtle, calm typography without oversized banners
 * - Hairline spine dot anchoring historical chronology
 * - Sticky docking near top during continuous vertical scroll
 */
export const StickyEpochSpine: React.FC<StickyEpochSpineProps> = ({
  epochLabel,
  className = '',
}) => {
  return (
    <div
      className={`sticky top-0 z-20 py-2.5 bg-[#F7F7F5]/95 dark:bg-background/95 backdrop-blur-xs flex items-center gap-3 transition-colors ${className}`}
      data-testid="sticky-epoch-header"
    >
      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.03)]">
        <Icon icon={Calendar} size="small" className="text-[#5F625F] dark:text-muted-foreground w-3.5 h-3.5" />
        <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-foreground uppercase">
          {epochLabel}
        </span>
      </div>
      <div className="h-px flex-1 bg-[#E1E1DC] dark:bg-border" />
    </div>
  );
};

StickyEpochSpine.displayName = 'StickyEpochSpine';
