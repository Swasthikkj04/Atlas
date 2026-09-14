import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Cluster } from '../../../../components/layout';
import type { InfrastructureComponentViewModel } from '../../contracts/adaptive-infrastructure-detail.contract.ts';

export interface AdaptiveInfrastructureDetailCardProps {
  viewModel: InfrastructureComponentViewModel;
  onViewFinding?: (findingId: string) => void;
  className?: string;
}

/**
 * Adaptive Infrastructure Detail Card with 3-Tier Progressive Disclosure (IA-2).
 *
 * Implements the progressive investigation model:
 * - Level 1 (Understanding): Name, Role, Version (optional), Layer badge
 * - Level 2 (Context): Expandable "Why this appears" and "Scope Limit" anti-overreach boundary
 * - Level 3 (Evidence): Expandable verified signals, source types, and timestamps
 *
 * Invariant: 0 technology-specific hardcoding. Fully data-driven.
 */
export const AdaptiveInfrastructureDetailCard: React.FC<AdaptiveInfrastructureDetailCardProps> = ({
  viewModel,
  className = '',
}) => {
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const {
    id,
    name,
    version,
    role,
    layer,
    whyThisAppears,
    whatThisDoesNotProve,
    evidence,
    hasContext,
    hasEvidence,
  } = viewModel;

  return (
    <div
      className={`p-4 rounded-xl border border-[#E2E2DD] dark:border-border bg-[#FBFBFA] dark:bg-surface-metadata/30 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3 ${className}`}
      data-testid={`adaptive-detail-card-${id}`}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* Level 1 — Understanding (Immediately visible) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-1.5">
        <Cluster justify="between" align="center" gap="sm">
          <Cluster gap="xs" align="center" className="min-w-0">
            <span className="font-mono text-sm font-semibold text-foreground truncate" data-testid="component-name">
              {name}
            </span>
            {version && (
              <span
                className="font-mono text-xs px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-foreground font-medium"
                data-testid="component-version"
              >
                v{version}
              </span>
            )}
          </Cluster>

          <Cluster gap="xs" align="center">
            {layer && (
              <span
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-secondary text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border font-medium"
                data-testid="component-layer"
              >
                {layer}
              </span>
            )}
          </Cluster>
        </Cluster>

        {role && (
          <p className="text-xs text-[#5F625F] dark:text-muted-foreground leading-relaxed m-0" data-testid="component-role">
            {role}
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Level 2 & 3 Interactive Toggles */}
      {/* ---------------------------------------------------------------------- */}
      {(hasContext || hasEvidence) && (
        <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider/60 flex flex-wrap items-center gap-2 text-xs font-mono">
          {hasContext && (
            <button
              type="button"
              onClick={() => setIsContextOpen(!isContextOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F4F4F1] dark:bg-surface-secondary hover:bg-[#EAEAE6] dark:hover:bg-surface-secondary/80 text-[#5F625F] dark:text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors cursor-pointer select-none"
              data-testid="toggle-context-btn"
            >
              <span>{isContextOpen ? 'Hide context' : 'Why this appears'}</span>
              <Icon icon={isContextOpen ? ChevronUp : ChevronDown} size="small" />
            </button>
          )}

          {hasEvidence && (
            <button
              type="button"
              onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EEF4FF] dark:bg-primary/10 hover:bg-[#E0ECFF] dark:hover:bg-primary/20 text-[#3568C8] dark:text-primary text-[11px] font-medium transition-colors cursor-pointer select-none"
              data-testid="toggle-evidence-btn"
            >
              <span>{isEvidenceOpen ? 'Hide evidence' : `Evidence (${evidence.length})`}</span>
              <Icon icon={isEvidenceOpen ? ChevronUp : ChevronDown} size="small" />
            </button>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Level 2 — Context (Revealed on interaction) */}
      {/* ---------------------------------------------------------------------- */}
      {isContextOpen && hasContext && (
        <div
          className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border space-y-2 text-xs"
          data-testid="level2-context-panel"
        >
          {whyThisAppears && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Infrastructure Role & Meaning
              </span>
              <p className="text-xs text-foreground leading-relaxed m-0" data-testid="context-why">
                {whyThisAppears}
              </p>
            </div>
          )}

          {whatThisDoesNotProve && (
            <div className="p-2.5 rounded bg-[#FEF7EC] dark:bg-yellow-950/20 border border-[#FCE1B4] dark:border-yellow-900/30 flex items-start gap-2 text-[#8C6B00] dark:text-yellow-400">
              <Icon icon={ShieldAlert} size="small" className="shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed" data-testid="context-boundary">
                <strong>Scope Limit:</strong> {whatThisDoesNotProve}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Level 3 — Evidence (Revealed on explicit investigation) */}
      {/* ---------------------------------------------------------------------- */}
      {isEvidenceOpen && hasEvidence && (
        <div
          className="p-3.5 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E1E1DC] dark:border-border space-y-2.5 text-xs"
          data-testid="level3-evidence-panel"
        >
          <Cluster justify="between" align="center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold flex items-center gap-1">
              <Icon icon={FileText} size="small" />
              <span>Evidence Signals</span>
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {evidence.length} signal{evidence.length > 1 ? 's' : ''}
            </span>
          </Cluster>

          <div className="space-y-2.5">
            {evidence.map((ev) => (
              <div key={ev.id} className="space-y-1" data-testid={`evidence-item-${ev.id}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-foreground font-medium">{ev.sourceDescription}</span>
                  {ev.observedAt && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {ev.observedAt}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border font-mono text-[11px] text-foreground break-all select-all">
                  {ev.observedSignal}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

AdaptiveInfrastructureDetailCard.displayName = 'AdaptiveInfrastructureDetailCard';
