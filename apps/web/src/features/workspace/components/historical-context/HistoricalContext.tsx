import React from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  History,
  Layers,
  Milestone,
  ShieldCheck,
  AlertCircle,
  GitCommit,
  Clock,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  Eyebrow,
  Technical,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, Grid, ReadingSurface, Section } from '../../../../components/layout';
import {
  LoadingState,
  UnavailableState,
  ErrorState,
  EmptyState,
} from '../../../../components/states';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { useTimeline } from '../../../../hooks/queries/useTimeline';
import {
  resolveHistoricalContext,
  HISTORICAL_CONTEXT_COPY,
} from '../../contracts/historical-context.contract';
import { getSnapshotsArray } from '../../contracts/snapshot-history.contract';
import type { HistoricalContextProps } from './HistoricalContext.types';

/**
 * Authoritative Historical Context Component (WX-505).
 *
 * Answers: "How does the current infrastructure state fit into its history?"
 * - Lineage visualization: Earlier → Previous → Current
 * - Preserves backend-authoritative temporal relationships (zero client-side sorting/diffing)
 * - Highlights authoritative evolution changes connecting historical snapshots
 * - Distinguishes between Current, Previous, and Earlier states explicitly
 * - Handles Initial Baseline, Quiet, Partial, and Zero-snapshot states calmly
 */
