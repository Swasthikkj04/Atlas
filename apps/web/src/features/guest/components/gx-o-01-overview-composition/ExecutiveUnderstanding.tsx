import React from 'react';
import { Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { DomainFavicon } from '../../../workspace/components/identity/DomainFavicon';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { formatCompactIntelligenceStrip } from '../../contracts/gx-o-01-overview-composition.contract.ts';

interface ExecutiveUnderstandingProps {
  viewModel: GuestWorkspaceViewModel;
  onInspectWire?: () => void;
  className?: string;
}

export const ExecutiveUnderstanding: React.FC<ExecutiveUnderstandingProps> = ({
  viewModel,
  className = '',
}) => {
  const { domain, executiveNarrative, severityDistribution } = viewModel;
  const strip = formatCompactIntelligenceStrip(viewModel);

  const isHealthy =
    severityDistribution.critical === 0 && severityDistribution.high === 0;

  const accentBorderColor =
    severityDistribution.critical > 0
      ? '#C94B58'
      : severityDistribution.high > 0
      ? '#C98224'
      : '#1F9D73';

  return (
    <section
      aria-labelledby="executive-understanding-title"
      data-testid="gx-executive-understanding"
      className={`relative overflow-hidden rounded-2xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(16,24,20,0.035)] ${className}`}
      style={{ borderTopColor: accentBorderColor, borderTopWidth: '3px' }}
    >
      <div className="space-y-4">
        {/* Badge / Category Header */}
        <div className="flex items-center gap-2 text-[#3568C8] dark:text-primary font-mono text-xs tracking-[0.24em] uppercase font-semibold">
          <Icon icon={Sparkles} size="small" />
          <span>Synthesized Perimeter Intelligence</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3.5">
          <DomainFavicon domain={domain} size="primary" />
          <h2
            id="executive-understanding-title"
            className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground"
          >
            Executive Understanding for{' '}
            <span className="text-primary font-mono">{domain}</span>
          </h2>
        </div>

        {/* Narrative Paragraphs */}
        <div className="space-y-3.5 text-base sm:text-[15.5px] leading-relaxed text-foreground/90 font-normal">
          {executiveNarrative.paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Discovered Entity Pills */}
        {executiveNarrative.highlightedEntities.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground uppercase mr-1 font-semibold">
              Observed Stack:
            </span>
            {executiveNarrative.highlightedEntities.map((ent, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F4F4F1] dark:bg-surface-metadata text-foreground border border-[#E2E2DD] dark:border-border"
              >
                <span className="size-1.5 rounded-full bg-[#3568C8] dark:bg-primary" />
                <span className="font-semibold">{ent.name}</span>
                <span className="text-[#5F625F] dark:text-muted-foreground text-[11px]">
                  ({ent.category})
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Compact Restrained Intelligence Strip (Replaces 4-Card KPI-Wall) */}
      <div
        data-testid="gx-compact-intelligence-strip"
        className="mt-6 pt-5 border-t border-[#EEEEEB] dark:border-border-divider grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FAFAF8] dark:bg-surface-secondary/40 rounded-xl p-4 border border-[#EEEEEB] dark:border-border/60"
      >
        {/* 1. Perimeter Status */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground uppercase font-semibold tracking-wider">
            {strip.perimeter.label}
          </div>
          <div className="flex items-center gap-1.5">
            {isHealthy ? (
              <Icon icon={ShieldCheck} size="small" className="text-[#178A68] dark:text-emerald-400 shrink-0" />
            ) : (
              <Icon icon={AlertTriangle} size="small" className="text-[#B86F18] dark:text-amber-400 shrink-0" />
            )}
            <span className="text-xs font-mono font-medium text-foreground truncate">
              {strip.perimeter.verdict}
            </span>
          </div>
        </div>

        {/* 2. Ingress Pipeline */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground uppercase font-semibold tracking-wider">
            {strip.ingress.label}
          </div>
          <div className="text-xs font-mono font-medium text-foreground">
            {strip.ingress.value}
          </div>
        </div>

        {/* 3. Transport Security */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground uppercase font-semibold tracking-wider">
            {strip.transport.label}
          </div>
          <div className="text-xs font-mono font-medium text-foreground">
            {strip.transport.value}
          </div>
        </div>

        {/* 4. Observed Signals */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground uppercase font-semibold tracking-wider">
            {strip.observed.label}
          </div>
          <div className="text-xs font-mono font-medium text-foreground">
            {strip.observed.value}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveUnderstanding;
