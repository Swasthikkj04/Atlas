import React from 'react';
import { EyeOff, ShieldAlert, Lock } from 'lucide-react';
import type { ObservationBoundaryDimension } from '../../contracts/gx-i-01-infrastructure-surface.contract.ts';

interface ObservationBoundarySectionProps {
  dimensions: readonly ObservationBoundaryDimension[];
}

export const ObservationBoundarySection: React.FC<ObservationBoundarySectionProps> = ({
  dimensions,
}) => {
  return (
    <section
      aria-label="Observation boundary"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#5F625F] dark:text-muted-foreground font-semibold">
            <EyeOff className="w-3.5 h-3.5 text-primary" />
            <span>03 &bull; Observation Boundary</span>
          </div>
          <h3 className="text-lg sm:text-xl font-display font-semibold text-foreground mt-1">
            What cannot be established publicly
          </h3>
          <p className="text-xs sm:text-sm text-[#5F625F] dark:text-muted-foreground font-sans mt-0.5">
            Nebula&apos;s guest understanding is derived exclusively from publicly observable perimeter telemetry.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60 self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5" />
          <span>Epistemic Limits</span>
        </span>
      </div>

      {/* 2. Boundary Grid: NOT ESTABLISHED FROM PUBLIC TELEMETRY */}
      <div className="space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
          Not established from public telemetry
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dimensions.map((dim) => (
            <div
              key={dim.id}
              className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-foreground">
                  {dim.title}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {dim.scope}
                </span>
              </div>
              <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-sans leading-relaxed">
                {dim.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Epistemic Clarification Note */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 leading-relaxed font-sans">
          <strong className="font-semibold text-foreground">Distinction principle:</strong> Nebula cannot establish private backend services from this observation boundary. Absence of public telemetry does not imply absence of internal infrastructure.
        </div>
      </div>
    </section>
  );
};
