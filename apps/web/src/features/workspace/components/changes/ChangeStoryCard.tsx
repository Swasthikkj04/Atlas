import React, { useState } from 'react';
import {
  ArrowUpRight,
  FileText,
  Globe,
  Lock,
  ArrowRightLeft,
  Shield,
  Cpu,
  Cloud,
  Zap,
  Radio,
  Gauge,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Eyebrow, TechnicalSmall } from '../../../../components/typography';
import { Cluster, Grid } from '../../../../components/layout';
import type { ChangeStoryCardProps } from './ChangesTimeline.types';

const CATEGORY_ICONS: Readonly<Record<string, React.ComponentType<{ className?: string }>>> = {
  dns: Globe,
  tls_ssl: Lock,
  http: ArrowRightLeft,
  security_headers: Shield,
  technology: Cpu,
  hosting: Cloud,
  edge_cdn: Zap,
  network: Radio,
  performance: Gauge,
};

/**
 * Authoritative Change Story Card (WX-1001 / WX-1005 / WX-1017 / WX-1024).
 *
 * Implements the WX-1024 Change Intelligence & Improvement Experience:
 * 1. Outcome-oriented headline expressing the actual change result (e.g. Content-Security-Policy improved).
 * 2. Restrained semantic outcome badge (IMPROVED in #178A68, DEGRADED in #C24D57, Neutral in #5F625F, no rainbow).
 * 3. Intelligent "What changed" interpretation answering "What happened?".
 * 4. Consequence "Why it matters" explaining defensive posture strengthening rather than simplistic generic text.
 * 5. Compact change summary (Previous vs Current comparison + derived metrics) before raw evidence.
 * 6. Collapsible evidence panel for raw policy / diff details (Summary before evidence).
 * 7. Evidence lineage strip proving snapshot and response traceability.
 * 8. Explicit anti-overclaiming boundaries ("What this establishes" vs "What this does not establish").
 */
