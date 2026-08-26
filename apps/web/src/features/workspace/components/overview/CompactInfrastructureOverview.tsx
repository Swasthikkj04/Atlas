import React from 'react';
import {
  Cloud,
  Server,
  Layers,
  Cpu,
  Network,
  ShieldCheck,
  Terminal,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { useDomainOverview } from '../../../../hooks/queries/useOverview';
import {
  resolveCompactInfrastructure,
  type CompactInfrastructureCategory,
} from '../../contracts/compact-infrastructure.contract';
import type { CompactInfrastructureOverviewProps } from './CompactInfrastructureOverview.types';

const CATEGORY_ICONS: Record<CompactInfrastructureCategory, typeof Cloud> = {
  edge: Cloud,
  web_server: Server,
  application: Layers,
  hosting: Cpu,
  dns: Network,
  tls: ShieldCheck,
  ip_address: Terminal,
  open_ports: ArrowUpRight,
};

/**
 * Authoritative Compact Infrastructure Overview Card (WX-909 / WX-1017).
 *
 * Implements the reference-inspired compact infrastructure inventory instrument:
 * - Product instrument visual feel with #FFFFFF card surface and #E1E1DC crisp border
 * - Subdued row dividers (#EEEEEB) and calm row hover states (#F7F8F6)
 * - Visually prominent technical values with neutral metadata icon containers (#F4F4F1 / #E2E2DD)
 * - Fast, calm transitions (150-180ms ease-out).
 */
export const CompactInfrastructureOverview: React.FC<CompactInfrastructureOverviewProps> = ({
  domainId,
  domainName,
  onViewFullInfrastructure,
  onSelectCategory,
  className = '',
  ...rest
}) => {
  const overviewQuery = useDomainOverview(domainId);
  const data = overviewQuery.data;

  const resolution = resolveCompactInfrastructure(domainId, domainName, data);

  return (
    <div
      className={`w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card overflow-hidden shadow-[0_1px_2px_rgba(16,24,20,0.035)] transition-all ${className}`}
      data-testid="compact-infrastructure-overview"
      {...rest}
    >
      {/* 1. Header Bar */}
      <div className="px-5 py-3 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
          INFRASTRUCTURE OVERVIEW
        </span>
        <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
          {resolution.hasAnyDetected ? 'Active inventory' : 'Observing'}
        </span>
      </div>

      {/* 2. Eight Canonical Category Rows (Instrument Treatment) */}
      <div className="divide-y divide-[#EEEEEB] dark:divide-border-divider">
        {resolution.items.map((item) => {
          const IconComponent = CATEGORY_ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory ? onSelectCategory(item.id) : onViewFullInfrastructure?.()}
              aria-label={`${item.label}: ${item.value}`}
              className="w-full text-left px-5 py-3 flex items-center justify-between bg-transparent hover:bg-[#F7F8F6] dark:hover:bg-surface-row-hover active:bg-[#F1F6F3] dark:active:bg-surface-row-active transition-colors duration-150 ease-out cursor-pointer group focus-ring select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                <div className="p-1.5 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-[#5F625F] dark:text-muted-foreground group-hover:text-foreground group-hover:border-[#DCDCD7] dark:group-hover:border-border-strong transition-colors duration-150 flex-shrink-0">
                  <Icon icon={IconComponent} size="small" />
                </div>
                <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <div className="text-[11px] sm:w-28 font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground group-hover:text-foreground transition-colors duration-150 shrink-0">
                    {item.label}
                  </div>
                  <div className={`text-xs sm:text-[13px] font-mono truncate flex items-center gap-1.5 ${item.isDetected ? 'text-foreground font-medium' : 'text-[#5F625F]/60 dark:text-muted-foreground/60'}`}>
                    <span>{item.value}</span>
                    {item.details && (
                      <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground font-normal">
                        · {item.details}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 text-muted-foreground/50 group-hover:text-[#3568C8] group-hover:translate-x-0.5 transition-all duration-150">
                <Icon icon={ChevronRight} size="small" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Footer Action: View full infrastructure › */}
      {onViewFullInfrastructure && (
        <div className="border-t border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary px-5 py-3">
          <button
            type="button"
            onClick={onViewFullInfrastructure}
            className="w-full inline-flex items-center justify-between text-xs font-medium text-foreground hover:text-[#3568C8] transition-colors duration-150 cursor-pointer focus-ring group"
          >
            <span>View full infrastructure</span>
            <Icon
              icon={ChevronRight}
              size="small"
              className="text-muted-foreground group-hover:text-[#3568C8] group-hover:translate-x-0.5 transition-transform duration-150"
            />
          </button>
        </div>
      )}
    </div>
  );
};

CompactInfrastructureOverview.displayName = 'CompactInfrastructureOverview';
