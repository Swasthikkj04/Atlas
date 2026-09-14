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
} from 'lucide-react';
import { TechnicalSmall } from '../../../../components/typography';
import {
  resolveOneSentenceMeaning,
} from '../../contracts/changes.contract';
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
 * CHG-001: Premium Meaningful Change Card.
 *
 * Information Hierarchy (AC-04 & AC-05):
 * 1. Title: Outcome-oriented headline describing what changed (e.g., "DNS addresses changed").
 * 2. Meaning: Exactly one human-readable sentence explaining the significance.
 * 3. Bottom status: Classified outcome badge + category label + interactive arrow ("Modified · DNS →").
 * 4. Progressive disclosure: Clicking expands focused details (Previous vs Current, Why it matters, Lineage, Evidence).
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
  const [isRawDetailsOpen, setIsRawDetailsOpen] = useState(false);

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
    ? 'Improved'
    : isDegradation
    ? change.changeType === 'DEGRADED'
      ? 'Degraded'
      : change.severity === 'CRITICAL'
      ? 'Critical'
      : 'Degraded'
    : change.changeType === 'ADDED'
    ? 'Added'
    : change.changeType === 'REMOVED'
    ? 'Removed'
    : change.changeType === 'STABLE'
    ? 'Stable'
    : 'Modified';

  // Semantic palette classes
  const badgeClasses = isImprovement
    ? 'text-[#178A68] bg-[#EAF7F2] dark:bg-emerald-950/30 border-[#B9E5D6] dark:border-emerald-800/30'
    : isDegradation
    ? 'text-[#C24D57] bg-[#FFF0F1] dark:bg-rose-950/30 border-[#F0C3C7] dark:border-rose-800/30'
    : 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border';

  const hasComparativeValues =
    Boolean(change.previousValue) || Boolean(change.currentValue);

  const oneSentenceMeaning = resolveOneSentenceMeaning(change);

  const previousDisplayLabel =
    change.derivedSummary?.previousLabel ||
    change.previousValue ||
    'None';

  const currentDisplayLabel =
    change.derivedSummary?.currentLabel ||
    change.currentValue ||
    'None';

  return (
    <article
      className={`group w-full bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl p-4 sm:p-5 space-y-3.5 transition-all duration-150 hover:border-[#BFBFB8] dark:hover:border-foreground/30 shadow-[0_1px_2px_rgba(16,24,20,0.02)] ${className}`}
      data-testid="change-story-card"
    >
      {/* 1. Header & Title & One-Sentence Meaning */}
      <div
        className="space-y-1.5 cursor-pointer select-text"
        onClick={() => setIsDetailsOpen((prev) => !prev)}
      >
        <div className="flex items-start justify-between gap-3">
          <h4
            className="text-sm sm:text-base font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors leading-snug"
            data-testid="change-title"
          >
            {change.title}
          </h4>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsOpen((prev) => !prev);
            }}
            className="text-[#5F625F] dark:text-muted-foreground hover:text-foreground shrink-0 p-1"
            aria-label={isDetailsOpen ? 'Collapse change details' : 'Expand change details'}
          >
            {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Exactly One Sentence of Meaning (AC-04) */}
        <p
          className="text-xs sm:text-[13px] text-[#5F625F] dark:text-muted-foreground leading-relaxed font-sans"
          data-testid="section-what-changed"
        >
          {oneSentenceMeaning}
        </p>
      </div>

      {/* 2. Primary Footer Status Strip */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F2F2EF] dark:border-border-divider/50 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClasses}`}
            data-testid="change-type-badge"
          >
            <CategoryIcon className="w-3 h-3 shrink-0" />
            <span>{badgeLabel}</span>
          </span>

          <span className="text-[#5F625F] dark:text-muted-foreground text-[11px]">
            &bull; {change.categoryLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDetailsOpen((prev) => !prev)}
          className="text-xs font-medium text-[#3568C8] dark:text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
          data-testid="toggle-change-details"
        >
          <span>{isDetailsOpen ? 'Hide' : 'Details'}</span>
          <span className="text-sm">&rarr;</span>
        </button>
      </div>

      {/* 3. Progressive Disclosure Focused Details (AC-05 & Section 8) */}
      {isDetailsOpen && (
        <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider space-y-3.5 text-xs">
          {/* Forensic Intelligence Model (T23.5) */}
          {change.forensicExplanation ? (
            <div
              className="p-3.5 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-2.5"
              data-testid="forensic-explanation-block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground font-semibold">
                  Forensic Intelligence
                </span>
                {change.significance && (
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold ${
                      change.significance === 'CRITICAL'
                        ? 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                        : change.significance === 'IMPORTANT'
                        ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                        : change.significance === 'NOTABLE'
                        ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                        : 'text-muted-foreground bg-muted border-border'
                    }`}
                  >
                    {change.significance}
                  </span>
                )}
              </div>

              {change.blastRadiusLayers && change.blastRadiusLayers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground">Blast Radius:</span>
                  {change.blastRadiusLayers.map((layer) => (
                    <span
                      key={layer}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata border border-border text-foreground"
                      data-testid="blast-radius-tag"
                    >
                      {layer}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                {change.forensicExplanation.whyWeBelieveIt && (
                  <div className="p-2 rounded bg-[#FFFFFF] dark:bg-surface-metadata/50 border border-border/60 space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-muted-foreground font-semibold block">Why We Believe It</span>
                    <p className="text-[11px] text-foreground leading-relaxed font-sans" data-testid="forensic-why-we-believe-it">
                      {change.forensicExplanation.whyWeBelieveIt}
                    </p>
                  </div>
                )}
                {change.forensicExplanation.whatItMeans && (
                  <div className="p-2 rounded bg-[#FFFFFF] dark:bg-surface-metadata/50 border border-border/60 space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-muted-foreground font-semibold block">What It Means</span>
                    <p className="text-[11px] text-foreground leading-relaxed font-sans" data-testid="forensic-what-it-means">
                      {change.forensicExplanation.whatItMeans}
                    </p>
                  </div>
                )}
              </div>

              {change.forensicExplanation.whatWeCannotConclude && (
                <div className="p-2 rounded bg-[#FFFFFF] dark:bg-surface-metadata/50 border border-border/60 space-y-0.5 text-xs">
                  <span className="text-[9px] font-mono uppercase text-[#B86F18] font-semibold block">What We Cannot Conclude</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-mono" data-testid="forensic-what-we-cannot-conclude">
                    {change.forensicExplanation.whatWeCannotConclude}
                  </p>
                </div>
              )}

              {change.forensicExplanation.attention && (
                <div
                  className={`p-2 rounded border flex items-center justify-between text-xs ${
                    change.forensicExplanation.attentionRequired
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                      : 'bg-[#FFFFFF] dark:bg-surface-metadata/50 border-border/60 text-muted-foreground'
                  }`}
                  data-testid="forensic-attention"
                >
                  <span className="text-[11px] font-medium">{change.forensicExplanation.attention}</span>
                </div>
              )}
            </div>
          ) : change.significanceExplanation ? (
            <div className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border-l-2 border-[#18181B] dark:border-primary space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                Why it matters
              </span>
              <p
                className="text-xs text-foreground leading-relaxed font-sans"
                data-testid="change-significance-explanation"
              >
                {change.significanceExplanation}
              </p>
            </div>
          ) : null}

          {/* Value Transition Comparison */}
          {hasComparativeValues && (
            <div className="space-y-2 pt-0.5" data-testid="compact-change-summary">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#F7F7F5] dark:bg-surface-metadata border border-[#E8E8E3] dark:border-border space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block font-semibold">
                    PREVIOUS
                  </span>
                  <p className="text-[11px] text-[#5F625F] dark:text-muted-foreground break-all truncate font-medium select-all">
                    {previousDisplayLabel}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F7F7F5] dark:bg-surface-metadata border border-[#E8E8E3] dark:border-border space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-foreground block font-semibold">
                      CURRENT
                    </span>
                    {change.derivedSummary?.postureChange && (
                      <span className="text-[9px] text-[#178A68] font-medium">
                        {change.derivedSummary.postureChange}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground break-all truncate font-medium select-all">
                    {currentDisplayLabel}
                  </p>
                </div>
              </div>

              {/* Derived Policy Directives (Compact inline row) */}
              {change.derivedSummary && (
                <div
                  className="p-2 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground"
                  data-testid="derived-policy-summary"
                >
                  {change.derivedSummary.directives && (
                    <span>
                      Directives: <strong className="text-foreground">{change.derivedSummary.directives.previous} &rarr; {change.derivedSummary.directives.current}</strong>
                    </span>
                  )}
                  {change.derivedSummary.allowedSources && (
                    <span>
                      Sources: <strong className="text-foreground">{change.derivedSummary.allowedSources}</strong>
                    </span>
                  )}
                  {change.derivedSummary.overallPosture && (
                    <span>
                      Posture: <strong className="text-[#178A68]">{change.derivedSummary.overallPosture}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Collapsible Raw Value Diff */}
              <div className="space-y-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsRawDetailsOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#3568C8] hover:underline cursor-pointer"
                  data-testid="toggle-policy-details"
                >
                  <span>{isRawDetailsOpen ? 'Hide raw response details ↑' : 'Show raw response details →'}</span>
                  {isRawDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isRawDetailsOpen && (
                  <div
                    className="p-3 rounded-lg bg-[#FAFAF8] dark:bg-surface-secondary border border-[#E2E2DD] dark:border-border space-y-2.5 text-xs font-mono"
                    data-testid="collapsible-policy-details"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-[#5F625F] dark:text-muted-foreground block font-semibold">
                        Previous response
                      </span>
                      <pre className="p-2 rounded bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border text-[11px] text-[#5F625F] dark:text-muted-foreground whitespace-pre-wrap break-all leading-relaxed m-0 select-all">
                        {change.previousValue || 'No previous value configured'}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-foreground block font-semibold">
                        Current response
                      </span>
                      <pre className="p-2 rounded bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border text-[11px] text-foreground font-medium whitespace-pre-wrap break-all leading-relaxed m-0 select-all">
                        {change.currentValue || 'No current value recorded'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lineage & Scope Limits */}
          <div className="hidden" data-testid="evidence-lineage-strip">
            <span>{change.currentSnapshotId}</span>
            {change.whatThisEstablishes && (
              <div data-testid="section-what-this-establishes">{change.whatThisEstablishes}</div>
            )}
          </div>

          {change.whatThisDoesNotEstablish && (
            <div
              className="text-[11px] text-[#5F625F] dark:text-muted-foreground font-mono flex items-center gap-1.5 pt-0.5"
              data-testid="section-what-this-does-not-establish"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B86F18]">Scope Limit:</span>
              <span>{change.whatThisDoesNotEstablish}</span>
            </div>
          )}

          {/* Actions & Evidence Traversal */}
          <div className="pt-2.5 border-t border-[#EEEEEB] dark:border-border-divider flex items-center justify-between text-xs font-mono">
            <TechnicalSmall className="text-[#5F625F] dark:text-muted-foreground text-[11px] flex items-center gap-1">
              <FileText className="w-3 h-3 text-muted-foreground/60" />
              <span>Observed {change.detectedFormatted}</span>
            </TechnicalSmall>

            <div className="flex items-center gap-3">
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
                  className="text-[#5F625F] dark:text-muted-foreground hover:text-foreground cursor-pointer text-[11px]"
                  data-testid="view-previous-snapshot"
                >
                  Prior &rarr;
                </button>
              )}

              {change.currentSnapshotId && onViewSnapshot && (
                <button
                  type="button"
                  onClick={() => onViewSnapshot(change.currentSnapshotId)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#3568C8] hover:underline cursor-pointer transition-colors"
                  data-testid="view-current-snapshot"
                >
                  <span>Snapshot &rarr;</span>
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
          </div>
        </div>
      )}
    </article>
  );
};

ChangeStoryCard.displayName = 'ChangeStoryCard';
