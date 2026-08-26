import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  Display,
  SectionTitle,
  Body,
  TechnicalSmall,
} from '../../../../components/typography';
import { Stack, Cluster, ReadingSurface, Section } from '../../../../components/layout';
import { LoadingState, UnavailableState, ErrorState } from '../../../../components/states';
import { useFinding } from '../../../../hooks/queries/useFindings';
import { resolveFindingMeaningHierarchy } from '../../contracts/investigation-hierarchy.contract';
import { DomainFavicon } from '../identity';
import type { FindingInvestigationProps } from './FindingInvestigation.types';
import type { FindingSeverity } from '../../../../types/api';

const severityColorMap: Record<FindingSeverity, { text: string; bg: string; border: string }> = {
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
  SUCCESS: {
    text: 'text-[#178A68]',
    bg: 'bg-[#EAF7F2]',
    border: 'border-[#B9E5D6]',
  },
};

/**
 * Authoritative Finding Investigation Experience (WX-302 / WX-1017 / WX-1019).
 *
 * Canonical Information Hierarchy:
 * 1. HERO: Finding Title, Category & Severity badge, Factual Summary, Subordinate snapshot/detection line.
 * 2. WHAT HAPPENED: First substantive section explaining what was found.
 * 3. WHY IT MATTERS: High-hierarchy significance & impact analysis before technical evidence.
 * 4. WHAT THIS MEANS: Compact structured breakdown (Domain, Control, Observed State).
 * 5. OBSERVED EVIDENCE: Technical proof layer (Rule ID, Observation Key, Observed Value).
 * 6. HOW NEBULA KNOWS: Progressively disclosed verification details ("View verification chain →").
 * 7. VERIFIED CONTEXT: Restrained snapshot context footer.
 */
