import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Eyebrow } from '../../../../components/typography';
import { Stack, Cluster } from '../../../../components/layout';
import { DomainFavicon } from '../identity';
import type { MonitoredInfrastructureListProps } from './WorkspaceIntelligenceLanding.types';

const STATUS_BADGE_CLASSES = {
  positive: 'text-[#178A68] bg-[#EAF7F2] border-[#B9E5D6]',
  attention: 'text-[#B86F18] bg-[#FFF4E3] border-[#F0D3A5]',
  neutral: 'text-[#5F625F] dark:text-muted-foreground bg-[#F4F4F1] dark:bg-surface-metadata border-[#E2E2DD] dark:border-border',
  informational: 'text-[#3568C8] bg-[#EEF4FF] border-[#C8D8F6]',
};

/**
 * Sophisticated Monitored Infrastructure List (WX-1025).
 *
 * Implements the cross-domain list view:
 * - Direct, 1-click entry into domain workspace (`View →`)
 * - Domain favicon, name, status badge, and authoritative summary note
 * - Visual distinction of what exists, what is healthy, and what changed
 */
export const MonitoredInfrastructureList: React.FC<MonitoredInfrastructureListProps> = ({
  brief,
  onSelectDomain,
  onAddDomain,
  className = '',
}) => {
  return (
    <Stack gap="md" className={`w-full ${className}`} data-testid="monitored-infrastructure-section">
      {/* List Header */}
      <Cluster justify="between" align="center" className="pb-1">
        <Cluster gap="xs" align="center">
          <Eyebrow
            variant="muted"
            className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#5F625F] dark:text-muted-foreground font-semibold"
          >
            MONITORED INFRASTRUCTURE
          </Eyebrow>
        </Cluster>

        <Cluster gap="sm" align="center">
          <span className="font-mono text-xs text-[#5F625F] dark:text-muted-foreground uppercase">
            {brief.totalDomains} {brief.totalDomains === 1 ? 'DOMAIN' : 'DOMAINS'}
          </span>

          {brief.totalDomains < 4 && onAddDomain && (
            <button
              type="button"
              onClick={onAddDomain}
              className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#3568C8] hover:underline cursor-pointer transition-colors"
              data-testid="add-domain-button"
            >
              <Icon icon={Plus} size="small" />
              <span>Add domain</span>
            </button>
          )}
        </Cluster>
      </Cluster>

      {/* Structured Domain List Container */}
      <div
        className="rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-[0_1px_2px_rgba(16,24,20,0.035)] divide-y divide-[#EEEEEB] dark:divide-border-divider overflow-hidden"
        data-testid="monitored-domains-list"
      >
        {brief.domains.map((item) => (
          <div
            key={item.domainId}
            onClick={() => onSelectDomain(item.domainId)}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-[#FCFCFA] dark:hover:bg-surface-elevated transition-colors duration-150 cursor-pointer group"
            data-testid={`domain-brief-row-${item.domainId}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectDomain(item.domainId);
              }
            }}
          >
            {/* Left: Favicon + Domain Name & Status Badge */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DomainFavicon domain={item.domainName} size="compact" />
                <h3 className="text-sm sm:text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {item.domainName}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${STATUS_BADGE_CLASSES[item.statusVariant]}`}
                  data-testid={`domain-status-badge-${item.domainId}`}
                >
                  {item.statusLabel}
                </span>
              </div>

              {/* Subline: Last Understood Timestamp + Authoritative Summary Note */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
                <span>{item.lastUnderstoodFormatted}</span>
                <span className="hidden sm:inline text-[#5F625F]/50">&bull;</span>
                <span className="text-foreground/80 dark:text-muted-foreground font-sans">
                  {item.summaryNote}
                </span>
              </div>
            </div>

            {/* Right: 1-Click Navigation Affordance */}
            <div className="flex items-center gap-1 text-xs font-mono font-medium text-[#3568C8] group-hover:underline shrink-0 self-end sm:self-center">
              <span>View</span>
              <Icon
                icon={ArrowRight}
                size="small"
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </div>
        ))}
      </div>
    </Stack>
  );
};

MonitoredInfrastructureList.displayName = 'MonitoredInfrastructureList';