export const HistoricalContext: React.FC<HistoricalContextProps> = ({
  domainId,
  domainName,
  initialSnapshots,
  initialEvents,
  onReturn,
  onViewSnapshot,
  onInvestigateChange,
  onViewEvidence,
  className = '',
  ...rest
}) => {
  const snapshotsQuery = useSnapshots(
    initialSnapshots ? null : domainId,
    { limit: 50 }
  );

  const timelineQuery = useTimeline(
    initialEvents ? undefined : { domainId }
  );

  const rawSnapshots = getSnapshotsArray(
    initialSnapshots || snapshotsQuery.data
  );

  const rawEvents =
    initialEvents ||
    timelineQuery.data?.data ||
    timelineQuery.data?.events ||
    [];

  const isLoading =
    (!initialSnapshots && snapshotsQuery.isLoading) ||
    (!initialEvents && timelineQuery.isLoading);

  const isError =
    (!initialSnapshots && Boolean(snapshotsQuery.error)) ||
    (!initialEvents && Boolean(timelineQuery.error));

  const error = snapshotsQuery.error || timelineQuery.error;

  const resolution = resolveHistoricalContext({
    snapshots: rawSnapshots,
    timelineEvents: rawEvents,
    isLoading,
    isError,
  });

  // 1. Loading State
  if (resolution.state === 'LOADING') {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Resolving historical context..."
          description={`Retrieving temporal infrastructure evolution and verifications for ${domainName}`}
        />
      </div>
    );
  }

  // 2. Domain Isolation / Unavailable State
  if (resolution.state === 'UNAVAILABLE') {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Historical Context Unavailable"
            description="Historical memory cannot be accessed due to tenant boundaries or unavailable telemetry."
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Error State
  if (resolution.state === 'ERROR' && resolution.allNodes.length === 0) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Failed to Load Historical Context"
            description={`Could not retrieve temporal snapshot lineage or change events for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => {
              snapshotsQuery.refetch();
              timelineQuery.refetch();
            }}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 4. Zero Snapshots (Empty State)
  if (resolution.state === 'EMPTY' && !resolution.isInitialBaseline) {
    return (
      <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest}>
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
          >
            <Icon icon={ArrowLeft} size="small" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        )}

        <ReadingSurface>
          <Stack gap="sm">
            <Cluster gap="xs" align="center">
              <Icon icon={History} size="small" className="text-primary" />
              <Eyebrow variant="muted" className="text-xs font-mono uppercase tracking-wider">
                Historical Context
              </Eyebrow>
            </Cluster>
            <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
              {domainName}
            </Display>
          </Stack>
        </ReadingSurface>

        <EmptyState
          title={HISTORICAL_CONTEXT_COPY.EMPTY_HEADLINE}
          description={HISTORICAL_CONTEXT_COPY.EMPTY_EXPLANATION}
          icon={Layers}
        />
      </Stack>
    );
  }

  const currentNode = resolution.currentNode;

  return (
    <Stack gap="xl" className={`relative z-10 w-full ${className}`} {...rest} data-testid="historical-context-view">
      {/* 1. Return Navigation Action */}
      <Cluster justify="between" align="center" gap="md">
        {onReturn && (
          <button
            type="button"
            onClick={onReturn}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer group"
            data-testid="historical-context-return-button"
          >
            <Icon icon={ArrowLeft} size="small" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Timeline</span>
          </button>
        )}

        <TechnicalSmall variant="muted" className="text-xs font-mono">
          Domain: {domainName} &bull; Verified States: {resolution.totalSnapshots}
        </TechnicalSmall>
      </Cluster>

      {/* 2. Header Context */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster justify="between" align="center" gap="sm">
            <Cluster gap="xs" align="center">
              <Icon icon={History} size="small" className="text-primary" />
              <Eyebrow variant="muted" className="text-xs font-mono uppercase tracking-wider">
                Historical Context
              </Eyebrow>
            </Cluster>

            <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#B9E5D6] text-[#178A68] bg-[#EAF7F2]">
              ● Active Context
            </span>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            {domainName}
          </Display>

          <p className="text-xs text-[#5F625F] dark:text-muted-foreground mt-0.5">
            {HISTORICAL_CONTEXT_COPY.SUBTITLE}
          </p>
        </Stack>
      </ReadingSurface>

      {/* 3. Single-Snapshot Initial Baseline State */}
      {resolution.isInitialBaseline && currentNode && (
        <ReadingSurface>
          <div
            className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-4"
            data-testid="historical-context-baseline-card"
          >
            <Cluster align="center" gap="sm">
              <div className="w-8 h-8 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border flex items-center justify-center text-[#5F625F] dark:text-muted-foreground">
                <Icon icon={Milestone} size="small" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {HISTORICAL_CONTEXT_COPY.BASELINE_HEADLINE}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {HISTORICAL_CONTEXT_COPY.BASELINE_EXPLANATION}
                </p>
              </div>
            </Cluster>

            <div className="p-4 rounded-lg border border-[#E2E2DD] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata space-y-3">
              <Cluster justify="between" align="center" gap="xs">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#178A68]">
                  Current
                </span>
                <span className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground">
                  {currentNode.formattedDate}
                </span>
              </Cluster>

              <TechnicalSmall className="font-mono text-xs text-foreground block font-medium">
                Snapshot {currentNode.snapshotId}
              </TechnicalSmall>

              <Cluster gap="md" align="center" className="text-xs text-[#5F625F] dark:text-muted-foreground pt-1 flex-wrap">
                {currentNode.httpProtocol && <span>{currentNode.httpProtocol}</span>}
                {currentNode.server && (
                  <>
                    <span>&bull;</span>
                    <span>{currentNode.server}</span>
                  </>
                )}
                <span>&bull;</span>
                <span className="text-[#178A68] font-medium">{currentNode.tlsSummary}</span>
              </Cluster>

              {onViewSnapshot && (
                <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider">
                  <button
                    type="button"
                    onClick={() => onViewSnapshot(currentNode.snapshotId)}
                    className="inline-flex items-center gap-1 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                  >
                    <span>View Snapshot Details</span>
                    <Icon icon={ArrowUpRight} size="small" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </ReadingSurface>
      )}

      {/* 4. Quiet State Notice (Multi-snapshot domain with no changes) */}
      {resolution.isQuiet && (
        <ReadingSurface>
          <div
            className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-2"
            data-testid="historical-context-quiet-card"
          >
            <Cluster align="center" gap="sm">
              <div className="w-8 h-8 rounded bg-[#EAF7F2] border border-[#B9E5D6] flex items-center justify-center text-[#178A68]">
                <Icon icon={ShieldCheck} size="small" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {HISTORICAL_CONTEXT_COPY.QUIET_HEADLINE}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {HISTORICAL_CONTEXT_COPY.QUIET_EXPLANATION}
                </p>
              </div>
            </Cluster>
          </div>
        </ReadingSurface>
      )}

      {/* 5. Partial State Notice */}
      {resolution.state === 'PARTIAL' && (
        <ReadingSurface>
          <div className="p-3.5 bg-[#FFF4E3] border border-[#F0D3A5] rounded-lg flex items-center gap-2.5 text-xs text-[#B86F18]">
            <Icon icon={AlertCircle} size="small" className="text-[#B86F18]" />
            <span>{HISTORICAL_CONTEXT_COPY.PARTIAL_NOTICE}</span>
          </div>
        </ReadingSurface>
      )}

      {/* 6. Authoritative Temporal Lineage (Earlier -> Previous -> Current) */}
      {!resolution.isInitialBaseline && resolution.allNodes.length > 1 && (
        <ReadingSurface>
          <Stack gap="md">
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Temporal Infrastructure Lineage
            </SectionTitle>

            <div className="space-y-4" data-testid="temporal-lineage-rail">
              {/* Node Sequence: Current (Top), Previous (Middle), Earlier (Bottom) with upward arrows */}
              {resolution.allNodes.map((node, index) => {
                const isFirst = index === 0;
                const isCurrent = node.tier === 'CURRENT';
                const isPrevious = node.tier === 'PREVIOUS';

                return (
                  <React.Fragment key={node.id}>
                    {/* Upward connector arrow between nodes */}
                    {!isFirst && (
                      <div className="flex justify-center py-1">
                        <div className="flex items-center gap-2 text-muted-foreground/70">
                          <div className="h-4 w-px bg-[#EEEEEB] dark:bg-border-divider" />
                          <Icon icon={ArrowUp} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
                          <div className="h-4 w-px bg-[#EEEEEB] dark:bg-border-divider" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`p-5 rounded-xl border transition-all duration-150 ${
                        isCurrent
                          ? 'border-[#1F9D73] bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)]'
                          : isPrevious
                          ? 'border-[#E1E1DC] bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)]'
                          : 'border-[#E7E7E3] bg-[#FAFAF8] dark:bg-surface-secondary'
                      }`}
                      data-testid={`lineage-node-${node.tier.toLowerCase()}`}
                    >
                      <Cluster justify="between" align="center" gap="sm" className="mb-2">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            isCurrent
                              ? 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]'
                              : isPrevious
                              ? 'text-[#3568C8] bg-[#EEF4FF] border-[#C8D8F6]'
                              : 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border'
                          }`}
                        >
                          {isCurrent
                            ? 'CURRENT VERIFIED STATE'
                            : isPrevious
                            ? 'PREVIOUS VERIFIED STATE'
                            : index === resolution.allNodes.length - 1
                            ? 'INITIAL BASELINE'
                            : 'EARLIER VERIFIED STATE'}
                        </span>

                        <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
                          {node.formattedDate}
                        </span>
                      </Cluster>

                      <div className="space-y-2">
                        <Technical className="font-mono text-xs text-foreground block font-medium">
                          Snapshot {node.snapshotId}
                        </Technical>

                        {/* Observed Infrastructure Highlights */}
                        <div className="pt-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground space-y-1">
                          <Cluster gap="md" align="center" className="flex-wrap">
                            {node.httpProtocol && (
                              <span className="font-medium text-foreground">
                                {node.httpProtocol}
                              </span>
                            )}
                            {node.server && (
                              <>
                                <span>&bull;</span>
                                <span>{node.server}</span>
                              </>
                            )}
                            <span>&bull;</span>
                            <span
                              className={
                                node.tlsSummary === 'TLS valid'
                                  ? 'text-[#178A68] font-medium'
                                  : 'text-[#C24D57] font-medium'
                              }
                            >
                              {node.tlsSummary}
                            </span>
                          </Cluster>

                          {node.technologies.length > 0 && (
                            <div className="text-[11px] text-[#5F625F] dark:text-muted-foreground pt-0.5">
                              {node.technologies.join(' · ')}
                            </div>
                          )}
                        </div>

                        {onViewSnapshot && (
                          <div className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex justify-end">
                            <button
                              type="button"
                              onClick={() => onViewSnapshot(node.snapshotId)}
                              className="inline-flex items-center gap-1 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                            >
                              <span>Inspect Snapshot</span>
                              <Icon icon={ArrowUpRight} size="small" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </Stack>
        </ReadingSurface>
      )}

      {/* 7. Recent Infrastructure Evolution (Authoritative Change Comparison) */}
      {resolution.evolutionLinks.length > 0 && (
        <ReadingSurface>
          <Stack gap="md">
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              Recent Infrastructure Evolution
            </SectionTitle>

            <div className="space-y-4" data-testid="historical-evolution-section">
              {resolution.evolutionLinks.map((link) => (
                <div
                  key={link.changeId}
                  className="p-5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-3"
                  data-testid={`evolution-link-${link.changeId}`}
                >
                  <Cluster justify="between" align="center" gap="sm">
                    <Cluster gap="xs" align="center">
                      <Icon icon={GitCommit} size="small" className="text-[#3568C8]" />
                      <span className="font-mono text-xs font-bold text-foreground">
                        {link.transitionLabel}
                      </span>
                    </Cluster>

                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#E2E2DD] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata text-[#5F625F] dark:text-muted-foreground">
                      {link.changeType}
                    </span>
                  </Cluster>

                  {link.explanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {link.explanation}
                    </p>
                  )}

                  {/* Authoritative State Comparison Table */}
                  {(link.previousValue || link.currentValue) && (
                    <Grid cols={2} gap="md" className="pt-1">
                      <div className="p-3 rounded-lg border border-[#E2E2DD] dark:border-border bg-[#F4F4F1] dark:bg-surface-metadata space-y-1">
                        <span className="font-mono text-[10px] uppercase font-semibold text-[#5F625F] dark:text-muted-foreground block">
                          Previous State
                        </span>
                        <div className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
                          {link.previousValue ?? 'No prior state recorded'}
                        </div>
                        {link.fromSnapshotId && (
                          <TechnicalSmall variant="muted" className="text-[10px] block pt-1 truncate text-[#5F625F] dark:text-muted-foreground">
                            Snap: {link.fromSnapshotId}
                          </TechnicalSmall>
                        )}
                      </div>

                      <div className="p-3 rounded-lg border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card space-y-1">
                        <span className="font-mono text-[10px] uppercase font-semibold text-foreground block">
                          Current State
                        </span>
                        <div className="font-mono text-xs text-foreground font-medium">
                          {link.currentValue ?? 'Component removed'}
                        </div>
                        <TechnicalSmall variant="muted" className="text-[10px] block pt-1 truncate text-[#5F625F] dark:text-muted-foreground">
                          Snap: {link.toSnapshotId}
                        </TechnicalSmall>
                      </div>
                    </Grid>
                  )}

                  <Cluster justify="between" align="center" gap="md" className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider flex-wrap">
                    <Cluster gap="xs" align="center" className="text-[11px] text-[#5F625F] dark:text-muted-foreground">
                      <Icon icon={Clock} size="small" />
                      <span>{new Date(link.detectedAt).toLocaleString()}</span>
                    </Cluster>

                    <Cluster gap="md" align="center">
                      {onViewEvidence && (
                        <button
                          type="button"
                          onClick={() => onViewEvidence(link.changeId)}
                          className="text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                        >
                          <span>View Evidence &rarr;</span>
                        </button>
                      )}

                      {onInvestigateChange && (
                        <button
                          type="button"
                          onClick={() => onInvestigateChange(link.changeId)}
                          className="inline-flex items-center gap-1 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors duration-150"
                        >
                          <span>Investigate this change</span>
                          <Icon icon={ArrowUpRight} size="small" />
                        </button>
                      )}
                    </Cluster>
                  </Cluster>
                </div>
              ))}
            </div>
          </Stack>
        </ReadingSurface>
      )}

      {/* 8. Footer Context */}
      <Section spacing="none" className="pt-2">
        <ReadingSurface>
          <Cluster justify="between" align="center" gap="md" className="text-xs text-muted-foreground">
            <Cluster gap="xs" align="center">
              <Icon icon={Layers} size="small" className="text-muted-foreground" />
              <TechnicalSmall variant="muted">
                Lineage Scope: {domainName}
              </TechnicalSmall>
            </Cluster>
            <TechnicalSmall variant="muted">
              {resolution.totalSnapshots} Authoritative Snapshots
            </TechnicalSmall>
          </Cluster>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

HistoricalContext.displayName = 'HistoricalContext';
