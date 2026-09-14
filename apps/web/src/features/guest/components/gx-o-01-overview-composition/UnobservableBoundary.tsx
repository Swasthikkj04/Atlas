import React from 'react';
import { EyeOff, Info } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { getUnobservableDimensions } from '../../contracts/gx-o-01-overview-composition.contract.ts';

interface UnobservableBoundaryProps {
  className?: string;
}

export const UnobservableBoundary: React.FC<UnobservableBoundaryProps> = ({
  className = '',
}) => {
  const dimensions = getUnobservableDimensions();

  return (
    <section
      aria-labelledby="unobservable-boundary-title"
      data-testid="gx-unobservable-boundary"
      className={`rounded-2xl bg-[#FAFAF8] dark:bg-card/40 border border-[#E1E1DC] dark:border-border p-6 sm:p-7 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.02)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
            NOT OBSERVED
          </span>
          <h3
            id="unobservable-boundary-title"
            className="text-base sm:text-lg font-display font-semibold text-foreground flex items-center gap-2"
          >
            <Icon icon={EyeOff} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
            <span>Public Observation Boundary & Limits</span>
          </h3>
        </div>
      </div>

      <p className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed max-w-2xl">
        Private internal infrastructure remains strictly outside the external public perimeter observation boundary. Nebula maintains epistemic honesty by never fabricating or guessing unobserved internal topologies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {dimensions.map((dim, idx) => (
          <div
            key={idx}
            className="bg-[#FFFFFF] dark:bg-surface-secondary/40 border border-[#EEEEEB] dark:border-border rounded-xl p-3.5 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon icon={Info} size="small" className="text-[#5F625F] dark:text-muted-foreground shrink-0" />
              <div className="text-xs font-semibold text-foreground truncate">{dim.title}</div>
            </div>
            <div className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed line-clamp-2">
              {dim.description}
            </div>
            <div className="text-[11px] font-mono text-[#5F625F]/80 dark:text-muted-foreground/80 pt-1 border-t border-[#EEEEEB] dark:border-border/60">
              {dim.examples}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UnobservableBoundary;
