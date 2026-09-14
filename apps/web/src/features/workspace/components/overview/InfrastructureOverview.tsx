import React from 'react';
import {
  Clock,
  ArrowUpRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  BodySmall,
  Eyebrow,
} from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useDomainOverview } from '../../../../hooks/queries/useOverview';
import { useDomainUnderstandingJobs } from '../../../../hooks/queries/useUnderstanding';
import { resolveOverviewState } from '../../contracts/overview.contract';
import { findActiveJob } from '../../contracts/understanding-convergence.contract';
import {
  resolveAdaptiveInfrastructureModel,
  synthesizeArchitecturalHeroSummary,
  resolveArchitecturalBoundaries,
} from '../../contracts/adaptive-infrastructure.contract';
import { AdaptiveInfrastructureGrid } from './AdaptiveInfrastructureGrid';
import { IngressTopologyVisualizer } from './IngressTopologyVisualizer';
import { ArchitecturalBoundariesCard } from './ArchitecturalBoundariesCard';
import { WhatMattersSection } from './WhatMattersSection';
import { UnderstandNowButton } from '../understanding';
import type { InfrastructureOverviewProps } from './InfrastructureOverview.types';

/**
 * WX-4XX: Infrastructure Overview — Premium Architecture Intelligence Experience.
 *
 * Implements the architecture-first intelligence paradigm:
 * 1. Hero: One-sentence architectural synthesis communicating how infrastructure is put together
 * 2. Centerpiece Visual: Request Path & Ingress Topology Visualizer with interactive hop inspector
 * 3. Architectural Boundaries: Explicit distinction between observed ingress and sealed perimeter
 * 4. Observed Components: Categorized by architectural layer and role with progressive disclosure
 * 5. What Matters Now: Quiet, reassuring stability state or prioritized change alert
 *
 * Anti-overreach Invariants:
 * - Architecture before inventory (0 generic 4-card dashboard strips)
 * - Honest perimeter semantics (0 "Unknown" or "Failed" for sealed components)
 * - Quiet confidence indicators (no screaming badges)
 * - Contextual security attachment
 * - 0 hardcoded technology branching
 */
