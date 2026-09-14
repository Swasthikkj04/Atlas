import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { synthesizePositiveObservations } from '../../contracts/gx-o-01-overview-composition.contract.ts';

interface PositiveObservationsProps {
  viewModel: GuestWorkspaceViewModel;
  className?: string;
}

export const PositiveObservations: React.FC<PositiveObservationsProps> = ({
  viewModel,
  className = '',
}) => {
  const items = synthesizePositiveObservations(viewModel);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="positive-observations-title"
      data-testid="gx-positive-observations"
      className={`rounded-2xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border p-6 sm:p-7 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.035)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#178A68] dark:text-emerald-400">
            CONFIRMED HYGIENE
          </span>
          <h3
            id="positive-observations-title"
            className="text-base sm:text-lg font-display font-semibold text-foreground flex items-center gap-2"
          >
            <Icon icon={ShieldCheck} size="small" className="text-[#178A68] dark:text-emerald-400" />
            <span>Observed Security Baseline ({items.length} Controls Verified)</span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[#FAFAF8] dark:bg-surface-secondary/40 border border-[#EEEEEB] dark:border-border rounded-xl p-3.5 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle2} size="small" className="text-[#178A68] dark:text-emerald-400 shrink-0" />
              <div className="text-xs font-semibold text-foreground">{item.title}</div>
            </div>
            <div className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed pl-6">
              {item.evidenceSummary}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PositiveObservations;
