import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { resolveInvestigationReturnLabel } from '../../contracts/investigation-continuity.contract';
import type { InvestigationReturnAnchorProps } from './InvestigationReturnAnchor.types';

/**
 * Sticky Return Anchor (H6-002 & H6-010).
 *
 * Provides an origin-descriptive, context-aware return affordance that restores
 * exact operator navigation state without generic "Back" labels.
 */
export const InvestigationReturnAnchor: React.FC<InvestigationReturnAnchorProps> = ({
  context,
  label,
  onReturn,
  onFallback,
  isFallback = false,
  fallbackReason,
  className = '',
  ...rest
}) => {
  const resolvedLabel = label || resolveInvestigationReturnLabel(context || {});

  return (
    <div
      data-testid="investigation-return-anchor"
      className={`flex flex-col gap-2 ${className}`}
      {...rest}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReturn}
          data-testid="return-anchor-button"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium tracking-tight rounded-md border border-[#E2E2DD] dark:border-border/60 bg-white dark:bg-surface-metadata text-[#1A1A1A] dark:text-foreground hover:bg-[#F4F4F1] dark:hover:bg-muted/40 transition-colors shadow-xs"
          aria-label={resolvedLabel}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#5F625F] dark:text-muted-foreground" />
          <span>{resolvedLabel}</span>
        </button>
      </div>

      {isFallback && (
        <div
          data-testid="investigation-fallback-banner"
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#FFF4E3] dark:bg-[#3D2B14]/40 border border-[#F0D3A5] dark:border-[#7A5424]/60 text-xs text-[#8C4A00] dark:text-[#E8A355]"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{fallbackReason || 'The original investigation context is no longer available.'}</span>
        </div>
      )}
    </div>
  );
};