export const InfrastructureOverview: React.FC<InfrastructureOverviewProps> = ({
  domainId,
  domainName,
  initialData,
  onViewSnapshot,
  onViewFinding,
  onViewAllFindings,
  onNavigateToChanges,
  onNavigateToFindings,
  className = '',
  ...rest
}) => {
  const overviewQuery = useDomainOverview(initialData ? null : domainId);
  const domainJobsQuery = useDomainUnderstandingJobs(initialData ? null : domainId);
  const data = initialData || overviewQuery.data;

  const activeJob = findActiveJob(domainJobsQuery.data);
  const isUnderstanding = Boolean(activeJob);

  const state = resolveOverviewState({
    data,
    isLoading: !initialData && overviewQuery.isLoading,
    isError: !initialData && overviewQuery.isError,
    isDomainMismatch: Boolean(data && data.domain && data.domain.id !== domainId),
    isUnderstanding,
  });

  // 1. Loading State (Only when no prior data exists)
  if (state === 'LOADING' && !data) {
    return (
      <div className={`w-full py-16 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving architectural model..."
          description="Synthesizing ingress topology, boundary isolation, and verified components"
        />
      </div>
    );
  }

  // 2. Understanding in Progress State (Only when no prior data exists)
  if (state === 'UNDERSTANDING' && !data) {
    return (
      <div className={`w-full py-16 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Understanding architecture…"
          description={`Discovering perimeter topology, ingress hops, and security boundaries for ${domainName}`}
        />
      </div>
    );
  }

  // 3. Unauthorized / Cross-domain State
  if (state === 'UNAVAILABLE') {
    return (
      <div className={`w-full py-12 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested domain infrastructure does not belong to the active workspace."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </div>
      </div>
    );
  }

  // 4. Error State
  if ((state === 'ERROR' || !data) && !overviewQuery.isLoading) {
    return (
      <div className={`w-full py-12 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <ErrorState
            error={overviewQuery.error}
            title="Architecture Model Retrieval Failed"
            description={`Could not retrieve authoritative infrastructure intelligence for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => overviewQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  // 5. Empty State / No Understanding
  if (state === 'EMPTY' && !data) {
    return (
      <div className={`w-full py-12 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl p-10 rounded-2xl border border-border-hairline bg-[#FFFFFF] dark:bg-card text-center space-y-4 shadow-[0_1px_3px_rgba(16,24,20,0.04)]">
          <Cluster gap="xs" align="center" justify="center">
            <Icon icon={Layers} size="small" className="text-[#3568C8]" />
            <Eyebrow variant="muted" className="text-xs font-mono uppercase tracking-wider">
              INFRASTRUCTURE ARCHITECTURE
            </Eyebrow>
          </Cluster>
          <div className="space-y-2">
            <Display className="text-2xl font-medium text-foreground">
              Architecture hasn't been understood yet.
            </Display>
            <BodySmall variant="muted" className="max-w-md mx-auto leading-relaxed">
              Run understanding to discover the ingress pathway, gateway routing, and perimeter boundaries for {domainName}.
            </BodySmall>
          </div>
          <div className="pt-3 flex justify-center">
            <UnderstandNowButton
              domainId={domainId}
              domainName={domainName}
            />
          </div>
        </div>
      </div>
    );
  }

  const { latestSnapshot } = data;
  const observedTimestamp = (latestSnapshot as any)?.capturedAt || latestSnapshot?.createdAt;
  const adaptiveModel = resolveAdaptiveInfrastructureModel(domainId, domainName, data);

  // WX-4XX Section 5: Natural language architectural synthesis
  const heroSummary = synthesizeArchitecturalHeroSummary(adaptiveModel, data);
  const boundaries = resolveArchitecturalBoundaries(adaptiveModel, data);

  const formattedObservedTime = observedTimestamp
    ? new Date(observedTimestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div
      className={`w-full space-y-8 ${className}`}
      data-testid="infrastructure-overview-container"
      {...rest}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* 1. ARCHITECTURE HERO: 1-Sentence Synthesis & Posture Context           */}
      {/* ---------------------------------------------------------------------- */}
      <div
        className="w-full p-6 lg:p-8 rounded-2xl border border-[#E1E1DC] dark:border-border bg-gradient-to-b from-[#FFFFFF] to-[#FBFBF9] dark:from-card dark:to-surface-secondary/40 shadow-[0_1px_3px_rgba(16,24,20,0.035)] space-y-5"
        data-testid="infrastructure-architecture-hero"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon icon={Layers} size="small" className="text-[#3568C8]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#3568C8]">
                CURRENT ARCHITECTURE
              </span>
              <span className="text-[#80837E] dark:text-muted-foreground font-mono text-xs">·</span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {domainName}
              </span>
            </div>

            {/* Architectural Flow Heading */}
            <h1
              className="text-xl sm:text-2xl lg:text-3xl font-display font-medium text-foreground tracking-tight"
              data-testid="architecture-hero-headline"
            >
              {heroSummary.headline}
            </h1>

            {/* 1-Sentence Natural Language Architectural Synthesis */}
            <p
              className="text-sm sm:text-base text-[#5F625F] dark:text-muted-foreground leading-relaxed font-sans max-w-4xl m-0 pt-0.5"
              data-testid="architecture-hero-narrative"
            >
              {heroSummary.narrative}
            </p>
          </div>

          {/* Action & Status Header Controls */}
          <div className="flex items-center gap-3 flex-wrap lg:self-start shrink-0">
            {isUnderstanding ? (
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase font-medium tracking-wider px-2.5 py-1 rounded-lg border border-[#C8D8F6] text-[#3568C8] bg-[#EEF4FF] animate-pulse"
                data-testid="infrastructure-updating-badge"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3568C8] animate-ping" />
                UPDATING MODEL…
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase font-medium tracking-wider px-2.5 py-1 rounded-lg border border-[#B9E5D6] dark:border-emerald-800/40 text-[#178A68] dark:text-emerald-400 bg-[#EAF7F2] dark:bg-emerald-950/20"
                data-testid="infrastructure-current-state-badge"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#178A68] dark:text-emerald-400" />
                ACTIVE ARCHITECTURE
              </span>
            )}

            {latestSnapshot && onViewSnapshot && (
              <button
                type="button"
                onClick={() => onViewSnapshot(latestSnapshot.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary text-xs text-foreground hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata font-mono font-medium transition-colors cursor-pointer group select-none"
                data-testid="infrastructure-snapshot-btn"
              >
                <span>Snapshot: {latestSnapshot.id.slice(0, 8)}...</span>
                <Icon
                  icon={ArrowUpRight}
                  size="small"
                  className="text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </button>
            )}

            <UnderstandNowButton
              domainId={domainId}
              domainName={domainName}
            />
          </div>
        </div>

        {/* Hero Bottom Line Metadata */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Currently understood</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 inline text-muted-foreground" />
              Observed: {formattedObservedTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              Detection model: <strong className="text-foreground font-mono">Ingress Boundary Intelligence</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CENTERPIECE VISUAL: Ingress Architecture & Request Path Visualizer   */}
      {/* ---------------------------------------------------------------------- */}
      {adaptiveModel.hasObservedInfrastructure && (
        <section
          className="w-full space-y-3"
          data-testid="ingress-architecture-section"
          aria-label="Ingress Architecture"
        >
          <div className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
            <div className="space-y-0.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
                REQUEST PATH
              </span>
              <h2 className="text-base font-medium text-foreground">
                Ingress Architecture & Hop Inspection
              </h2>
            </div>
            <p className="text-xs font-mono text-muted-foreground m-0">
              Select any hop to inspect role, observed behavior, and detection boundaries
            </p>
          </div>

          <IngressTopologyVisualizer
            model={adaptiveModel}
            onViewFinding={onViewFinding}
          />
        </section>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. ARCHITECTURAL BOUNDARIES: What is Observed vs Protected Core        */}
      {/* ---------------------------------------------------------------------- */}
      <section
        className="w-full space-y-3"
        data-testid="architectural-boundaries-section"
        aria-label="Architectural Boundaries"
      >
        <ArchitecturalBoundariesCard
          boundaries={boundaries}
        />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. OBSERVED ARCHITECTURAL COMPONENTS (Grouped by Layer)                */}
      {/* ---------------------------------------------------------------------- */}
      <section
        className="w-full space-y-3"
        data-testid="observed-components-section"
        aria-label="Observed Components"
      >
        <AdaptiveInfrastructureGrid
          model={adaptiveModel}
          onViewFinding={onViewFinding}
          showTopology={false}
          showSummary={false}
        />
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. WHAT MATTERS NOW: Contextual Intelligence & Stability Reassurance   */}
      {/* ---------------------------------------------------------------------- */}
      <section
        className="w-full"
        data-testid="what-matters-container"
        aria-label="What Matters Now"
      >
        <WhatMattersSection
          data={data}
          onNavigateToChanges={onNavigateToChanges}
          onNavigateToFindings={onNavigateToFindings || onViewAllFindings}
        />
      </section>
    </div>
  );
};

InfrastructureOverview.displayName = 'InfrastructureOverview';
