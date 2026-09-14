import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { useFindings } from '../../../../hooks/queries/useFindings';
import type { FindingSeverity } from '../../../../types/api/finding.dto';
import type { InfrastructureFindingsSectionProps } from './InfrastructureFindingsSection.types';

const SEVERITY_STYLES: Record<FindingSeverity, { text: string; bg: string; border: string }> = {
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
 * Authoritative Infrastructure Findings Integration Surface (WX-911 / WX-1017).
 *
 * Displays active infrastructure findings directly within the Infrastructure Experience:
 * - Product instrument container with #FFFFFF surface and #E1E1DC crisp border
 * - Frozen semantic badges and metadata tokens
 * - Honest calm empty state when zero findings are observed.
 * - Deep link to the investigation experience.
 */
export const InfrastructureFindingsSection: React.FC<InfrastructureFindingsSectionProps> = ({
  domainId,
  onViewFinding,
  onViewAllFindings,
  className = '',
  ...rest
}) => {
  const findingsQuery = useFindings(domainId);
  const findings = React.useMemo(() => {
    const raw = findingsQuery.data?.findings ?? [];
    return raw.filter((f) => f.status === 'ACTIVE' && f.state !== 'RESOLVED');
  }, [findingsQuery.data?.findings]);
  const isLoading = findingsQuery.isLoading;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} {...rest}>
        <div className="px-1 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
            INFRASTRUCTURE FINDINGS
          </span>
        </div>
        <div className="rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card p-6 animate-pulse space-y-3">
          <div className="h-4 bg-[#FAFAF8] dark:bg-surface-secondary rounded w-1/4" />
          <div className="h-3 bg-[#FAFAF8] dark:bg-surface-secondary rounded w-3/4" />
        </div>
      </div>
    );
  }

  // 1. Calm Empty State: Model exists, but zero actionable findings observed
  if (findings.length === 0) {
    return (
      <div
        className={`space-y-4 ${className}`}
        data-testid="infrastructure-findings-empty"
        {...rest}
      >
        <div className="px-1 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
            INFRASTRUCTURE FINDINGS
          </span>
        </div>
        <div className="rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card p-7 flex items-start gap-4 shadow-[0_1px_2px_rgba(16,24,20,0.035)]">
          <div className="p-2 rounded-xl bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-[#5F625F] dark:text-muted-foreground flex-shrink-0">
            <Icon icon={ShieldCheck} size="small" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">
              No infrastructure findings
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No actionable infrastructure findings were observed in the latest understanding.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Populated Findings Surface
  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid="infrastructure-findings-section"
      {...rest}
    >
      <div className="px-1 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
          INFRASTRUCTURE FINDINGS
        </span>
        <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground">
          {findings.length} {findings.length === 1 ? 'finding' : 'findings'}
        </span>
      </div>

      <div className="divide-y divide-[#EEEEEB] dark:divide-border-divider rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card overflow-hidden shadow-[0_1px_2px_rgba(16,24,20,0.035)]">
        {findings.map((finding) => {
          const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.INFORMATIONAL;
          return (
            <div
              key={finding.id}
              className="p-5 hover:bg-[#F7F8F6] dark:hover:bg-surface-row-hover transition-colors duration-150 ease-out space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
                    data-testid="finding-severity-badge"
                  >
                    {finding.severity}
                  </span>
                  {finding.category && (
                    <span className="text-[10px] font-mono uppercase text-[#5F625F] dark:text-muted-foreground border border-[#E2E2DD] dark:border-border px-1.5 py-0.5 rounded bg-[#F4F4F1] dark:bg-surface-metadata">
                      {finding.category}
                    </span>
                  )}
                  <h4 className="text-sm font-medium text-foreground">
                    {finding.title}
                  </h4>
                </div>

                {onViewFinding && (
                  <button
                    type="button"
                    onClick={() => onViewFinding(finding.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#3568C8] hover:underline transition-colors duration-150 flex-shrink-0 cursor-pointer focus-ring"
                  >
                    <span>Investigate finding</span>
                    <Icon icon={ArrowRight} size="small" />
                  </button>
                )}
              </div>

              {finding.explanation && (
                <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">
                  {finding.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* View all findings navigation action */}
      {onViewAllFindings && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onViewAllFindings}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F625F] dark:text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer focus-ring"
          >
            <span>View all findings</span>
            <Icon icon={ArrowRight} size="small" />
          </button>
        </div>
      )}
    </div>
  );
};

InfrastructureFindingsSection.displayName = 'InfrastructureFindingsSection';
