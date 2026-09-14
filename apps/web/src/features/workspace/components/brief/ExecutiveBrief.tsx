import React from 'react';
import { ArrowUpRight, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import {
  CardTitle,
  BodySmall,
  Eyebrow,
  TechnicalSmall,
} from '../../../../components/typography';
import { Cluster } from '../../../../components/layout';
import {
  LoadingState,
  QuietState,
  UnavailableState,
  ErrorState,
} from '../../../../components/states';
import { useDomainBrief } from '../../../../hooks/queries/useBrief';
import { useSnapshots } from '../../../../hooks/queries/useSnapshots';
import { formatUnderstandingFreshness } from '../../contracts/understanding-freshness.contract';
import type { ExecutiveBriefProps } from './ExecutiveBrief.types';

/**
 * Authoritative Executive Brief Experience (WX-903 / WX-1017 / WX-1018).
 *
 * Implements the refined, high-density Executive Brief:
 * - Summary before ceremony: Dense, calm, and readable without giant banner styling.
 * - Scoped strictly to the active domain ID and backend-synthesized intelligence.
 * - Accurately distinguishes Baseline Established (1st understanding) vs Posture Stable (verified comparison with 0 diffs).
 * - Displays posture status, executive narrative, and compact highlight signals.
 * - Preserves traceability to verified observations and generation timestamps.
 */
export const ExecutiveBrief: React.FC<ExecutiveBriefProps> = ({
  domainId,
  domainName,
  initialBrief,
  onSelectHighlight,
  className = '',
  ...rest
}) => {
  const briefQuery = useDomainBrief(domainId);
  const snapshotsQuery = useSnapshots(domainId);

  const brief = initialBrief || briefQuery.data;
  const isLoading = !initialBrief && briefQuery.isLoading;
  const error = briefQuery.error;

  const rawSnapshots =
    snapshotsQuery.data?.snapshots ||
    snapshotsQuery.data?.data ||
    (Array.isArray(snapshotsQuery.data) ? snapshotsQuery.data : []);
  const isBaseline = (brief as any)?.isBaseline || (brief as any)?.posture === 'BASELINE' || rawSnapshots.length === 1;

  // 1. Loading State (Calm, Truthful)
  if (isLoading) {
    return (
      <div className={`w-full py-8 flex items-center justify-center ${className}`} {...rest}>
        <LoadingState
          label={`Synthesizing executive brief for ${domainName}...`}
          description="Aggregating latest verified snapshots, routing telemetry, and perimeter findings"
        />
      </div>
    );
  }

  // 2. Error / Unavailable States
  if (error && !brief) {
    const isUnavailable =
      error.message?.includes('404') ||
      error.message?.includes('NOT_FOUND') ||
      error.message?.includes('INSUFFICIENT_SIGNAL');

    if (isUnavailable) {
      return (
        <div className={`w-full py-4 flex justify-center ${className}`} {...rest}>
          <div className="w-full max-w-2xl">
            <UnavailableState
              title="Infrastructure Brief Unavailable"
              description={`Nebula has not yet completed a comprehensive intelligence synthesis for ${domainName}.`}
              technicalNote="Continuous discovery will synthesize an infrastructure brief once baseline observations settle."
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full py-4 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <ErrorState
            error={error}
            title="Failed to Load Executive Brief"
            description={`Could not retrieve the current infrastructure intelligence for ${domainName}.`}
            retryLabel="Retry"
            onRetry={() => briefQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  // 3. Quiet State / Baseline Reassurance (WX-1018)
  if (!brief || (!brief.executiveSummary && (!brief.highlights || brief.highlights.length === 0))) {
    return (
      <div className={`w-full py-4 flex justify-center ${className}`} {...rest}>
        <div className="w-full max-w-2xl">
          <QuietState
            title={isBaseline ? 'Infrastructure Baseline Established' : 'Infrastructure Posture Stable'}
            description={
              isBaseline
                ? `Nebula has established the first verified understanding of this infrastructure. Future understandings will provide the basis for change detection.`
                : `Nebula has verified the current infrastructure state. No meaningful changes were detected against the previous understanding.`
            }
          />
        </div>
      </div>
    );
  }

  const hasCritical = brief.highlights?.some((h) => h.severity === 'CRITICAL');
  const hasHigh = brief.highlights?.some((h) => h.severity === 'HIGH');
  const statusLabel = hasCritical
    ? 'Critical Attention'
    : hasHigh
    ? 'Attention Required'
    : isBaseline
    ? 'Baseline Established'
    : 'Posture Stable';

  const statusColor = hasCritical
    ? 'text-[#A93442] bg-[#FDEBEC] border-[#E9B3B9]'
    : hasHigh
    ? 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5]'
    : 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]';

  const accentBorderColor = hasCritical
    ? '#C94B58'
    : hasHigh
    ? '#C98224'
    : '#1F9D73';

  const StatusIcon = hasCritical ? ShieldAlert : hasHigh ? AlertTriangle : CheckCircle2;

  // 4. Refined Executive Brief Card (Authoritative Primary Premium Surface - WX-1017 / WX-1018)
  return (
    <div
      className={`w-full bg-[#FFFFFF] dark:bg-card border border-[#E2E2DE] dark:border-border rounded-2xl p-6 sm:p-8 lg:p-9 space-y-6 shadow-[0_2px_8px_rgba(16,24,20,0.045)] transition-all relative overflow-hidden ${className}`}
      style={{ borderTopColor: accentBorderColor, borderTopWidth: '3px' }}
      data-testid="executive-brief-surface"
      {...rest}
    >
      {/* Header Eyebrow & Posture Status */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
        <Cluster gap="xs" align="center" className="min-w-0">
          <Icon icon={Sparkles} size="small" className="text-[#3568C8] shrink-0" />
          <Eyebrow variant="muted" className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-[#5F625F] dark:text-muted-foreground shrink-0">
            Executive Brief
          </Eyebrow>
          {domainName && (
            <span className="text-xs font-mono text-muted-foreground/80 truncate">
              &bull; {domainName}
            </span>
          )}
        </Cluster>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-medium ${statusColor}`}
          data-testid="executive-brief-posture-badge"
        >
          <Icon icon={StatusIcon} size="small" />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Authoritative Executive Narrative */}
      <div className="space-y-4">
        {brief.executiveSummary.split('\n\n').map((paragraph, index) => (
          <p
            key={index}
            className="text-base sm:text-lg leading-relaxed text-foreground font-normal tracking-[-0.01em]"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Key Attention Points / Highlights */}
      {brief.highlights && brief.highlights.length > 0 && (
        <div className="space-y-4 pt-5 border-t border-[#EEEEEB] dark:border-border-divider">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold tracking-wider uppercase text-[#5F625F] dark:text-muted-foreground">
              Key Developments ({brief.highlights.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {brief.highlights.map((highlight) => {
              const highlightSev = highlight.severity;
              const sevClass =
                highlightSev === 'CRITICAL'
                  ? 'bg-[#FDEBEC] text-[#A93442] border-[#E9B3B9]'
                  : highlightSev === 'HIGH'
                  ? 'bg-[#FFF0F1] text-[#C24D57] border-[#F0C3C7]'
                  : highlightSev === 'MEDIUM'
                  ? 'bg-[#FFF4E3] text-[#B86F18] border-[#F0D3A5]'
                  : 'bg-[#EEF4FF] text-[#3568C8] border-[#C8D8F6]';

              return (
                <div
                  key={highlight.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectHighlight?.(highlight.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectHighlight?.(highlight.id);
                    }
                  }}
                  className="p-4 rounded-xl border border-[#E7E7E3] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated hover:border-[#DADAD5] dark:hover:border-border-strong transition-all duration-150 ease-out cursor-pointer group space-y-2 focus-ring select-none shadow-[0_1px_2px_rgba(16,24,20,0.035)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {highlightSev && (
                        <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${sevClass}`}>
                          {highlightSev}
                        </span>
                      )}
                      <CardTitle className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-[#3568C8] transition-colors truncate">
                        {highlight.title}
                      </CardTitle>
                    </div>
                    <Icon
                      icon={ArrowUpRight}
                      size="small"
                      className="text-muted-foreground/60 group-hover:text-[#3568C8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
                    />
                  </div>

                  <BodySmall variant="muted" className="text-xs sm:text-[13px] leading-relaxed line-clamp-2">
                    {highlight.summary}
                  </BodySmall>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata & Verification Lineage */}
      <div className="pt-4 border-t border-[#EEEEEB] dark:border-border-divider flex flex-wrap items-center justify-between gap-3 text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
        <TechnicalSmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground">
          {brief.stableObservationsCount} observations verified
        </TechnicalSmall>
        <TechnicalSmall variant="muted" className="text-xs text-[#5F625F] dark:text-muted-foreground">
          {formatUnderstandingFreshness(brief.generatedAt)}
        </TechnicalSmall>
      </div>
    </div>
  );
};

ExecutiveBrief.displayName = 'ExecutiveBrief';
