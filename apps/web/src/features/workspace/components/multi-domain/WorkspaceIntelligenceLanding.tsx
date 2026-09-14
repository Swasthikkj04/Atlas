import React, { useState } from 'react';
import { Clock, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { ReadingSurface, Stack } from '../../../../components/layout';
import { useDomains } from '../../../../hooks/queries/useDomains';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { resolveMultiDomainBrief } from '../../contracts/multi-domain-brief.contract';
import { resolveMultiDomainArchitectureMatrix } from '../../contracts/multi-domain-matrix.contract';
import { MultiDomainHero } from './MultiDomainHero';
import { MonitoredInfrastructureList } from './MonitoredInfrastructureList';
import { CrossDomainWhatChanged } from './CrossDomainWhatChanged';
import { MultiDomainArchitectureMatrix } from './MultiDomainArchitectureMatrix';
import type { WorkspaceIntelligenceLandingProps } from './WorkspaceIntelligenceLanding.types';

/**
 * Authoritative Workspace Return Intelligence Surface (WX-O-01 / WX-1025 / Move 5).
 *
 * Implements the return briefing & architecture matrix:
 * - Answers: "What changed across my monitored domains since I was last here?"
 * - Dominant intelligence surface: WHAT CHANGED ACROSS DOMAINS
 * - Unmistakable single-domain investigation affordances
 * - Preserves Move 5 Multi-Domain Architecture Matrix
 */
export const WorkspaceIntelligenceLanding: React.FC<WorkspaceIntelligenceLandingProps> = ({
  onSelectDomain,
  onAddDomain,
  onInvestigateChange,
  onViewDomainChanges,
  onViewInfrastructureMemory,
  initialBrief,
  domains: propDomains,
  domainOverviews = [],
  initialMatrixData,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MATRIX'>('OVERVIEW');
  const domainsQuery = useDomains();
  const timelineQuery = useTimeline({ limit: 20 });

  const activeDomains = propDomains || domainsQuery.data || [];
  const timelineEvents = timelineQuery.data?.data || [];

  const brief =
    initialBrief ||
    resolveMultiDomainBrief({
      domains: activeDomains,
      timelineEvents,
    });

  const matrixData =
    initialMatrixData ||
    resolveMultiDomainArchitectureMatrix(activeDomains, domainOverviews);

  const handleReviewChangesScroll = () => {
    const el = document.getElementById('cross-domain-changes-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (brief.crossDomainChanges.length > 0) {
      const firstChange = brief.crossDomainChanges[0];
      onSelectDomain(firstChange.domainId);
    }
  };

  return (
    <div
      className={`w-full py-6 sm:py-10 flex flex-col items-center ${className}`}
      data-testid="workspace-intelligence-landing"
    >
      <ReadingSurface>
        <Stack gap="2xl" className="w-full">
          {/* 1. Return Briefing Hero with Attention State & Orientation */}
          <MultiDomainHero
            brief={brief}
            onReviewChanges={handleReviewChangesScroll}
            onAddDomain={onAddDomain}
          />

          {/* View Mode Switcher (When domains exist) */}
          {brief.totalDomains > 0 && (
            <div className="w-full flex items-center justify-between border-b border-[#E1E1DC] dark:border-border pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeTab === 'OVERVIEW'
                      ? 'bg-[#121514] text-white dark:bg-[#FFFFFF] dark:text-[#121514] font-medium shadow-xs'
                      : 'text-[#5F625F] dark:text-muted-foreground hover:bg-[#FAFAF8] dark:hover:bg-surface-secondary'
                  }`}
                  data-testid="landing-tab-overview"
                >
                  <Icon icon={List} size="small" />
                  <span>Return Briefing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('MATRIX')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeTab === 'MATRIX'
                      ? 'bg-[#121514] text-white dark:bg-[#FFFFFF] dark:text-[#121514] font-medium shadow-xs'
                      : 'text-[#5F625F] dark:text-muted-foreground hover:bg-[#FAFAF8] dark:hover:bg-surface-secondary'
                  }`}
                  data-testid="landing-tab-matrix"
                >
                  <Icon icon={LayoutGrid} size="small" />
                  <span>Architecture Matrix (Move 5)</span>
                </button>
              </div>

              <div className="hidden sm:block text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                {brief.totalDomains} monitored {brief.totalDomains === 1 ? 'target' : 'targets'}
              </div>
            </div>
          )}

          {activeTab === 'OVERVIEW' ? (
            <>
              {/* 2. Dominant Return Intelligence Surface: What Changed Across Domains */}
              <div id="cross-domain-changes-anchor" className="w-full">
                <CrossDomainWhatChanged
                  brief={brief}
                  onInvestigateChange={onInvestigateChange}
                  onViewDomainChanges={onViewDomainChanges}
                />
              </div>

              {/* 3. Domain Investigation Selection: Monitored Perimeters */}
              <MonitoredInfrastructureList
                brief={brief}
                onSelectDomain={onSelectDomain}
                onAddDomain={onAddDomain}
              />
            </>
          ) : (
            /* 4. Move 5 Multi-Domain Architecture Matrix & Ingress Comparison */
            <MultiDomainArchitectureMatrix
              matrixData={matrixData}
              onSelectDomain={onSelectDomain}
            />
          )}

          {/* 5. Infrastructure Memory Evolution Anchor */}
          {brief.totalDomains > 0 && onViewInfrastructureMemory && (
            <div
              className="p-4 sm:p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary flex items-center justify-between gap-4 text-xs font-mono text-[#5F625F] dark:text-muted-foreground"
              data-testid="cross-domain-memory-footer"
            >
              <div className="flex items-center gap-2.5">
                <Icon icon={Clock} size="small" className="text-[#5F625F]/70 dark:text-muted-foreground/70" />
                <span className="font-medium text-foreground">
                  Infrastructure memory
                </span>
                <span className="hidden sm:inline text-[#5F625F]/50">&bull;</span>
                <span className="hidden sm:inline">
                  View how your infrastructure has evolved across verified snapshots
                </span>
              </div>

              <button
                type="button"
                onClick={() => onViewInfrastructureMemory(brief.domains[0]?.domainId)}
                className="inline-flex items-center gap-1 text-[#3568C8] hover:underline font-medium cursor-pointer transition-colors shrink-0"
                data-testid="view-infrastructure-memory-button"
              >
                <span>View memory</span>
                <Icon icon={ArrowRight} size="small" />
              </button>
            </div>
          )}
        </Stack>
      </ReadingSurface>
    </div>
  );
};

WorkspaceIntelligenceLanding.displayName = 'WorkspaceIntelligenceLanding';
