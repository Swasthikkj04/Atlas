import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Body } from '../../../../components/typography';
import { ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState } from '../../../../components/states';
import { ExecutiveBrief } from '../brief';
import { PrimaryStory, SecondaryStories } from '../story';
import { CompactInfrastructureOverview } from '../overview/CompactInfrastructureOverview';
import { useWorkspaceOverview } from '../../../../hooks/queries/useWorkspace';
import type { CurrentIntelligenceProps } from './CurrentIntelligence.types';

/**
 * Authoritative Current Intelligence Layer (WX-210-R2 / WX-500-SHELL-04 / WX-910).
 *
 * Implements the canonical Primary Workspace intelligence structure:
 * - Central Question: "What is happening? What matters right now?"
 * - Executive Brief (authoritative executive summary & signals)
 * - Dominant Primary Story ("WHAT MATTERS NOW") followed by Secondary Intelligence ("OTHER THINGS WORTH KNOWING")
 * - Quiet State: "Nothing requires your attention right now." with stable infrastructure reassurance
 * - Restrained Contextual Destinations: Infrastructure Overview → and Infrastructure Memory →
 * - Infrastructure Inventory is cleanly isolated in the dedicated /workspace/infrastructure experience.
 */
export const CurrentIntelligence: React.FC<CurrentIntelligenceProps> = ({
  domainId,
  domainName,
  onInvestigate,
  onViewEvidence,
  onViewOverview,
  onViewMemory,
  className = '',
}) => {
  const overviewQuery = useWorkspaceOverview(domainId);
  const isLoading = overviewQuery.isLoading;
  const error = overviewQuery.error;
  const overview = overviewQuery.data;

  const executiveBrief = overview?.executiveBrief;
  const primaryStory = overview?.primaryStory;

  // Canonical Identity Deduplication & Primary Exclusion (defense-in-depth)
  const secondaryStories = React.useMemo(() => {
    const raw = overview?.secondaryStories || [];
    const seen = new Set<string>();
    const result = [];
    const primaryKey = primaryStory?.id ? `FINDING:${primaryStory.id}` : null;
    const primaryRuleKey = (primaryStory as any)?.ruleId
      ? `FINDING:rule:${(primaryStory as any).ruleId}`
      : null;
    const primaryCanonicalKey =
      primaryStory?.category && primaryStory?.title
        ? `FINDING:${primaryStory.category}:${primaryStory.title.trim().toLowerCase()}`
        : null;

    for (const story of raw) {
      if (!story || !story.id) continue;
      const key = `FINDING:${story.id}`;
      const ruleKey = (story as any).ruleId
        ? `FINDING:rule:${(story as any).ruleId}`
        : null;
      const canonicalKey =
        story.category && story.title
          ? `FINDING:${story.category}:${story.title.trim().toLowerCase()}`
          : null;

      // 1. Primary Exclusion
      if (primaryKey && key === primaryKey) continue;
      if (primaryRuleKey && ruleKey && ruleKey === primaryRuleKey) continue;
      if (primaryCanonicalKey && canonicalKey && canonicalKey === primaryCanonicalKey) continue;

      // 2. Identity Deduplication
      if (seen.has(key)) continue;
      if (ruleKey && seen.has(ruleKey)) continue;
      if (canonicalKey && seen.has(canonicalKey)) continue;

      seen.add(key);
      if (ruleKey) seen.add(ruleKey);
      if (canonicalKey) seen.add(canonicalKey);
      result.push(story);
    }
    return result;
  }, [overview?.secondaryStories, primaryStory]);

  const hasStories = Boolean(primaryStory) || secondaryStories.length > 0;
  const hasBrief = Boolean(executiveBrief?.executiveSummary);

  // 1. Loading / First-Run State
  if (isLoading && !overview) {
    return (
      <Section className={`w-full py-10 ${className}`} aria-label="Current Intelligence Loading">
        <ReadingSurface>
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <LoadingState
              label="Understanding this infrastructure."
              description="Nebula is establishing its first infrastructure baseline."
            />
          </div>
        </ReadingSurface>
      </Section>
    );
  }

  // 2. Consolidated Failure State
  if (error && !overview) {
    return (
      <Section className={`w-full py-8 ${className}`} aria-label="Current Intelligence Error">
        <ReadingSurface>
          <div
            className="bg-surface-elevated border border-border-hairline rounded-xl p-6 sm:p-8 space-y-4"
            data-testid="consolidated-intelligence-error"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-text-primary font-display">
                We couldn't retrieve the latest understanding for {domainName}.
              </h3>
              <Body className="text-sm text-text-secondary max-w-xl leading-relaxed">
                Nebula couldn't establish the current infrastructure intelligence.
              </Body>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => overviewQuery.refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-base border border-border-hairline hover:border-border-strong text-xs font-medium text-text-primary transition-all cursor-pointer focus-ring"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </ReadingSurface>
      </Section>
    );
  }

  // 3. Quiet State (Silence is a valid product state when stable)
  if (!hasStories && !hasBrief) {
    return (
      <Section className={`w-full py-8 ${className}`} aria-label="Current Infrastructure Intelligence">
        <ReadingSurface>
          <div
            className="bg-surface-elevated border border-border-hairline rounded-xl p-7 sm:p-9 space-y-6"
            data-testid="quiet-intelligence-state"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-normal text-text-primary font-display">
                Nothing requires your attention right now.
              </h3>
              <Body className="text-sm text-text-secondary max-w-xl leading-relaxed">
                Infrastructure has remained stable across recent observations.
              </Body>
            </div>

            {/* Contextual Destinations */}
            <div className="pt-6 border-t border-border-hairline flex flex-wrap items-center gap-6">
              {onViewOverview && (
                <button
                  type="button"
                  onClick={onViewOverview}
                  className="inline-flex items-center gap-2 text-xs font-medium text-text-primary hover:text-primary transition-colors cursor-pointer focus-ring"
                >
                  <span>Infrastructure Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onViewMemory && (
                <button
                  type="button"
                  onClick={onViewMemory}
                  className="inline-flex items-center gap-2 text-xs font-medium text-text-primary hover:text-primary transition-colors cursor-pointer focus-ring"
                >
                  <span>Infrastructure Memory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </ReadingSurface>
      </Section>
    );
  }

  // 4. Authoritative Current Intelligence: Executive Brief + Infrastructure Overview (Top Grid) + Stories
  return (
    <div className={`space-y-7 sm:space-y-8 ${className}`} data-testid="current-intelligence-content">
      {/* 4A. Authoritative Top Grid: Executive Brief + Infrastructure Overview (WX-914) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Executive Brief */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col h-full">
          {executiveBrief ? (
            <ExecutiveBrief
              domainId={domainId}
              domainName={domainName}
              initialBrief={executiveBrief}
              onSelectHighlight={onInvestigate}
              className="h-full"
            />
          ) : (
            <ExecutiveBrief
              domainId={domainId}
              domainName={domainName}
              onSelectHighlight={onInvestigate}
              className="h-full"
            />
          )}
        </div>

        {/* Right Column: Compact Infrastructure Overview */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col h-full">
          <CompactInfrastructureOverview
            domainId={domainId}
            domainName={domainName}
            onViewFullInfrastructure={onViewOverview}
            className="h-full"
          />
        </div>
      </div>

      {/* 4B. Dominant Primary Story ("WHAT MATTERS NOW") */}
      {primaryStory && (
        <div className="space-y-2.5 pt-1">
          <div className="px-1">
            <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-muted-foreground/80">
              WHAT MATTERS NOW
            </span>
          </div>
          <PrimaryStory
            domainId={domainId}
            domainName={domainName}
            story={primaryStory}
            onInvestigate={onInvestigate}
            onViewEvidence={onViewEvidence}
          />
        </div>
      )}

      {/* 4C. Supporting Secondary Intelligence ("OTHER THINGS WORTH KNOWING") */}
      {secondaryStories.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-border-hairline">
          <div className="px-1">
            <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-muted-foreground/80">
              OTHER THINGS WORTH KNOWING
            </span>
          </div>
          <SecondaryStories
            domainId={domainId}
            domainName={domainName}
            stories={secondaryStories}
            onInvestigate={onInvestigate}
            onViewEvidence={onViewEvidence}
          />
        </div>
      )}

      {/* Contextual Destinations Footer in Canvas */}
      <div className="pt-6 border-t border-border-hairline flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {onViewOverview && (
            <button
              type="button"
              onClick={onViewOverview}
              className="inline-flex items-center gap-2 text-xs font-medium text-text-primary hover:text-primary transition-colors cursor-pointer focus-ring"
            >
              <span>Infrastructure Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onViewMemory && (
            <button
              type="button"
              onClick={onViewMemory}
              className="inline-flex items-center gap-2 text-xs font-medium text-text-primary hover:text-primary transition-colors cursor-pointer focus-ring"
            >
              <span>Infrastructure Memory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

CurrentIntelligence.displayName = 'CurrentIntelligence';
