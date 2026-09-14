import React from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import type { ArchitecturalBoundariesResolution } from '../../contracts/adaptive-infrastructure.contract';

export interface ArchitecturalBoundariesCardProps {
  boundaries: ArchitecturalBoundariesResolution;
  className?: string;
}

/**
 * Architectural Boundaries Surface ("What Nebula Knows" vs "What Nebula Cannot See").
 *
 * Implements WX-4XX Section 9 & 10:
 * - Explicitly distinguishes observed public ingress from sealed internal perimeter
 * - Never uses failure semantics (No "Unknown", "Not detected", "Failed")
 * - Honest anti-overreach communication of perimeter isolation
 */
export const ArchitecturalBoundariesCard: React.FC<ArchitecturalBoundariesCardProps> = ({
  boundaries,
  className = '',
}) => {
  const { observed, sealed, editorialNote } = boundaries;

  return (
    <div
      className={`w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_3px_rgba(16,24,20,0.035)] overflow-hidden space-y-0 ${className}`}
      data-testid="architectural-boundaries-card"
    >
      {/* 1. Header */}
      <div className="px-5 py-4 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex flex-wrap items-center justify-between gap-3">
        <Cluster gap="sm" align="center">
          <div className="p-1.5 rounded-lg bg-[#EAF7F2] dark:bg-emerald-950/20 border border-[#B9E5D6] dark:border-emerald-700/30 text-[#178A68] dark:text-emerald-400">
            <Icon icon={ShieldCheck} size="small" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-[#178A68] dark:text-emerald-400">
                ARCHITECTURAL BOUNDARIES
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFFFFF] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border">
                PERIMETER SCOPE
              </span>
            </div>
            <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono mt-0.5">
              Publicly observable ingress layers vs protected internal systems
            </p>
          </div>
        </Cluster>
      </div>

      {/* 2. Dual-Column Boundaries Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#EEEEEB] dark:divide-border-divider">
        {/* Column 1: Observed with Confidence */}
        <div className="p-5 lg:p-6 space-y-4 bg-[#FFFFFF] dark:bg-card">
          <div className="flex items-center justify-between">
            <Cluster gap="xs" align="center">
              <CheckCircle2 className="w-4 h-4 text-[#178A68] dark:text-emerald-400" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Observed with Confidence
              </span>
            </Cluster>
            <span className="font-mono text-[10px] font-medium text-[#178A68] bg-[#EAF7F2] dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-[#B9E5D6] dark:border-emerald-800/40">
              {observed.length} VERIFIED
            </span>
          </div>

          <div className="space-y-2.5">
            {observed.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-[#EEEEEB] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary/40 space-y-1 transition-colors"
                data-testid={`boundary-observed-${item.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase font-bold text-[#178A68] dark:text-emerald-400">
                    OBSERVED
                  </span>
                </div>
                <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-snug m-0">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Protected Behind Observed Boundary */}
        <div className="p-5 lg:p-6 space-y-4 bg-[#FBFBF9] dark:bg-surface-secondary/20">
          <div className="flex items-center justify-between">
            <Cluster gap="xs" align="center">
              <Lock className="w-4 h-4 text-[#5F625F] dark:text-muted-foreground" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Protected Behind Boundary
              </span>
            </Cluster>
            <span className="font-mono text-[10px] font-medium text-[#5F625F] dark:text-muted-foreground bg-[#F0F0EB] dark:bg-surface-metadata px-2 py-0.5 rounded border border-[#E2E2DD] dark:border-border">
              {sealed.length} ISOLATED
            </span>
          </div>

          <div className="space-y-2.5">
            {sealed.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-[#E8E8E2] dark:border-border bg-[#FFFFFF] dark:bg-card space-y-1 transition-colors"
                data-testid={`boundary-sealed-${item.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="font-mono text-[9px] uppercase font-semibold text-[#5F625F] dark:text-muted-foreground px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-snug m-0">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Reassuring Editorial Footnote */}
      <div className="px-5 py-3.5 border-t border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex items-start gap-2.5">
        <Icon icon={Info} size="small" className="text-[#3568C8] dark:text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed m-0 font-mono">
          {editorialNote}
        </p>
      </div>
    </div>
  );
};

ArchitecturalBoundariesCard.displayName = 'ArchitecturalBoundariesCard';