export const ChangeStoryCard: React.FC<ChangeStoryCardProps> = ({
  change,
  onInvestigate,
  onViewEvidence,
  onViewSnapshot,
  onViewPreviousSnapshot,
  className = '',
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const CategoryIcon = CATEGORY_ICONS[change.category] || Shield;

  const isImprovement =
    change.changeType === 'IMPROVED' ||
    change.impact === 'POSITIVE' ||
    change.direction === 'IMPROVEMENT' ||
    change.title.toLowerCase().includes('improved');

  const isDegradation =
    change.changeType === 'DEGRADED' ||
    change.changeType === 'REGRESSED' ||
    change.impact === 'NEGATIVE' ||
    change.impact === 'CRITICAL' ||
    change.direction === 'REGRESSION' ||
    change.title.toLowerCase().includes('degraded') ||
    change.title.toLowerCase().includes('regressed');

  // Outcome classification badge label
  const badgeLabel = isImprovement
    ? 'IMPROVED'
    : isDegradation
    ? change.changeType === 'DEGRADED'
      ? 'DEGRADED'
      : change.severity === 'CRITICAL'
      ? 'CRITICAL'
      : 'DEGRADED'
    : change.changeType === 'ADDED'
    ? 'ADDED'
    : change.changeType === 'REMOVED'
    ? 'REMOVED'
    : change.changeType === 'STABLE'
    ? 'STABLE'
    : 'CHANGED';

  // Semantic palette classes matching WX-1024 Requirement 2
  const badgeClasses = isImprovement
    ? 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]'
    : isDegradation
    ? 'text-[#C24D57] bg-[#FFF0F1] border-[#F0C3C7]'
    : 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border';

  const hasComparativeValues =
    Boolean(change.previousValue) || Boolean(change.currentValue);

  const isPolicyChange =
    change.category === 'security_headers' ||
    change.title.toLowerCase().includes('policy') ||
    change.title.toLowerCase().includes('csp') ||
    change.title.toLowerCase().includes('header');

  const previousDisplayLabel =
    change.derivedSummary?.previousLabel ||
    (change.previousValue && change.previousValue !== 'Not configured' && change.previousValue !== 'absent' && change.previousValue !== 'None'
      ? isPolicyChange && change.previousValue.length > 30
        ? 'CSP present'
        : change.previousValue
      : isPolicyChange
      ? 'No effective CSP'
      : 'Initial observation');

  const currentDisplayLabel =
    change.derivedSummary?.currentLabel ||
    (change.currentValue && change.currentValue !== 'Removed' && change.currentValue !== 'absent' && change.currentValue !== 'None'
      ? isPolicyChange && change.currentValue.length > 30
        ? 'CSP present'
        : change.currentValue
      : isPolicyChange
      ? 'No effective CSP'
      : 'Current observation');

  const hasDistinctSummary =
    Boolean(change.summaryNarrative) &&
    change.summaryNarrative.toLowerCase() !== change.title.toLowerCase();

  return (
    <article
      className={`bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-5 sm:p-6 space-y-5 hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated hover:border-[#DADAD5] dark:hover:border-border-strong shadow-[0_1px_2px_rgba(16,24,20,0.035)] transition-all duration-150 ease-out ${className}`}
      data-testid={`change-card-${change.changeId}`}
    >
      {/* 1. Header: Category with Canonical Icon + Restrained Outcome Badge (WX-1024 Req 2) */}
      <Cluster justify="between" align="center" className="w-full">
        <Cluster gap="xs" align="center">
          <CategoryIcon className="w-4 h-4 text-[#5F625F] dark:text-muted-foreground" />
          <Eyebrow variant="muted" className="font-mono text-[10px] tracking-wider uppercase text-[#5F625F] dark:text-muted-foreground">
            {change.categoryLabel}
          </Eyebrow>
        </Cluster>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${badgeClasses}`}
          data-testid="change-outcome-badge"
        >
          {badgeLabel}
        </span>
      </Cluster>

      {/* 2. Outcome Headline Title (WX-1024 Req 1) */}
      <h3
        className="text-base sm:text-lg font-medium text-foreground leading-snug tracking-tight"
        data-testid="change-headline"
      >
        {change.title}
      </h3>

      {/* 3. Intelligent "What Changed" Narrative Interpretation (WX-1024 Req 3) */}
      {(hasDistinctSummary || isImprovement) && (
        <div className="space-y-1.5" data-testid="section-what-changed">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
            What changed
          </span>
          <p className="text-xs sm:text-sm text-foreground/90 dark:text-foreground/80 leading-relaxed">
            {change.summaryNarrative ||
              (isImprovement && change.category === 'security_headers'
                ? 'The current verified snapshot includes a Content-Security-Policy that was not present in the previous snapshot.'
                : `A verified state transition was recorded for ${change.subject || change.categoryLabel}.`)}
          </p>
        </div>
      )}

      {/* 4. "Why It Matters" Explaining Defensive Consequence (WX-1024 Req 4) */}
      {change.hasAuthoritativeSignificance && change.significanceExplanation && (
        <div
          className={`p-3.5 rounded-lg space-y-1.5 border-l-2 ${
            isImprovement
              ? 'bg-[#EAF7F2]/40 dark:bg-surface-secondary border-[#178A68]'
              : isDegradation
              ? 'bg-[#FFF0F1]/40 dark:bg-surface-secondary border-[#C24D57]'
              : 'bg-[#FAFAF8] dark:bg-surface-secondary border-[#3568C8]'
          }`}
          data-testid="section-why-it-matters"
        >
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
            Why it matters
          </span>
          <p className="text-xs sm:text-[13px] text-foreground/90 leading-relaxed font-normal">
            {change.significanceExplanation}
          </p>
        </div>
      )}

      {/* 5. Compact Change Summary (WX-1024 Req 5 - Summary before raw evidence) */}
      {hasComparativeValues && (
        <div className="space-y-3 pt-1" data-testid="compact-change-summary">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
            Verified change
          </span>

          <Grid cols={2} gap="sm" className="w-full">
            {/* Previous State Box */}
            <div className="bg-[#F4F4F1] dark:bg-surface-metadata p-3 rounded-lg border border-[#E2E2DD] dark:border-border space-y-1">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                Previous
              </span>
              <p className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground break-all leading-relaxed font-medium">
                {previousDisplayLabel}
              </p>
            </div>

            {/* Current State Box */}
            <div className="bg-[#F4F4F1] dark:bg-surface-metadata p-3 rounded-lg border border-[#E2E2DD] dark:border-border space-y-1">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-foreground block">
                Current
              </span>
              <p className="text-xs font-mono text-foreground font-medium break-all leading-relaxed">
                {currentDisplayLabel}
              </p>
              {change.derivedSummary?.postureChange && (
                <span className="inline-block text-[10px] font-mono text-[#178A68] font-medium pt-0.5">
                  {change.derivedSummary.postureChange}
                </span>
              )}
            </div>
          </Grid>

          {/* Derived Detailed Comparison Metrics (When Authoritative Data is Present) */}
          {change.derivedSummary && (
            <div
              className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono"
              data-testid="derived-policy-summary"
            >
              {change.derivedSummary.directives && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                    Policy directives
                  </span>
                  <span className="font-medium text-foreground">
                    {change.derivedSummary.directives.previous} &rarr; {change.derivedSummary.directives.current}
                  </span>
                </div>
              )}
              {change.derivedSummary.allowedSources && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                    Allowed sources
                  </span>
                  <span className="font-medium text-foreground">
                    {change.derivedSummary.allowedSources}
                  </span>
                </div>
              )}
              {change.derivedSummary.browserRestrictions && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                    Browser restrictions
                  </span>
                  <span className="font-medium text-foreground">
                    {change.derivedSummary.browserRestrictions}
                  </span>
                </div>
              )}
              {change.derivedSummary.overallPosture && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block">
                    Overall posture
                  </span>
                  <span className="font-medium text-[#178A68]">
                    {change.derivedSummary.overallPosture}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Raw Policy / Value Evidence in Collapsible Panel (WX-1024 Req 6) */}
      {hasComparativeValues && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setIsDetailsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#3568C8] hover:underline cursor-pointer transition-colors"
            data-testid="toggle-policy-details"
          >
            <span>{isDetailsOpen ? 'Hide policy details ↑' : 'Show policy details →'}</span>
            {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isDetailsOpen && (
            <div
              className="p-3.5 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-3"
              data-testid="collapsible-policy-details"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                  Previous verified response
                </span>
                <pre className="p-2.5 rounded bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border font-mono text-[11px] text-[#5F625F] dark:text-muted-foreground whitespace-pre-wrap break-all leading-relaxed m-0">
                  {change.previousValue || 'No previous value configured'}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-foreground block">
                  Current verified response
                </span>
                <pre className="p-2.5 rounded bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border font-mono text-[11px] text-foreground font-medium whitespace-pre-wrap break-all leading-relaxed m-0">
                  {change.currentValue || 'No current value recorded'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Evidence Lineage Strip (WX-1024 Req 7) */}
      <div
        className="p-3 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border space-y-2.5"
        data-testid="evidence-lineage-strip"
      >
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
          Response lineage
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
          {/* Previous Snapshot Lineage Step */}
          {change.previousSnapshotId && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F625F]/60 shrink-0" />
              <span>
                Previous snapshot {change.previousSnapshotId.slice(0, 8)}…
                {change.previousSnapshotTimestamp && ` · ${change.previousSnapshotTimestamp}`}
              </span>
            </div>
          )}

          {change.previousSnapshotId && (
            <ArrowDown className="w-3 h-3 text-[#5F625F]/50 hidden sm:inline -rotate-90" />
          )}

          {/* Current Snapshot Lineage Step */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#178A68] shrink-0" />
            <span>
              Current snapshot {change.currentSnapshotId ? `${change.currentSnapshotId.slice(0, 8)}…` : 'latest'}
              {change.detectedFormatted && ` · ${change.detectedFormatted}`}
            </span>
          </div>

          <ArrowDown className="w-3 h-3 text-[#5F625F]/50 hidden sm:inline -rotate-90" />

          {/* Change Verified Step */}
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#178A68] shrink-0" />
            <span>Change verified: {change.subject || change.categoryLabel}</span>
          </div>
        </div>
      </div>

      {/* 8. Anti-Overclaiming Boundaries: What this establishes vs What this does NOT establish (WX-1024 Req 8) */}
      {(change.whatThisEstablishes || change.whatThisDoesNotEstablish) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          {change.whatThisEstablishes && (
            <div
              className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-1"
              data-testid="section-what-this-establishes"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#178A68]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>What this establishes</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                {change.whatThisEstablishes}
              </p>
            </div>
          )}

          {change.whatThisDoesNotEstablish && (
            <div
              className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-1"
              data-testid="section-what-this-does-not-establish"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B86F18] shrink-0" />
                <span>What this does not establish</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                {change.whatThisDoesNotEstablish}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 9. Footer: Evidence Artifacts Count & Investigation Link (WX-1024 Req 7 links) */}
      <Cluster justify="between" align="center" className="pt-2 border-t border-[#EEEEEB] dark:border-border-divider text-xs">
        <TechnicalSmall className="text-[#5F625F] dark:text-muted-foreground font-mono text-[11px] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#5F625F]/70 dark:text-muted-foreground/70" />
          <span>
            {change.evidenceCount > 0
              ? `${change.evidenceCount} ${change.evidenceCount === 1 ? 'evidence artifact' : 'evidence artifacts'}`
              : 'Verified response telemetry'}
          </span>
        </TechnicalSmall>

        <div className="flex items-center gap-3 flex-wrap">
          {change.previousSnapshotId && (onViewPreviousSnapshot || onViewSnapshot) && (
            <button
              type="button"
              onClick={() => {
                if (onViewPreviousSnapshot) {
                  onViewPreviousSnapshot(change.previousSnapshotId!);
                } else if (onViewSnapshot) {
                  onViewSnapshot(change.previousSnapshotId!);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-mono text-[#3568C8] hover:underline cursor-pointer transition-colors"
              data-testid="view-previous-snapshot"
            >
              <span>View previous snapshot &rarr;</span>
            </button>
          )}

          {change.currentSnapshotId && onViewSnapshot && (
            <button
              type="button"
              onClick={() => onViewSnapshot(change.currentSnapshotId)}
              className="inline-flex items-center gap-1 text-xs font-mono text-[#3568C8] hover:underline cursor-pointer transition-colors"
              data-testid="view-current-snapshot"
            >
              <span>View current snapshot &rarr;</span>
            </button>
          )}

          {change.evidenceCount > 0 && (onViewEvidence || onInvestigate) ? (
            <button
              type="button"
              onClick={() => {
                if (onViewEvidence) {
                  onViewEvidence(change.findingId || change.changeId);
                } else if (onInvestigate) {
                  onInvestigate(change.changeId);
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3568C8] hover:underline transition-colors duration-150 cursor-pointer"
              data-testid={`investigate-change-${change.changeId}`}
            >
              <span>View evidence</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : onInvestigate ? (
            <button
              type="button"
              onClick={() => onInvestigate(change.changeId)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3568C8] hover:underline transition-colors duration-150 cursor-pointer"
              data-testid={`investigate-change-${change.changeId}`}
            >
              <span>Inspect details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </Cluster>
    </article>
  );
};

ChangeStoryCard.displayName = 'ChangeStoryCard';
