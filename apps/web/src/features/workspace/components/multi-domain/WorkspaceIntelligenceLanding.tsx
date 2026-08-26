import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { ReadingSurface, Stack } from '../../../../components/layout';
import { useDomains } from '../../../../hooks/queries/useDomains';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import { resolveMultiDomainBrief } from '../../contracts/multi-domain-brief.contract';
import { MultiDomainHero } from './MultiDomainHero';
import { MonitoredInfrastructureList } from './MonitoredInfrastructureList';
import { CrossDomainWhatChanged } from './CrossDomainWhatChanged';
import type { WorkspaceIntelligenceLandingProps } from './WorkspaceIntelligenceLanding.types';

/**
 * Authoritative Workspace Intelligence Landing & Multi-Domain Brief (WX-1025).
 *
 * Implements the cross-domain intelligence briefing:
 * - Answers: "What does Nebula know about all of my infrastructure right now?"
 * - Aggregates cross-domain posture without automatically opening a single domain
 * - Gives user clear intelligence to choose where to investigate
 * - Consumes canonical backend snapshots and timeline events
 */
export const WorkspaceIntelligenceLanding: React.FC<WorkspaceIntelligenceLandingProps> = ({
  onSelectDomain,
  onAddDomain,
  onInvestigateChange,
  onViewDomainChanges,
  onViewInfrastructureMemory,
  initialBrief,
  domains: propDomains,
  className = '',
}) => {
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
          {/* 1. Briefing Hero with Primary Intelligence State */}
          <MultiDomainHero
            brief={brief}
            onReviewChanges={handleReviewChangesScroll}
            onAddDomain={onAddDomain}
          />

          {/* 2. Cross-Domain "What Changed" Section (When Changes Exist) */}
          {brief.crossDomainChanges.length > 0 && (
            <div id="cross-domain-changes-anchor" className="w-full">
              <CrossDomainWhatChanged
                brief={brief}
                onInvestigateChange={onInvestigateChange}
                onViewDomainChanges={onViewDomainChanges}
              />
            </div>
          )}

          {/* 3. Monitored Infrastructure List */}
          <MonitoredInfrastructureList
            brief={brief}
            onSelectDomain={onSelectDomain}
            onAddDomain={onAddDomain}
          />

          {/* 4. Infrastructure Memory Evolution Anchor */}
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
