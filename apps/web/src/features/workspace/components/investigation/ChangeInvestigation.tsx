import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  GitCommit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  Body,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, Grid, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useTimelineEvent } from '../../../../hooks/queries/useTimeline';
import { resolveChangeMeaningHierarchy } from '../../contracts/investigation-hierarchy.contract';
import { DomainFavicon } from '../identity';
import type { ChangeInvestigationProps } from './ChangeInvestigation.types';
import type { ChangeSeverity } from '../../../../types/api';

const severityColorMap: Record<ChangeSeverity, { text: string; bg: string; border: string }> = {
  CRITICAL: {
    text: 'text-[#A93442]',
    bg: 'bg-[#FDEBEC]',
    border: 'border-[#E9B3B9]',
  },
  HIGH: {
    text: 'text-[#C24D57]',
    bg: 'bg-[#FFF0F1]',
    border: 'border-[#F0C3C7]',
  },
  MEDIUM: {
    text: 'text-[#B86F18]',
    bg: 'bg-[#FFF4E3]',
    border: 'border-[#F0D3A5]',
  },
  LOW: {
    text: 'text-[#3568C8]',
    bg: 'bg-[#EEF4FF]',
    border: 'border-[#C8D8F6]',
  },
  INFORMATIONAL: {
    text: 'text-[#3568C8]',
    bg: 'bg-[#EEF4FF]',
    border: 'border-[#C8D8F6]',
  },
};

/**
 * Authoritative Change Investigation Experience (WX-303 / WX-1017 / WX-1019).
 *
 * Canonical Information Hierarchy:
 * 1. HERO: Change Title, Category & Severity badge, Factual Summary, Subordinate snapshot line.
 * 2. WHAT HAPPENED: First substantive section explaining what changed.
 * 3. WHY IT MATTERS: High-hierarchy significance & impact analysis before technical evidence.
 * 4. WHAT THIS MEANS: Compact structured breakdown (Domain, Change Type, Transition State).
 * 5. OBSERVED EVIDENCE: Technical proof layer (Authoritative Previous vs Current State).
 * 6. HOW NEBULA KNOWS: Progressively disclosed verification details ("View verification chain →").
 * 7. VERIFIED CONTEXT: Restrained snapshot context footer.
 */