export const FindingInvestigation: React.FC<FindingInvestigationProps> = ({
  domainId,
  domainName,
  findingId,
  initialFinding,
  onReturn,
  onViewSnapshot,
  onViewEvidence,
  className = '',
  ...rest
}) => {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const findingQuery = useFinding(initialFinding ? null : findingId);

  const finding = initialFinding || findingQuery.data;
  const isLoading = !initialFinding && findingQuery.isLoading;
  const error = findingQuery.error;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className={`w-full py-12 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label="Loading finding investigation..."
          description="Resolving authoritative evidence lineage and observation baseline"
        />
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error && !finding) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <ErrorState
            error={error}
            title="Finding Not Found"
            description={`Could not retrieve finding ${findingId} for domain ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => findingQuery.refetch()}
          />
        </ReadingSurface>
      </div>
    );
  }

  // 3. Domain Mismatch Security Guard (P0 Security Invariant)
  if (finding && finding.domainId && finding.domainId !== domainId) {
    return (
      <div className={`w-full py-8 flex justify-center ${className}`} {...rest}>
        <ReadingSurface>
          <UnavailableState
            title="Unauthorized Resource Access"
            description="The requested finding does not belong to the active workspace domain."
            technicalNote="Cross-domain resource isolation enforced."
          />
        </ReadingSurface>
      </div>
    );
  }

  if (!finding) {
    return null;
  }

  const hierarchy = resolveFindingMeaningHierarchy({
    finding,
    domainName,
  });

  const sevTokens =
    severityColorMap[finding.severity as FindingSeverity] || severityColorMap.INFORMATIONAL;

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
            {domainName} &bull; Finding: {finding.id.slice(0, 12)}…
          </TechnicalSmall>
        </div>
      </Cluster>

      {/* 2. Hero Header: Meaning before mechanics (WX-1019 / WX-1023) */}
      <ReadingSurface>
        <Stack gap="sm">
          <Cluster justify="between" align="center" gap="sm" className="flex-wrap">
            <Cluster gap="sm" align="center" className="flex-wrap">
              <Cluster gap="xs" align="center">
                <Icon icon={ShieldAlert} size="small" className={sevTokens.text} />
                <span
                  className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
                  data-testid="finding-severity-badge"
                >
                  {hierarchy.hero.severity}
                </span>
              </Cluster>

              <span
                className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata select-none"
                data-testid="finding-confidence-badge"
              >
                {hierarchy.hero.confidence}
              </span>

              <span
                className="font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground hidden sm:inline"
                data-testid="finding-classification-tag"
              >
                &bull; {hierarchy.hero.riskClassification}
              </span>
            </Cluster>

            <span className="font-mono text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-2 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
              Status: {finding.status || finding.state || 'Active'}
            </span>
          </Cluster>

          <Display className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground leading-[1.2]">
            {hierarchy.hero.title}
          </Display>

          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
            {hierarchy.hero.subtitle}
          </p>

          <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground pt-0.5" data-testid="finding-subordinate-verification-line">
            Detected {hierarchy.hero.detectedDateFormatted} &bull; Verified against snapshot{' '}
            <span className="font-medium text-foreground/90">{hierarchy.hero.snapshotShortId}</span>
          </p>
        </Stack>
      </ReadingSurface>

      {/* 3. Primary Investigation Surface: Structured Meaning & Evidence (WX-1019 / WX-1023) */}
      <ReadingSurface>
        <div
          className="p-6 sm:p-8 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] space-y-6"
          data-testid="finding-meaning-surface"
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

          {/* Section B: WHY IT MATTERS (WX-1019 / WX-1023) */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-why-it-matters"
          >
            <Cluster justify="between" align="center" gap="sm">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                WHY IT MATTERS
              </SectionTitle>
              {hierarchy.whyItMatters.impactLevel && (
                <span
                  className={`font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${sevTokens.text} ${sevTokens.bg} ${sevTokens.border}`}
                  data-testid="finding-impact-badge"
                >
                  POTENTIAL IMPACT: {hierarchy.whyItMatters.impactLevel}
                </span>
              )}
            </Cluster>
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 font-normal">
              {hierarchy.whyItMatters.significance}
            </p>
            {hierarchy.whyItMatters.severityRationale && (
              <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground pt-1">
                Rationale: {hierarchy.whyItMatters.severityRationale}
              </p>
            )}
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
                  Control
                </span>
                <p className="text-foreground font-medium truncate">{hierarchy.whatThisMeans.control}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                  Observed State
                </span>
                <p className="text-foreground font-medium truncate">{hierarchy.whatThisMeans.observedState}</p>
              </div>
            </div>
          </div>

          {/* Section D: WHAT THIS DOES NOT ESTABLISH (WX-1023 Anti-Overclaiming Boundary) */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-2.5"
            data-testid="section-what-this-does-not-prove"
          >
            <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
              WHAT THIS DOES NOT ESTABLISH
            </SectionTitle>
            <div className="p-3.5 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E1E1DC] dark:border-border text-xs sm:text-[13px] leading-relaxed text-[#5F625F] dark:text-muted-foreground">
              {hierarchy.whatNebulaDoesNotProve.description}
            </div>
          </div>

          {/* Section D: OBSERVED EVIDENCE */}
          <div
            className="pt-5 border-t border-[#EEEEEB] dark:border-border-divider space-y-3"
            data-testid="section-observed-evidence"
          >
            <Cluster justify="between" align="center" gap="sm">
              <SectionTitle className="text-xs font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                OBSERVED EVIDENCE
              </SectionTitle>

              {onViewEvidence && finding.lineage && (
                <button
                  type="button"
                  onClick={() => onViewEvidence(finding.lineage!)}
                  className="inline-flex items-center gap-1 text-xs text-[#3568C8] hover:underline font-mono font-medium cursor-pointer transition-colors"
                >
                  <span>View Evidence</span>
                  <Icon icon={ArrowUpRight} size="small" />
                </button>
              )}
            </Cluster>

            <div className="p-3.5 bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg space-y-2 text-xs font-mono">
              <Cluster justify="between" align="center" gap="sm" className="flex-wrap">
                {hierarchy.observedEvidence.observationKey && (
                  <span className="text-[#5F625F] dark:text-muted-foreground">
                    Record / Key:{' '}
                    <strong className="text-foreground font-medium">
                      {hierarchy.observedEvidence.observationKey}
                    </strong>
                  </span>
                )}
                {hierarchy.observedEvidence.ruleId && (
                  <span className="text-[#5F625F] dark:text-muted-foreground">
                    Rule:{' '}
                    <strong className="text-foreground font-medium">
                      {hierarchy.observedEvidence.ruleId}
                    </strong>
                  </span>
                )}
              </Cluster>

              {hierarchy.observedEvidence.observedValue && (
                <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all leading-relaxed m-0 pt-2 border-t border-[#E2E2DD] dark:border-border">
                  {hierarchy.observedEvidence.observedValue}
                </pre>
              )}
            </div>
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
                {hierarchy.howNebulaKnows.map((item, idx) => {
                  const isWarning = item.status === 'WARNING' || item.status === 'INVALID';
                  const isError = item.status === 'ERROR' || item.status === 'FAILED';
                  const icon = isError ? XCircle : isWarning ? AlertTriangle : CheckCircle2;
                  const iconColor = isError
                    ? 'text-[#A93442]'
                    : isWarning
                    ? 'text-[#B86F18]'
                    : 'text-[#178A68]';

                  return (
                    <div
                      key={`${item.step}-${idx}`}
                      className="p-2.5 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border flex items-start gap-2.5"
                    >
                      <Icon icon={icon} size="small" className={`${iconColor} mt-0.5 shrink-0`} />
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
                  );
                })}
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
                  Snapshot: <span className="font-mono text-muted-foreground">{hierarchy.verifiedContext.snapshotId}</span>
                </p>
                <p>
                  Domain: {hierarchy.verifiedContext.domain} &bull; Detected: {hierarchy.verifiedContext.detectedAt}
                </p>
              </div>
            </div>

            {onViewSnapshot && finding.snapshotId && (
              <button
                type="button"
                onClick={() => onViewSnapshot(finding.snapshotId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E2DD] dark:border-border bg-[#FFFFFF] dark:bg-card hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata text-xs text-[#3568C8] font-mono font-medium transition-colors cursor-pointer shrink-0"
                data-testid="view-snapshot-footer-btn"
              >
                <span>View snapshot &rarr;</span>
              </button>
            )}
          </div>
        </ReadingSurface>
      </Section>
    </Stack>
  );
};

FindingInvestigation.displayName = 'FindingInvestigation';
