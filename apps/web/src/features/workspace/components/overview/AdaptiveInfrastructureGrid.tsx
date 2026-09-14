import React from 'react';
import {
  Globe,
  Server,
  Layers,
  Cpu,
  Network,
  ShieldCheck,
  ShieldAlert,
  Database,
  Zap,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { BodySmall, SectionTitle, Eyebrow } from '../../../../components/typography';
import { Cluster, Stack, Grid } from '../../../../components/layout';
import type {
  SemanticInfrastructureCategory,
} from '../../contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from '../../contracts/adaptive-infrastructure-detail.contract.ts';
import { AdaptiveInfrastructureDetailCard } from './AdaptiveInfrastructureDetailCard';
import { IngressTopologyVisualizer } from './IngressTopologyVisualizer';
import type { AdaptiveInfrastructureGridProps } from './AdaptiveInfrastructureGrid.types';

const CATEGORY_ICONS: Record<SemanticInfrastructureCategory, typeof Globe> = {
  EDGE: Globe,
  GATEWAY: Server,
  APPLICATION: Layers,
  PLATFORM: Layers,
  RUNTIME: Cpu,
  HOSTING: Server,
  DNS: Network,
  TLS: ShieldCheck,
  NETWORK: Terminal,
  DATABASE: Database,
  CACHE: Zap,
  SECURITY: ShieldAlert,
  OTHER: Cpu,
};

/**
 * Generic Adaptive Infrastructure Grid with Progressive Disclosure (IA-1 / IA-2).
 *
 * Implements the data-driven Infrastructure Information Model:
 * - Renders exclusively observed semantic categories without forced empty categories
 * - Level 1 (Understanding): Name, Role, Version (optional), Confidence
 * - Level 2 (Context): Detection meaning and anti-overreach claim boundaries
 * - Level 3 (Evidence): Verified signals, source types, and timestamps
 * - Fully technology-agnostic: 0 technology-specific hardcoding
 * - Displays unobserved dimensions honestly with [UNOBSERVED] status
 */
export const AdaptiveInfrastructureGrid: React.FC<AdaptiveInfrastructureGridProps> = ({
  model,
  onViewFinding,
  showTopology = true,
  showSummary = true,
  className = '',
}) => {
  const {
    categoryGroups,
    ingressPath,
    summary,
    unobservedDimensions,
    claimBoundaries,
    observedTimestamp,
    hasObservedInfrastructure,
  } = model;

  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');

  if (!hasObservedInfrastructure) {
    return (
      <div className="p-8 rounded-2xl border border-border-hairline bg-surface-elevated text-center space-y-3">
        <Eyebrow variant="muted" className="text-xs">
          INFRASTRUCTURE
        </Eyebrow>
        <BodySmall variant="muted" className="text-xs italic text-[#5F625F] dark:text-muted-foreground">
          No verified infrastructure components observed for this target.
        </BodySmall>
      </div>
    );
  }

  const totalComponents = categoryGroups.reduce((acc, g) => acc + g.components.length, 0);

  const displayedCategoryGroups = selectedCategory === 'ALL'
    ? categoryGroups
    : categoryGroups.filter((g) => g.category === selectedCategory);

  return (
    <Stack gap="lg" className={`w-full ${className}`}>
      {/* 1. Architecture Narrative Summary if present */}
      {showSummary && summary && (
        <div className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-surface-metadata/50 border border-[#E8EAED] dark:border-border text-xs text-foreground leading-relaxed">
          {summary}
        </div>
      )}

      {/* 2. Interactive Ingress Flow & Architecture Topology Visualizer (Move 1) */}
      {showTopology && ingressPath && ingressPath.length > 0 && (
        <IngressTopologyVisualizer
          model={model}
          onViewFinding={onViewFinding}
        />
      )}

      {/* 3. Adaptive Categorized Infrastructure Grid (Only observed categories render) */}
      <Stack gap="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-hairline pb-2">
          <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Architecture Components
          </SectionTitle>

          {/* Category Filter Pills */}
          {categoryGroups.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer select-none ${
                  selectedCategory === 'ALL'
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-[#F4F4F1] dark:bg-surface-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({totalComponents})
              </button>
              {categoryGroups.map((g) => (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => setSelectedCategory(g.category)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer select-none ${
                    selectedCategory === g.category
                      ? 'bg-foreground text-background font-semibold'
                      : 'bg-[#F4F4F1] dark:bg-surface-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g.label} ({g.components.length})
                </button>
              ))}
            </div>
          )}
        </div>

        <Grid cols={displayedCategoryGroups.length > 1 && selectedCategory === 'ALL' ? 2 : 1} gap="md">
          {displayedCategoryGroups.map((group) => {
            const IconComp = CATEGORY_ICONS[group.category] || Cpu;
            return (
              <div
                key={group.category}
                className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3.5"
                data-testid={`category-group-${group.category.toLowerCase()}`}
              >
                <Cluster justify="between" align="center" gap="sm">
                  <Cluster gap="xs" align="center">
                    <Icon icon={IconComp} size="small" className="text-[#3568C8]" />
                    <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
                      {group.label}
                    </span>
                  </Cluster>
                  <span className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground">
                    {group.components.length} {group.components.length === 1 ? 'component' : 'components'}
                  </span>
                </Cluster>

                {group.description && (
                  <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-snug m-0">
                    {group.description}
                  </p>
                )}

                <div className="space-y-3 pt-1">
                  {group.components.map((comp) => {
                    const viewModel = buildComponentViewModel(comp, observedTimestamp);
                    return (
                      <AdaptiveInfrastructureDetailCard
                        key={comp.id}
                        viewModel={viewModel}
                        onViewFinding={onViewFinding}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Grid>
      </Stack>

      {/* 4. Technical Integrity: Unobservable Dimensions & Claim Boundaries */}
      {(unobservedDimensions.length > 0 || claimBoundaries.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Unobservable Architecture Dimensions */}
          {unobservedDimensions.length > 0 && (
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-2.5">
              <Cluster gap="xs" align="center">
                <Icon icon={HelpCircle} size="small" className="text-muted-foreground" />
                <span className="font-mono text-[11px] font-semibold text-[#5F625F] dark:text-muted-foreground uppercase tracking-wider">
                  Unobservable Dimensions
                </span>
              </Cluster>
              <div className="space-y-2 text-xs">
                {unobservedDimensions.map((unknown) => (
                  <div
                    key={unknown.dimension}
                    className="p-2.5 rounded-lg border border-[#E2E2DD] dark:border-border bg-[#FFFFFF] dark:bg-card space-y-1"
                  >
                    <Cluster justify="between" align="center">
                      <span className="font-mono text-xs font-medium text-foreground">{unknown.dimension}</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-surface-metadata border border-border">
                        {unknown.status}
                      </span>
                    </Cluster>
                    {unknown.explanation && (
                      <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-snug m-0">
                        {unknown.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authoritative Claim Boundaries */}
          {claimBoundaries.length > 0 && (
            <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card space-y-2.5">
              <Cluster gap="xs" align="center">
                <Icon icon={ShieldAlert} size="small" className="text-[#8C6B00]" />
                <span className="font-mono text-[11px] font-semibold text-[#8C6B00] uppercase tracking-wider">
                  Detection Scope & Boundaries
                </span>
              </Cluster>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[#5F625F] dark:text-muted-foreground m-0 p-0">
                {claimBoundaries.map((boundary, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <strong className="font-medium text-foreground">{boundary.technologyName}:</strong> {boundary.boundary}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Stack>
  );
};

AdaptiveInfrastructureGrid.displayName = 'AdaptiveInfrastructureGrid';