export const ChangeInvestigation: React.FC<ChangeInvestigationProps> = ({
  domainId,
  domainName,
  changeId,
  initialChange,
  onReturn,
  onViewPreviousSnapshot,
  onViewCurrentSnapshot,
  onViewFinding,
  onViewEvidence,
  onViewHistoricalContext,
  className = '',
  ...rest
}) => {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const changeQuery = useTimelineEvent(initialChange ? null : changeId);

  const change = initialChange || changeQuery.data;
  const isLoading = !initialChange && changeQuery.isLoading;
  const error = changeQuery.error;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Loading change investigation..."
          description="Retrieving authoritative previous and current state transitions"
        />
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error && !change) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Change Record Not Found"
            description={`Could not retrieve change event ${changeId} for domain ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => changeQuery.refetch()}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Domain Mismatch Security Guard (P0 Security Invariant)
  if (change && change.domainId && change.domainId !== domainId) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested change event does not belong to the active workspace domain."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  if (!change) {
    return null;
  }

  const hierarchy = resolveChangeMeaningHierarchy({
    change,
    domainName,
  });

  const sevTokens =
    severityColorMap[change.severity as ChangeSeverity] || severityColorMap.INFORMATIONAL;

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest}>
      {/* 1. Return Navigation Action */}
      <Cluster justify="between" align="center" gap="md">
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-[#5F625F] dark:text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <Icon
              icon={ArrowLeft}
              size="small"
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Back to Intelligence Overview</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <DomainFavicon domain={domainName} size="compact" />
          <TechnicalSmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
            {domainName} &bull; Change: {change.id.slice(0, 12)}…
          </TechnicalSmall>
        </div>
      </Cluster>

      {/* 2. Hero Header: Meaning before mechanics (WX-1019) */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster justify="between" align="center" gap="sm">
            <Cluster gap="xs" align="center">
              <Icon icon={GitCommit} size="small" className={sevTokens.text} />
              <Eyebrow
                variant="muted"
                className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#5F625F] dark:text-muted-foreground"
              >
                {hierarchy.hero.severity} &bull; {hierarchy.hero.changeType}
              </Eyebrow>
            </Cluster>

            <span
              className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
            >
              {change.severity}
            </span>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            {hierarchy.hero.title}
          </Display>

          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
            {hierarchy.hero.subtitle}
          </p>

          <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground pt-0.5" data-testid="change-subordinate-verification-line">
            Detected {hierarchy.hero.detectedDateFormatted}
            {hierarchy.hero.snapshotShortId && (
              <>
                {' '}&bull; Verified against snapshot{' '}
                <span className="font-medium text-foreground/90">{hierarchy.hero.snapshotShortId}</span>
              </>
            )}
          </p>
        </Stack>
      </ReadingSurface>

      {/* 3. Primary Investigation Surface: Structured Meaning & Evidence (WX-1019) */}
      <ReadingSurface>
        <div
          className="p-6 sm:p-8 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-6"
          data-testid="change-meaning-surface"
        >
          {/* Section A: WHAT HAPPENED */}
          <Stack gap="xs" data-testid="section-what-happened">
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              WHAT HAPPENED
            </SectionTitle>
            <Body className="text-sm sm:text-base leading-relaxed text-foreground font-serif">
              {hierarchy.whatHappened.explanation}
            </Body>
          </Stack>

          {/* Section B: WHY IT MATTERS — THE MOST IMPORTANT CHANGE (WX-1019) */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-why-it-matters"
          >
            <Cluster justify="between" align="center" gap="sm">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                WHY IT MATTERS
              </SectionTitle>
              <span
                className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
                data-testid="change-impact-badge"
              >
                IMPACT: {hierarchy.whyItMatters.impactLevel}
              </span>
            </Cluster>
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 font-normal">
              {hierarchy.whyItMatters.significance}
            </p>
          </div>

          {/* Section C: WHAT THIS MEANS */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-what-this-means"
          >
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              WHAT THIS MEANS
            </SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                  Domain
                </span>
                <p className="text-foreground font-medium truncate">{hierarchy.whatThisMeans.domain}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                  Change Type
                </span>
                <p className="text-foreground font-medium truncate">{hierarchy.whatThisMeans.changeType}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                  Transition Status
                </span>
                <p className="text-foreground font-medium truncate">{hierarchy.whatThisMeans.transitionState}</p>
              </div>
            </div>

            {/* Derived Detailed Comparison Metrics (WX-1024) */}
            {hierarchy.derivedSummary && (
              <div
                className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono"
                data-testid="derived-policy-summary"
              >
                {hierarchy.derivedSummary.directives && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                      Policy directives
                    </span>
                    <span className="font-medium text-foreground">
                      {hierarchy.derivedSummary.directives.previous} &rarr; {hierarchy.derivedSummary.directives.current}
                    </span>
                  </div>
                )}
                {hierarchy.derivedSummary.allowedSources && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                      Allowed sources
                    </span>
                    <span className="font-medium text-foreground">
                      {hierarchy.derivedSummary.allowedSources}
                    </span>
                  </div>
                )}
                {hierarchy.derivedSummary.browserRestrictions && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                      Browser restrictions
                    </span>
                    <span className="font-medium text-foreground">
                      {hierarchy.derivedSummary.browserRestrictions}
                    </span>
                  </div>
                )}
                {hierarchy.derivedSummary.overallPosture && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                      Overall posture
                    </span>
                    <span className="font-medium text-[#178A68]">
                      {hierarchy.derivedSummary.overallPosture}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Anti-Overclaiming Boundaries: What this establishes vs What this does not establish (WX-1024) */}
            {(hierarchy.whatThisEstablishes || hierarchy.whatNebulaDoesNotProve) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {hierarchy.whatThisEstablishes && (
                  <div
                    className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-1"
                    data-testid="section-what-this-establishes"
                  >
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#178A68] block">
                      {hierarchy.whatThisEstablishes.title}
                    </span>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                      {hierarchy.whatThisEstablishes.description}
                    </p>
                  </div>
                )}

                {hierarchy.whatNebulaDoesNotProve && (
                  <div
                    className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-1"
                    data-testid="section-what-this-does-not-establish"
                  >
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                      {hierarchy.whatNebulaDoesNotProve.title}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      {hierarchy.whatNebulaDoesNotProve.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section D: OBSERVED EVIDENCE (Authoritative State Transition) */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-observed-evidence"
          >
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              OBSERVED EVIDENCE
            </SectionTitle>

            <Grid cols={2} gap="md">
              {/* Previous State */}
              <div className="p-4 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary space-y-2.5">
                <Cluster justify="between" align="center" gap="xs">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                    Previous State
                  </span>
                  {change.previousSnapshotId && (
                    <TechnicalSmall variant="muted" className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                      Snap: {change.previousSnapshotId.slice(0, 8)}…
                    </TechnicalSmall>
                  )}
                </Cluster>

                <div className="p-3 bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border rounded-lg">
                  {hierarchy.observedEvidence.previousValue ? (
                    <pre className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground whitespace-pre-wrap break-all leading-relaxed m-0">
                      {hierarchy.observedEvidence.previousValue}
                    </pre>
                  ) : (
                    <span className="italic text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
                      No prior state recorded (initial baseline)
                    </span>
                  )}
                </div>

                {change.previousSnapshotId && onViewPreviousSnapshot && (
                  <button
                    type="button"
                    onClick={() => onViewPreviousSnapshot(change.previousSnapshotId!)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                  >
                    <span>View Previous Snapshot</span>
                    <Icon icon={ArrowUpRight} size="small" />
                  </button>
                )}
              </div>

              {/* Current State */}
              <div className="p-4 rounded-xl border border-[#DCDCD7] dark:border-border-strong bg-[#FFFFFF] dark:bg-card space-y-2.5 shadow-[0_1px_2px_rgba(16,24,20,0.035)]">
                <Cluster justify="between" align="center" gap="xs">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Current State
                  </span>
                  {change.snapshotId && (
                    <TechnicalSmall variant="muted" className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                      Snap: {change.snapshotId.slice(0, 8)}…
                    </TechnicalSmall>
                  )}
                </Cluster>

                <div className="p-3 bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg">
                  {hierarchy.observedEvidence.currentValue ? (
                    <pre className="font-mono text-xs text-foreground font-medium whitespace-pre-wrap break-all leading-relaxed m-0">
                      {hierarchy.observedEvidence.currentValue}
                    </pre>
                  ) : (
                    <span className="italic text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
                      No active state (component removed)
                    </span>
                  )}
                </div>

                {change.snapshotId && onViewCurrentSnapshot && (
                  <button
                    type="button"
                    onClick={() => onViewCurrentSnapshot(change.snapshotId!)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                  >
                    <span>View Current Snapshot</span>
                    <Icon icon={ArrowUpRight} size="small" />
                  </button>
                )}
              </div>
            </Grid>
          </div>

          {/* Section E: HOW NEBULA KNOWS (Progressively Disclosed Verification Details) */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-how-nebula-knows"
          >
            <div className="flex items-center justify-between gap-4">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                HOW NEBULA KNOWS
              </SectionTitle>

              <button
                type="button"
                onClick={() => setIsVerificationOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                data-testid="toggle-verification-details"
              >
                <span>{isVerificationOpen ? 'Hide verification details' : 'View verification chain →'}</span>
                <Icon icon={isVerificationOpen ? ChevronUp : ChevronDown} size="small" />
              </button>
            </div>

            {isVerificationOpen && (
              <div className="space-y-2 pt-1" data-testid="verification-chain-details">
                {hierarchy.howNebulaKnows.map((item, idx) => (
                  <div
                    key={`${item.step}-${idx}`}
                    className="p-2.5 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border flex items-start gap-2.5"
                  >
                    <Icon icon={CheckCircle2} size="small" className="text-[#178A68] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <Cluster justify="between" align="center" gap="sm">
                        <span className="text-xs font-medium text-foreground">{item.step}</span>
                        {item.timestamp && !isNaN(new Date(item.timestamp).getTime()) && (
                          <span className="text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        )}
                      </Cluster>
                      {item.description && (
                        <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground leading-normal font-mono break-all">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ReadingSurface>

      {/* 4. Section: VERIFIED CONTEXT (Restrained Snapshot Context Footer) */}
      <Section spacing="none" className="pt-1" data-testid="section-verified-context">
        <ReadingSurface>
          <div className="p-4 sm:p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
            <div className="flex items-center gap-3">
              <DomainFavicon
                domain={hierarchy.verifiedContext.domain}
                size="secondary"
              />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                  VERIFIED CONTEXT
                </span>
                <p className="text-foreground">
                  Domain: {hierarchy.verifiedContext.domain} &bull; Detected: {hierarchy.verifiedContext.detectedAt}
                </p>
                {hierarchy.verifiedContext.snapshotId && (
                  <p>Snapshot: {hierarchy.verifiedContext.snapshotId}</p>
                )}
              </div>
            </div>

            <Cluster gap="sm" align="center" className="flex-wrap">
              {onViewEvidence && (
                <button
                  type="button"
                  onClick={() => onViewEvidence(change.id)}
                  className="text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                >
                  View Supporting Evidence &rarr;
                </button>
              )}

              {onViewFinding && (
                <button
                  type="button"
                  onClick={() => onViewFinding(change.id)}
                  className="text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                >
                  Related Finding &rarr;
                </button>
              )}

              {onViewHistoricalContext && (
                <button
                  type="button"
                  onClick={onViewHistoricalContext}
                  className="text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                >
                  View Historical Context &rarr;
                </button>
              )}
            </Cluster>
          </div>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

ChangeInvestigation.displayName = 'ChangeInvestigation';
