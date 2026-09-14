import React from 'react';
import type { ConversionPanelContent } from '../../contracts/gx-h-02-history-conversion.contract.ts';
import { ArrowRight } from 'lucide-react';

interface RememberThisConversionPanelProps {
  content: ConversionPanelContent;
  onClaim: () => void;
}

export const RememberThisConversionPanel: React.FC<RememberThisConversionPanelProps> = ({
  content,
  onClaim,
}) => {
  return (
    <aside
      aria-label="Conversion Invitation"
      className="bg-[#FFFFFF] dark:bg-card border-2 border-primary/30 rounded-2xl p-6 sm:p-8 space-y-7 shadow-[0_4px_16px_rgba(16,24,20,0.06)] relative overflow-hidden"
    >
      {/* Top Subtle Primary Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />

      {/* 1. Quiet Invitation Heading */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight">
          {content.heading}
        </h2>
        <p className="text-sm text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
          {content.supportingMessage}
        </p>
      </div>

      {/* 2. Three Compact Value Propositions */}
      <div className="space-y-4 pt-1">
        {content.valuePropositions.map((prop) => (
          <div key={prop.id} className="space-y-0.5">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
              {prop.title}
            </div>
            <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-sans">
              {prop.tagline}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Primary Conversion Action & Reassurance */}
      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={onClaim}
          className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 font-sans font-semibold text-sm active:scale-[0.98] shadow-md shadow-black/10 dark:shadow-white/5 transition-all cursor-pointer focus-ring"
        >
          <span>{content.ctaLabel}</span>
          <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </button>

        <p className="text-[11px] font-mono text-center text-[#5F625F] dark:text-muted-foreground">
          {content.reassuranceText}
        </p>
      </div>
    </aside>
  );
};
