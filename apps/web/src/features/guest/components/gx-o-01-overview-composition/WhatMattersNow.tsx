import React from 'react';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { FindingViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { extractMeaningfulObservations } from '../../contracts/gx-o-01-overview-composition.contract.ts';

interface WhatMattersNowProps {
  findings?: readonly FindingViewModel[];
  onInspectFinding?: (findingId?: string) => void;
  onViewAllFindings?: () => void;
  className?: string;
}

export const WhatMattersNow: React.FC<WhatMattersNowProps> = ({
  findings = [],
  onInspectFinding,
  onViewAllFindings,
  className = '',
}) => {
  const meaningfulItems = extractMeaningfulObservations(findings, 3);
  const isQuietState = meaningfulItems.length === 0;

  return (
    <section
      aria-labelledby="what-matters-now-title"
      data-testid="gx-what-matters-now"
      className={`rounded-2xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border p-6 sm:p-7 space-y-4 shadow-[0_1px_2px_rgba(16,24,20,0.035)] ${className}`}
      style={{
        borderTopColor: isQuietState ? '#1F9D73' : '#C98224',
        borderTopWidth: '3px',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
            WHAT MATTERS NOW
          </span>
          <h3
            id="what-matters-now-title"
            className="text-base sm:text-lg font-display font-semibold text-foreground flex items-center gap-2"
          >
            {isQuietState ? (
              <>
                <Icon icon={ShieldCheck} size="small" className="text-[#178A68] dark:text-emerald-400" />
                <span>Infrastructure appears stable.</span>
              </>
            ) : (
              <>
                <Icon icon={ShieldAlert} size="small" className="text-[#B86F18] dark:text-amber-400" />
                <span>
                  {meaningfulItems.length === 1
                    ? 'One observation deserves attention.'
                    : `${meaningfulItems.length} observations deserve attention.`}
                </span>
              </>
            )}
          </h3>
        </div>

        {!isQuietState && onViewAllFindings && (
          <button
            type="button"
            onClick={onViewAllFindings}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer focus-ring font-mono"
          >
            <span>View All ({findings.length})</span>
            <Icon icon={ArrowRight} size="small" />
          </button>
        )}
      </div>

      {isQuietState ? (
        <div className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed pt-1">
          No actionable perimeter vulnerabilities or high-risk configuration anomalies were observed in active wire telemetry.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {meaningfulItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onInspectFinding?.(item.id)}
              className="group bg-[#FAFAF8] dark:bg-surface-secondary/40 hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata/50 border border-[#EEEEEB] dark:border-border rounded-xl p-4 space-y-2 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.severity === 'CRITICAL'
                        ? 'text-[#A93442] bg-[#FDEBEC] border border-[#E9B3B9] dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-800/60'
                        : item.severity === 'HIGH'
                        ? 'text-[#B86F18] bg-[#FFF4E3] border border-[#F0D3A5] dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60'
                        : 'text-[#3568C8] bg-[#EEF4FF] border border-[#C8D8F6] dark:text-primary dark:bg-primary/10 dark:border-primary/20'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground truncate">
                    {item.category}
                  </span>
                </div>

                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </div>

                <div className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed line-clamp-2">
                  {item.explanation}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-1 text-xs font-mono text-primary font-semibold group-hover:underline">
                <span>Understand why</span>
                <Icon icon={ArrowRight} size="small" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default WhatMattersNow;
